from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.storage import save_upload
from app.api.deps import get_current_user, get_trip_member
from app.models.user import User
from app.models.trip import TripMember
from app.models.moodboard import MoodboardItem

router = APIRouter()


class MoodboardItemCreateRequest(BaseModel):
    image_url: str
    caption: Optional[str] = None


class MoodboardItemResponse(BaseModel):
    id: int
    image_url: str
    caption: Optional[str]
    created_by_user_id: int

    class Config:
        from_attributes = True


@router.get("", response_model=list[MoodboardItemResponse])
async def list_moodboard(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(MoodboardItem).where(MoodboardItem.trip_id == trip_id)
    )
    items = result.scalars().all()
    return [MoodboardItemResponse.model_validate(i) for i in items]


@router.post("", response_model=MoodboardItemResponse)
async def create_moodboard_item(
    trip_id: int,
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    member: TripMember = Depends(get_trip_member),
):
    image_url = await save_upload(file, f"trips/{trip_id}/moodboard")
    item = MoodboardItem(
        trip_id=trip_id,
        image_url=image_url,
        caption=caption,
        created_by_user_id=current_user.id,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return MoodboardItemResponse.model_validate(item)


@router.delete("/{item_id}")
async def delete_moodboard_item(
    trip_id: int,
    item_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(MoodboardItem).where(
            MoodboardItem.id == item_id, MoodboardItem.trip_id == trip_id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Moodboard item not found")

    await db.delete(item)
    await db.commit()
    return {"message": "Moodboard item deleted"}
