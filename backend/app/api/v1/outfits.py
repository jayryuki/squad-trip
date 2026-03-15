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
from app.models.outfit import Outfit

router = APIRouter()


class OutfitCreateRequest(BaseModel):
    name: str
    image_url: Optional[str] = None


class OutfitUpdateRequest(BaseModel):
    name: Optional[str] = None
    image_url: Optional[str] = None


class OutfitResponse(BaseModel):
    id: int
    name: str
    image_url: Optional[str]
    created_by_user_id: int

    class Config:
        from_attributes = True


@router.get("", response_model=list[OutfitResponse])
async def list_outfits(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(select(Outfit).where(Outfit.trip_id == trip_id))
    outfits = result.scalars().all()
    return [OutfitResponse.model_validate(o) for o in outfits]


@router.post("", response_model=OutfitResponse)
async def create_outfit(
    trip_id: int,
    name: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    member: TripMember = Depends(get_trip_member),
):
    image_url = None
    if file:
        image_url = await save_upload(file, f"trips/{trip_id}/outfits")
    outfit = Outfit(
        trip_id=trip_id,
        name=name,
        image_url=image_url,
        created_by_user_id=current_user.id,
    )
    db.add(outfit)
    await db.commit()
    await db.refresh(outfit)
    return OutfitResponse.model_validate(outfit)


@router.put("/{outfit_id}", response_model=OutfitResponse)
async def update_outfit(
    trip_id: int,
    outfit_id: int,
    req: OutfitUpdateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Outfit).where(Outfit.id == outfit_id, Outfit.trip_id == trip_id)
    )
    outfit = result.scalar_one_or_none()
    if not outfit:
        raise HTTPException(status_code=404, detail="Outfit not found")

    if req.name is not None:
        outfit.name = req.name
    if req.image_url is not None:
        outfit.image_url = req.image_url

    await db.commit()
    await db.refresh(outfit)
    return OutfitResponse.model_validate(outfit)


@router.delete("/{outfit_id}")
async def delete_outfit(
    trip_id: int,
    outfit_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Outfit).where(Outfit.id == outfit_id, Outfit.trip_id == trip_id)
    )
    outfit = result.scalar_one_or_none()
    if not outfit:
        raise HTTPException(status_code=404, detail="Outfit not found")

    await db.delete(outfit)
    await db.commit()
    return {"message": "Outfit deleted"}
