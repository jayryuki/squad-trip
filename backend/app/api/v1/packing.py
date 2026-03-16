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
    list_name: Optional[str] = None  # For multiple personal lists


class PackingItemUpdateRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    is_packed: Optional[bool] = None
    assigned_user_id: Optional[int] = None
    is_shared: Optional[bool] = None
    visibility: Optional[str] = None
    visible_to: Optional[List[int]] = None
    list_name: Optional[str] = None


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
    list_name: Optional[str] = None
    created_at: str
    user_packed: Optional[bool] = None  # Current user's packed status

    class Config:
        from_attributes = True


def item_to_response(item: PackingItem, user_id: int) -> PackingItemResponse:
    packed_status = json.loads(item.packed_status or "{}")
    user_packed = packed_status.get(str(user_id), False)

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
        list_name=item.list_name,
        created_at=item.created_at.isoformat() if item.created_at else "",
        user_packed=user_packed,
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
    return [item_to_response(item, user_id) for item in visible_items]


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

    return [item_to_response(item, user_id) for item in matched_items]


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
        list_name=req.list_name,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item_to_response(item, member.user_id)


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
                req.list_name,
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
    if req.list_name is not None:
        item.list_name = req.list_name

    await db.commit()
    await db.refresh(item)
    return item_to_response(item, user_id)


class TogglePackedRequest(BaseModel):
    is_packed: bool


