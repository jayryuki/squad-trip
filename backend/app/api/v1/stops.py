from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.api.deps import get_current_user, get_trip_member
from app.models.user import User
from app.models.trip import TripMember
from app.models.stop import Stop

router = APIRouter()


class StopCreateRequest(BaseModel):
    name: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None


class StopUpdateRequest(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None
    order_index: Optional[int] = None


class StopResponse(BaseModel):
    id: int
    name: str
    address: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    notes: Optional[str]
    order_index: int

    class Config:
        from_attributes = True


@router.get("", response_model=list[StopResponse])
async def list_stops(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Stop).where(Stop.trip_id == trip_id).order_by(Stop.order_index)
    )
    stops = result.scalars().all()
    return [StopResponse.model_validate(s) for s in stops]


@router.post("", response_model=StopResponse)
async def create_stop(
    trip_id: int,
    req: StopCreateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Stop).where(Stop.trip_id == trip_id).order_by(Stop.order_index.desc())
    )
    last_stop = result.scalars().first()
    next_order = (last_stop.order_index + 1) if last_stop else 0

    stop = Stop(
        trip_id=trip_id,
        name=req.name,
        address=req.address,
        latitude=req.latitude,
        longitude=req.longitude,
        notes=req.notes,
        order_index=next_order,
    )
    db.add(stop)
    await db.commit()
    await db.refresh(stop)
    return StopResponse.model_validate(stop)


@router.put("/{stop_id}", response_model=StopResponse)
async def update_stop(
    trip_id: int,
    stop_id: int,
    req: StopUpdateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Stop).where(Stop.id == stop_id, Stop.trip_id == trip_id)
    )
    stop = result.scalar_one_or_none()
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found")

    if req.name is not None:
        stop.name = req.name
    if req.address is not None:
        stop.address = req.address
    if req.latitude is not None:
        stop.latitude = req.latitude
    if req.longitude is not None:
        stop.longitude = req.longitude
    if req.notes is not None:
        stop.notes = req.notes
    if req.order_index is not None:
        stop.order_index = req.order_index

    await db.commit()
    await db.refresh(stop)
    return StopResponse.model_validate(stop)


@router.delete("/{stop_id}")
async def delete_stop(
    trip_id: int,
    stop_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Stop).where(Stop.id == stop_id, Stop.trip_id == trip_id)
    )
    stop = result.scalar_one_or_none()
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found")

    await db.delete(stop)
    await db.commit()
    return {"message": "Stop deleted"}


@router.put("/reorder")
async def reorder_stops(
    trip_id: int,
    stop_ids: list[int],
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    for index, stop_id in enumerate(stop_ids):
        result = await db.execute(
            select(Stop).where(Stop.id == stop_id, Stop.trip_id == trip_id)
        )
        stop = result.scalar_one_or_none()
        if stop:
            stop.order_index = index

    await db.commit()
    return {"message": "Stops reordered"}
