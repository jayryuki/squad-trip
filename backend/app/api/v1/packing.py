from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.api.deps import get_current_user, get_trip_member
from app.models.user import User
from app.models.trip import TripMember
from app.models.packing import PackingItem

router = APIRouter()


class PackingItemCreateRequest(BaseModel):
    name: str
    category: Optional[str] = None
    quantity: int = 1
    assigned_user_id: Optional[int] = None
    is_shared: bool = True


class PackingItemUpdateRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    is_packed: Optional[bool] = None
    assigned_user_id: Optional[int] = None
    is_shared: Optional[bool] = None


class PackingItemResponse(BaseModel):
    id: int
    name: str
    category: Optional[str]
    quantity: int
    is_packed: bool
    assigned_user_id: Optional[int]
    is_shared: bool

    class Config:
        from_attributes = True


@router.get("", response_model=list[PackingItemResponse])
async def list_packing(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(select(PackingItem).where(PackingItem.trip_id == trip_id))
    items = result.scalars().all()
    return [PackingItemResponse.model_validate(i) for i in items]


@router.post("", response_model=PackingItemResponse)
async def create_packing_item(
    trip_id: int,
    req: PackingItemCreateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    item = PackingItem(
        trip_id=trip_id,
        name=req.name,
        category=req.category,
        quantity=req.quantity,
        assigned_user_id=req.assigned_user_id,
        is_shared=req.is_shared,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return PackingItemResponse.model_validate(item)


@router.put("/{item_id}", response_model=PackingItemResponse)
async def update_packing_item(
    trip_id: int,
    item_id: int,
    req: PackingItemUpdateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(PackingItem).where(
            PackingItem.id == item_id, PackingItem.trip_id == trip_id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Packing item not found")

    if req.name is not None:
        item.name = req.name
    if req.category is not None:
        item.category = req.category
    if req.quantity is not None:
        item.quantity = req.quantity
    if req.is_packed is not None:
        item.is_packed = req.is_packed
    if req.assigned_user_id is not None:
        item.assigned_user_id = req.assigned_user_id
    if req.is_shared is not None:
        item.is_shared = req.is_shared

    await db.commit()
    await db.refresh(item)
    return PackingItemResponse.model_validate(item)


@router.delete("/{item_id}")
async def delete_packing_item(
    trip_id: int,
    item_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(PackingItem).where(
            PackingItem.id == item_id, PackingItem.trip_id == trip_id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Packing item not found")

    await db.delete(item)
    await db.commit()
    return {"message": "Packing item deleted"}
