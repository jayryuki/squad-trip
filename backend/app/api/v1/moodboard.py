from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional, Literal
from app.core.database import get_db
from app.core.storage import save_upload, generate_thumbnail
from app.api.deps import get_current_user, get_trip_member
from app.models.user import User
from app.models.trip import TripMember, TripSettings
from app.models.user_moodboard import UserMoodboard
from app.models.user import User

router = APIRouter()


class MoodboardItem(BaseModel):
    id: str
    type: Literal["outfit", "moodboard"]
    image_url: str
    caption: Optional[str] = None
    name: Optional[str] = None
    created_at: str


class PersonalMoodboardResponse(BaseModel):
    id: int
    user_id: int
    items: list[MoodboardItem]
    thumbnail_url: Optional[str]


class UserMoodboardItem(BaseModel):
    user_id: int
    user_display_name: str
    user_avatar_url: Optional[str]
    user_emoji: Optional[str]
    items: list[MoodboardItem]
    thumbnail_url: Optional[str]
    item_count: int


class SharedMoodboardResponse(BaseModel):
    users: list[UserMoodboardItem]
    total_items: int
    threshold: int
    show_thumbnails: bool


class MoodboardItemCreate(BaseModel):
    type: Literal["outfit", "moodboard"]
    name: Optional[str] = None
    caption: Optional[str] = None


@router.get("/personal", response_model=PersonalMoodboardResponse)
async def get_personal_moodboard(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(UserMoodboard).where(
            UserMoodboard.trip_id == trip_id,
            UserMoodboard.user_id == current_user.id,
        )
    )
    moodboard = result.scalar_one_or_none()

    if not moodboard:
        return PersonalMoodboardResponse(
            id=0,
            user_id=current_user.id,
            items=[],
            thumbnail_url=None,
        )

    return PersonalMoodboardResponse.model_validate(moodboard)


@router.get("/shared", response_model=SharedMoodboardResponse)
async def get_shared_moodboard(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    settings_result = await db.execute(
        select(TripSettings).where(TripSettings.trip_id == trip_id)
    )
    settings = settings_result.scalar_one_or_none()
    threshold = settings.moodboard_thumbnail_threshold if settings else 20

    result = await db.execute(
        select(UserMoodboard).where(UserMoodboard.trip_id == trip_id)
    )
    user_moodboards = result.scalars().all()

    users_result = await db.execute(
        select(User.id, User.display_name, User.avatar_url, User.emoji)
        .join(TripMember, TripMember.user_id == User.id)
        .where(TripMember.trip_id == trip_id)
    )
    users_map = {
        u.id: {
            "display_name": u.display_name,
            "avatar_url": u.avatar_url,
            "emoji": u.emoji,
        }
        for u in users_result.all()
    }

    user_moodboards_map = {um.user_id: um for um in user_moodboards}

    users_list = []
    total_items = 0

    for user_id, user_info in users_map.items():
        um = user_moodboards_map.get(user_id)
        items = um.items if um and um.items else []
        item_count = len(items)
        total_items += item_count

        users_list.append(
            UserMoodboardItem(
                user_id=user_id,
                user_display_name=user_info["display_name"],
                user_avatar_url=user_info["avatar_url"],
                user_emoji=user_info["emoji"],
                items=items,
                thumbnail_url=um.thumbnail_url if um else None,
                item_count=item_count,
            )
        )

    users_list.sort(key=lambda x: x.user_display_name.lower())

    return SharedMoodboardResponse(
        users=users_list,
        total_items=total_items,
        threshold=threshold,
        show_thumbnails=len(users_list) >= threshold,
    )


@router.post("/items", response_model=MoodboardItem)
async def add_moodboard_item(
    trip_id: int,
    type: str = Form(...),
    name: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    member: TripMember = Depends(get_trip_member),
):
    if not file and type == "moodboard":
        raise HTTPException(
            status_code=400, detail="Image file required for moodboard items"
        )

    image_url = None
    if file:
        image_url = await save_upload(file, f"trips/{trip_id}/moodboard")

    result = await db.execute(
        select(UserMoodboard).where(
            UserMoodboard.trip_id == trip_id,
            UserMoodboard.user_id == current_user.id,
        )
    )
    moodboard = result.scalar_one_or_none()

    if not moodboard:
        moodboard = UserMoodboard(
            trip_id=trip_id,
            user_id=current_user.id,
            items=[],
        )
        db.add(moodboard)

    import uuid

    new_item = MoodboardItem(
        id=str(uuid.uuid4()),
        type=type,
        image_url=image_url or "",
        caption=caption,
        name=name,
        created_at="",
    )
    new_item.created_at = str(moodboard.updated_at) if moodboard.updated_at else ""

    moodboard.items = (moodboard.items or []) + [new_item.model_dump()]
    await db.commit()

    await regenerate_thumbnail(trip_id, db)

    return new_item


@router.delete("/items/{item_id}")
async def delete_moodboard_item(
    trip_id: int,
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(UserMoodboard).where(
            UserMoodboard.trip_id == trip_id,
            UserMoodboard.user_id == current_user.id,
        )
    )
    moodboard = result.scalar_one_or_none()

    if not moodboard or not moodboard.items:
        raise HTTPException(status_code=404, detail="Moodboard item not found")

    moodboard.items = [item for item in moodboard.items if item.get("id") != item_id]
    await db.commit()

    await regenerate_thumbnail(trip_id, db)

    return {"message": "Moodboard item deleted"}


async def regenerate_thumbnail(trip_id: int, db: AsyncSession):
    result = await db.execute(
        select(UserMoodboard).where(UserMoodboard.trip_id == trip_id)
    )
    user_moodboards = result.scalars().all()

    for moodboard in user_moodboards:
        if moodboard.items and len(moodboard.items) > 0:
            image_urls = [
                item.get("image_url")
                for item in moodboard.items
                if item.get("image_url")
            ]
            if image_urls:
                thumbnail_url = generate_thumbnail(
                    image_urls,
                    output_prefix=f"thumb_{moodboard.user_id}_{trip_id}",
                )
                moodboard.thumbnail_url = thumbnail_url
        else:
            moodboard.thumbnail_url = None

    await db.commit()
