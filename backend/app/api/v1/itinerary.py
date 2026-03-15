from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime


def parse_time(time_str: str):
    """Parse time string, handling both HH:MM and HH:MM:SS formats."""
    if len(time_str) == 5:
        return datetime.strptime(time_str, "%H:%M").time()
    return datetime.strptime(time_str[:5], "%H:%M").time()


from app.core.database import get_db
from app.api.deps import get_current_user, get_trip_member
from app.models.user import User
from app.models.trip import TripMember
from app.models.itinerary import ItineraryItem

router = APIRouter()


class ItineraryItemCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    assigned_members: Optional[str] = None
    stop_id: Optional[int] = None


class ItineraryItemUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    assigned_members: Optional[str] = None
    order_index: Optional[int] = None
    stop_id: Optional[int] = None


class ItineraryItemResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    date: Optional[str]
    start_time: Optional[str]
    end_time: Optional[str]
    location: Optional[str]
    assigned_members: Optional[str]
    order_index: int
    creator_id: Optional[int] = None
    stop_id: Optional[int] = None

    class Config:
        from_attributes = True


@router.get("", response_model=list[ItineraryItemResponse])
async def list_itinerary(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(ItineraryItem)
        .where(ItineraryItem.trip_id == trip_id)
        .order_by(
            ItineraryItem.date, ItineraryItem.start_time, ItineraryItem.order_index
        )
    )
    items = result.scalars().all()
    return [
        ItineraryItemResponse(
            id=i.id,
            title=i.title,
            description=i.description,
            date=i.date.isoformat() if i.date else None,
            start_time=i.start_time.isoformat() if i.start_time else None,
            end_time=i.end_time.isoformat() if i.end_time else None,
            location=i.location,
            assigned_members=i.assigned_members,
            order_index=i.order_index,
            creator_id=i.creator_id,
            stop_id=i.stop_id,
        )
        for i in items
    ]


@router.post("", response_model=ItineraryItemResponse)
async def create_itinerary_item(
    trip_id: int,
    req: ItineraryItemCreateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(ItineraryItem)
        .where(ItineraryItem.trip_id == trip_id)
        .order_by(ItineraryItem.order_index.desc())
    )
    last_item = result.scalars().first()
    next_order = (last_item.order_index + 1) if last_item else 0

    item = ItineraryItem(
        trip_id=trip_id,
        creator_id=member.user_id,
        stop_id=req.stop_id,
        title=req.title,
        description=req.description,
        date=date.fromisoformat(req.date) if req.date else None,
        start_time=parse_time(req.start_time) if req.start_time else None,
        end_time=parse_time(req.end_time) if req.end_time else None,
        location=req.location,
        assigned_members=req.assigned_members,
        order_index=next_order,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    return ItineraryItemResponse(
        id=item.id,
        title=item.title,
        description=item.description,
        date=item.date.isoformat() if item.date else None,
        start_time=item.start_time.isoformat() if item.start_time else None,
        end_time=item.end_time.isoformat() if item.end_time else None,
        location=item.location,
        assigned_members=item.assigned_members,
        order_index=item.order_index,
        creator_id=item.creator_id,
        stop_id=item.stop_id,
    )


@router.put("/{item_id}", response_model=ItineraryItemResponse)
async def update_itinerary_item(
    trip_id: int,
    item_id: int,
    req: ItineraryItemUpdateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(ItineraryItem).where(
            ItineraryItem.id == item_id, ItineraryItem.trip_id == trip_id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Itinerary item not found")

    if req.title is not None:
        item.title = req.title
    if req.description is not None:
        item.description = req.description
    if req.date is not None:
        item.date = date.fromisoformat(req.date)
    if req.start_time is not None:
        item.start_time = parse_time(req.start_time)
    if req.end_time is not None:
        item.end_time = parse_time(req.end_time)
    if req.location is not None:
        item.location = req.location
    if req.assigned_members is not None:
        item.assigned_members = req.assigned_members
    if req.order_index is not None:
        item.order_index = req.order_index
    if req.stop_id is not None:
        item.stop_id = req.stop_id

    await db.commit()
    await db.refresh(item)
    return ItineraryItemResponse(
        id=item.id,
        title=item.title,
        description=item.description,
        date=item.date.isoformat() if item.date else None,
        start_time=item.start_time.isoformat() if item.start_time else None,
        end_time=item.end_time.isoformat() if item.end_time else None,
        location=item.location,
        assigned_members=item.assigned_members,
        order_index=item.order_index,
        creator_id=item.creator_id,
        stop_id=item.stop_id,
    )


@router.delete("/{item_id}")
async def delete_itinerary_item(
    trip_id: int,
    item_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(ItineraryItem).where(
            ItineraryItem.id == item_id, ItineraryItem.trip_id == trip_id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Itinerary item not found")

    await db.delete(item)
    await db.commit()
    return {"message": "Itinerary item deleted"}
