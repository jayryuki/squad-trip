import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
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
    visibility: str = "private"  # 'public' | 'shared' | 'private'
    visible_to: List[int] = []  # List of user IDs for 'shared' visibility


class PackingItemUpdateRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    is_packed: Optional[bool] = None
    assigned_user_id: Optional[int] = None
    is_shared: Optional[bool] = None
    visibility: Optional[str] = None
    visible_to: Optional[List[int]] = None


class PackingItemResponse(BaseModel):
    id: int
    name: str
    category: Optional[str]
    quantity: int
    is_packed: bool
    assigned_user_id: Optional[int]
    is_shared: bool
    visibility: str
    visible_to: List[int]
    creator_id: Optional[int] = None
    created_at: str

    class Config:
        from_attributes = True


def item_to_response(item: PackingItem) -> PackingItemResponse:
    return PackingItemResponse(
        id=item.id,
        name=item.name,
        category=item.category,
        quantity=item.quantity,
        is_packed=item.is_packed,
        assigned_user_id=item.assigned_user_id,
        is_shared=item.is_shared,
        visibility=item.visibility or "public",
        visible_to=json.loads(item.visible_to or "[]"),
        creator_id=item.creator_id,
        created_at=item.created_at.isoformat() if item.created_at else "",
    )


def can_view_item(item: PackingItem, user_id: int) -> bool:
    """Check if user can view this packing item based on visibility."""
    visibility = item.visibility or "public"

    if visibility == "public":
        return True
    elif visibility == "private":
        return item.creator_id == user_id
    elif visibility == "shared":
        visible_to = json.loads(item.visible_to or "[]")
        return user_id in visible_to or item.creator_id == user_id
    return False


@router.get("", response_model=list[PackingItemResponse])
async def list_packing(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    user_id = member.user_id
    result = await db.execute(select(PackingItem).where(PackingItem.trip_id == trip_id))
    items = result.scalars().all()

    # Filter items based on visibility
    visible_items = [item for item in items if can_view_item(item, user_id)]
    return [item_to_response(item) for item in visible_items]


@router.get("/search")
async def search_packing(
    trip_id: int,
    q: str,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    """Search items user can see, return owner info."""
    user_id = member.user_id
    result = await db.execute(select(PackingItem).where(PackingItem.trip_id == trip_id))
    items = result.scalars().all()

    # Filter visible items and search
    visible_items = [item for item in items if can_view_item(item, user_id)]
    query = q.lower()
    matched_items = [item for item in visible_items if query in item.name.lower()]

    return [item_to_response(item) for item in matched_items]


@router.post("", response_model=PackingItemResponse)
async def create_packing_item(
    trip_id: int,
    req: PackingItemCreateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    item = PackingItem(
        trip_id=trip_id,
        creator_id=member.user_id,
        name=req.name,
        category=req.category,
        quantity=req.quantity,
        assigned_user_id=req.assigned_user_id,
        is_shared=req.is_shared,
        visibility=req.visibility,
        visible_to=json.dumps(req.visible_to),
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item_to_response(item)


@router.put("/{item_id}", response_model=PackingItemResponse)
async def update_packing_item(
    trip_id: int,
    item_id: int,
    req: PackingItemUpdateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    user_id = member.user_id
    result = await db.execute(
        select(PackingItem).where(
            PackingItem.id == item_id, PackingItem.trip_id == trip_id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Packing item not found")

    # Check authorization for is_packed toggle
    if req.is_packed is not None:
        # Only owner can uncheck (set to False)
        # Anyone can check (set to True)
        if req.is_packed is False and item.creator_id != user_id:
            raise HTTPException(
                status_code=403, detail="Only the creator can uncheck this item"
            )

    # Only owner can edit other fields
    is_owner = item.creator_id == user_id
    if not is_owner:
        # Check if user is trying to edit fields other than is_packed
        edit_fields = [
            f
            for f in [
                req.name,
                req.category,
                req.quantity,
                req.assigned_user_id,
                req.is_shared,
                req.visibility,
                req.visible_to,
            ]
            if f is not None
        ]
        if edit_fields:
            raise HTTPException(
                status_code=403, detail="Only the creator can edit this item"
            )

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
    if req.visibility is not None:
        item.visibility = req.visibility
    if req.visible_to is not None:
        item.visible_to = json.dumps(req.visible_to)

    await db.commit()
    await db.refresh(item)
    return item_to_response(item)


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

    # Only owner can delete
    if item.creator_id != member.user_id:
        raise HTTPException(
            status_code=403, detail="Only the creator can delete this item"
        )

    await db.delete(item)
    await db.commit()
    return {"message": "Packing item deleted"}