@router.post("/{item_id}/toggle-packed", response_model=PackingItemResponse)
async def toggle_packed_status(
    trip_id: int,
    item_id: int,
    req: TogglePackedRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    """Toggle the current user's packed status for an item."""
    user_id = member.user_id
    result = await db.execute(
        select(PackingItem).where(
            PackingItem.id == item_id, PackingItem.trip_id == trip_id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Packing item not found")

    # Check if user can view this item
    if not can_view_item(item, user_id):
        raise HTTPException(status_code=403, detail="Cannot access this item")

    # Update packed_status for this user
    packed_status = json.loads(item.packed_status or "{}")
    packed_status[str(user_id)] = req.is_packed
    item.packed_status = json.dumps(packed_status)

    await db.commit()
    await db.refresh(item)
    return item_to_response(item, user_id)


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


class CopyItemRequest(BaseModel):
    list_name: Optional[str] = None


@router.post("/{item_id}/copy", response_model=PackingItemResponse)
async def copy_item_to_personal_list(
    trip_id: int,
    item_id: int,
    req: CopyItemRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    """Copy an existing item to the current user's personal list."""
    result = await db.execute(
        select(PackingItem).where(
            PackingItem.id == item_id, PackingItem.trip_id == trip_id
        )
    )
    source_item = result.scalar_one_or_none()
    if not source_item:
        raise HTTPException(status_code=404, detail="Packing item not found")

    new_item = PackingItem(
        trip_id=trip_id,
        creator_id=member.user_id,
        name=source_item.name,
        category=source_item.category,
        quantity=source_item.quantity,
        is_packed=False,
        assigned_user_id=None,
        is_shared=False,
        visibility="private",
        visible_to="[]",
        list_name=req.list_name,
    )
    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)
    return item_to_response(new_item, member.user_id)


class PersonalListCreateRequest(BaseModel):
    name: str


class PersonalListUpdateRequest(BaseModel):
    name: str


class PersonalListResponse(BaseModel):
    name: str
    item_count: int


@router.get("/lists", response_model=list[PersonalListResponse])
async def get_personal_lists(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    """Get all personal list names for the current user."""
    user_id = member.user_id
    result = await db.execute(
        select(PackingItem.list_name)
        .where(
            PackingItem.trip_id == trip_id,
            PackingItem.creator_id == user_id,
            PackingItem.list_name.isnot(None),
        )
        .distinct()
    )
    list_names = result.scalars().all()

    response = []
    for list_name in list_names:
        count_result = await db.execute(
            select(PackingItem).where(
                PackingItem.trip_id == trip_id,
                PackingItem.creator_id == user_id,
                PackingItem.list_name == list_name,
            )
        )
        items = count_result.scalars().all()
        response.append(PersonalListResponse(name=list_name, item_count=len(items)))

    default_result = await db.execute(
        select(PackingItem).where(
            PackingItem.trip_id == trip_id,
            PackingItem.creator_id == user_id,
            PackingItem.list_name.is_(None),
        )
    )
    default_items = default_result.scalars().all()
    if len(default_items) > 0:
        response.insert(
            0, PersonalListResponse(name="My Items", item_count=len(default_items))
        )

    return response


@router.post("/lists", response_model=PersonalListResponse)
async def create_personal_list(
    trip_id: int,
    req: PersonalListCreateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    """Create a new personal list. Just validates the name."""
    existing_result = await db.execute(
        select(PackingItem.list_name)
        .where(
            PackingItem.trip_id == trip_id,
            PackingItem.creator_id == member.user_id,
            PackingItem.list_name == req.name,
        )
        .distinct()
    )
    existing = existing_result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="List already exists")

    return PersonalListResponse(name=req.name, item_count=0)


@router.put("/lists/{list_name}", response_model=PersonalListResponse)
async def rename_personal_list(
    trip_id: int,
    list_name: str,
    req: PersonalListUpdateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    """Rename a personal list."""
    user_id = member.user_id
    from sqlalchemy import update

    result = await db.execute(
        update(PackingItem)
        .where(
            PackingItem.trip_id == trip_id,
            PackingItem.creator_id == user_id,
            PackingItem.list_name == list_name,
        )
        .values(list_name=req.name)
    )
    await db.commit()

    count_result = await db.execute(
        select(PackingItem).where(
            PackingItem.trip_id == trip_id,
            PackingItem.creator_id == user_id,
            PackingItem.list_name == req.name,
        )
    )
    items = count_result.scalars().all()
    return PersonalListResponse(name=req.name, item_count=len(items))


@router.delete("/lists/{list_name}")
async def delete_personal_list(
    trip_id: int,
    list_name: str,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    """Delete a personal list (moves items to default)."""
    user_id = member.user_id
    from sqlalchemy import update

    result = await db.execute(
        update(PackingItem)
        .where(
            PackingItem.trip_id == trip_id,
            PackingItem.creator_id == user_id,
            PackingItem.list_name == list_name,
        )
        .values(list_name=None)
    )
    await db.commit()
    return {"message": f"List '{list_name}' deleted, items moved to default"}


class ExportRequest(BaseModel):
    list_name: Optional[str] = None


class ImportItem(BaseModel):
    name: str
    category: Optional[str] = None
    quantity: int = 1


class ImportRequest(BaseModel):
    items: List[ImportItem]
    list_name: Optional[str] = None


class ImportResponse(BaseModel):
    imported_count: int


@router.post("/export")
async def export_packing_items(
    trip_id: int,
    req: ExportRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    """Export packing items as JSON."""
    user_id = member.user_id

    query = select(PackingItem).where(PackingItem.trip_id == trip_id)
    if req.list_name and req.list_name != "My Items":
        query = query.where(
            PackingItem.creator_id == user_id, PackingItem.list_name == req.list_name
        )
    elif req.list_name == "My Items":
        query = query.where(
            PackingItem.creator_id == user_id, PackingItem.list_name.is_(None)
        )

    result = await db.execute(query)
    items = result.scalars().all()

    export_data = [
        {
            "name": item.name,
            "category": item.category,
            "quantity": item.quantity,
            "is_shared": item.is_shared,
            "list_name": item.list_name,
        }
        for item in items
    ]
    return export_data


@router.post("/import", response_model=ImportResponse)
async def import_packing_items(
    trip_id: int,
    req: ImportRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    """Import packing items from JSON."""
    user_id = member.user_id
    imported_count = 0

    for item in req.items:
        new_item = PackingItem(
            trip_id=trip_id,
            creator_id=user_id,
            name=item.name,
            category=item.category,
            quantity=item.quantity,
            is_packed=False,
            assigned_user_id=None,
            is_shared=False,
            visibility="private",
            visible_to="[]",
            list_name=req.list_name,
        )
        db.add(new_item)
        imported_count += 1

    await db.commit()
    return ImportResponse(imported_count=imported_count)


class BulkUpdateRequest(BaseModel):
    item_ids: List[int]
    visibility: Optional[str] = None
    visible_to: Optional[List[int]] = None
    list_name: Optional[str] = None


class BulkUpdateResponse(BaseModel):
    updated_count: int


@router.post("/bulk-update", response_model=BulkUpdateResponse)
async def bulk_update_packing_items(
    trip_id: int,
    req: BulkUpdateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    """Bulk update visibility/list_name for multiple items owned by user."""
    user_id = member.user_id
    updated_count = 0

    for item_id in req.item_ids:
        result = await db.execute(
            select(PackingItem).where(
                PackingItem.id == item_id, PackingItem.trip_id == trip_id
            )
        )
        item = result.scalar_one_or_none()
        if not item or item.creator_id != user_id:
            continue

        if req.visibility is not None:
            item.visibility = req.visibility
        if req.visible_to is not None:
            item.visible_to = json.dumps(req.visible_to)
        if req.list_name is not None:
            item.list_name = req.list_name
        updated_count += 1

    await db.commit()
    return BulkUpdateResponse(updated_count=updated_count)


class RenameCategoryRequest(BaseModel):
    old_category: str
    new_category: str


class RenameCategoryResponse(BaseModel):
    renamed_count: int


@router.post("/rename-category", response_model=RenameCategoryResponse)
async def rename_category(
    trip_id: int,
    req: RenameCategoryRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    """Rename a category for all items owned by user."""
    user_id = member.user_id
    from sqlalchemy import update

    result = await db.execute(
        update(PackingItem)
        .where(
            PackingItem.trip_id == trip_id,
            PackingItem.creator_id == user_id,
            PackingItem.category.ilike(req.old_category),
        )
        .values(category=req.new_category.lower())
    )
    await db.commit()
    return RenameCategoryResponse(renamed_count=result.rowcount)
