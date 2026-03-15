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
from app.models.photo import Photo

router = APIRouter()


class PhotoCreateRequest(BaseModel):
    image_url: str
    caption: Optional[str] = None


class PhotoResponse(BaseModel):
    id: int
    image_url: str
    caption: Optional[str]
    uploaded_by_user_id: int
    created_at: str

    class Config:
        from_attributes = True


@router.get("", response_model=list[PhotoResponse])
async def list_photos(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(select(Photo).where(Photo.trip_id == trip_id))
    photos = result.scalars().all()

    return [
        PhotoResponse(
            id=p.id,
            image_url=p.image_url,
            caption=p.caption,
            uploaded_by_user_id=p.uploaded_by_user_id,
            created_at=p.created_at.isoformat(),
        )
        for p in photos
    ]


@router.post("", response_model=PhotoResponse)
async def create_photo(
    trip_id: int,
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    member: TripMember = Depends(get_trip_member),
):
    image_url = await save_upload(file, f"trips/{trip_id}/photos")
    photo = Photo(
        trip_id=trip_id,
        image_url=image_url,
        caption=caption,
        uploaded_by_user_id=current_user.id,
    )
    db.add(photo)
    await db.commit()
    await db.refresh(photo)
    return PhotoResponse(
        id=photo.id,
        image_url=photo.image_url,
        caption=photo.caption,
        uploaded_by_user_id=photo.uploaded_by_user_id,
        created_at=photo.created_at.isoformat(),
    )


@router.delete("/{photo_id}")
async def delete_photo(
    trip_id: int,
    photo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Photo).where(Photo.id == photo_id, Photo.trip_id == trip_id)
    )
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    await db.delete(photo)
    await db.commit()
    return {"message": "Photo deleted"}
