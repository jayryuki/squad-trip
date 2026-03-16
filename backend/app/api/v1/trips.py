from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional
from datetime import date
import uuid
from app.core.database import get_db
from app.api.deps import get_current_user, get_trip_member
from app.models.user import User
from app.models.trip import Trip, TripMember, TripSettings
from app.models.stop import Stop
from app.models.itinerary import ItineraryItem
from app.models.role import Role
from app.models.packing import PackingItem
from app.models.expense import Expense
from app.models.outfit import Outfit
from app.models.moodboard import MoodboardItem
from app.models.user_moodboard import UserMoodboard
from app.models.chat import Message
from app.models.poll import Poll
from app.models.document import Document
from app.models.safety import SafetyInfo
from app.models.photo import Photo

router = APIRouter()


class CreateTripRequest(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    currency: str = "USD"


class TripResponse(BaseModel):
    id: int
    name: str
    type: str
    description: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    currency: str
    cover_image_url: Optional[str]
    member_count: int

    class Config:
        from_attributes = True


@router.get("", response_model=list[TripResponse])
async def list_trips(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Trip)
        .join(TripMember)
        .where(TripMember.user_id == current_user.id)
        .options(selectinload(Trip.members))
    )
    trips = result.scalars().all()
    return [
        TripResponse(
            id=t.id,
            name=t.name,
            type=t.type,
            description=t.description,
            start_date=t.start_date,
            end_date=t.end_date,
            currency=t.currency,
            cover_image_url=t.cover_image_url,
            member_count=len(t.members),
        )
        for t in trips
    ]


@router.post("", response_model=TripResponse)
async def create_trip(
    req: CreateTripRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trip = Trip(
        name=req.name,
        description=req.description,
        start_date=req.start_date,
        end_date=req.end_date,
        currency=req.currency,
        invite_code=uuid.uuid4().hex[:8].upper(),
        created_by_user_id=current_user.id,
    )
    db.add(trip)
    await db.commit()
    await db.refresh(trip)

    member = TripMember(trip_id=trip.id, user_id=current_user.id, role="admin")
    db.add(member)
    await db.commit()

    return TripResponse(
        id=trip.id,
        name=trip.name,
        type=trip.type,
        description=trip.description,
        start_date=trip.start_date,
        end_date=trip.end_date,
        currency=trip.currency,
        cover_image_url=trip.cover_image_url,
        member_count=1,
    )


@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Trip).where(Trip.id == trip_id).options(selectinload(Trip.members))
    )
    trip = result.scalar_one()
    return TripResponse(
        id=trip.id,
        name=trip.name,
        type=trip.type,
        description=trip.description,
        start_date=trip.start_date,
        end_date=trip.end_date,
        currency=trip.currency,
        cover_image_url=trip.cover_image_url,
        member_count=len(trip.members),
    )


class TripUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    currency: Optional[str] = None
    cover_image_url: Optional[str] = None


@router.put("/{trip_id}")
async def update_trip(
    trip_id: int,
    req: TripUpdateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    if member.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update trips")

    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalar_one()

    if req.name is not None:
        trip.name = req.name
    if req.description is not None:
        trip.description = req.description
    if req.start_date is not None:
        trip.start_date = req.start_date
    if req.end_date is not None:
        trip.end_date = req.end_date
    if req.currency is not None:
        trip.currency = req.currency
    if req.cover_image_url is not None:
        trip.cover_image_url = req.cover_image_url

    await db.commit()
    await db.refresh(trip)
    return TripResponse(
        id=trip.id,
        name=trip.name,
        type=trip.type,
        description=trip.description,
        start_date=trip.start_date,
        end_date=trip.end_date,
        currency=trip.currency,
        cover_image_url=trip.cover_image_url,
        member_count=len(member.trip.members) if member.trip else 0,
    )


@router.post("/{trip_id}/invite-code")
async def regenerate_invite_code(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    if member.role != "admin":
        raise HTTPException(
            status_code=403, detail="Only admins can regenerate invite code"
        )

    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalar_one()
    trip.invite_code = uuid.uuid4().hex[:8].upper()

    await db.commit()
    return {"invite_code": trip.invite_code}


@router.post("/join/{code}")
async def join_trip(
    code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Trip).where(Trip.invite_code == code))
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    existing = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip.id,
            TripMember.user_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already a member")

    member = TripMember(trip_id=trip.id, user_id=current_user.id, role="member")
    db.add(member)
    await db.commit()
    return {"message": "Joined trip"}


@router.get("/{trip_id}/members")
async def get_trip_members(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Trip)
        .where(Trip.id == trip_id)
        .options(selectinload(Trip.members).selectinload(TripMember.user))
    )
    trip = result.scalar_one()
    return [
        {
            "id": m.user.id,
            "display_name": m.user.display_name,
            "avatar_url": m.user.avatar_url,
            "emoji": m.user.emoji,
            "role": m.role,
        }
        for m in trip.members
    ]


@router.delete("/{trip_id}")
async def delete_trip(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    if member.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete trips")

    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalar_one()

    await db.execute(delete(TripMember).where(TripMember.trip_id == trip_id))
    await db.execute(delete(Stop).where(Stop.trip_id == trip_id))
    await db.execute(delete(ItineraryItem).where(ItineraryItem.trip_id == trip_id))
    await db.execute(delete(Role).where(Role.trip_id == trip_id))
    await db.execute(delete(PackingItem).where(PackingItem.trip_id == trip_id))
    await db.execute(delete(Expense).where(Expense.trip_id == trip_id))
    await db.execute(delete(Outfit).where(Outfit.trip_id == trip_id))
    await db.execute(delete(MoodboardItem).where(MoodboardItem.trip_id == trip_id))
    await db.execute(delete(UserMoodboard).where(UserMoodboard.trip_id == trip_id))
    await db.execute(delete(Message).where(Message.trip_id == trip_id))
    await db.execute(delete(Poll).where(Poll.trip_id == trip_id))
    await db.execute(delete(Document).where(Document.trip_id == trip_id))
    await db.execute(delete(SafetyInfo).where(SafetyInfo.trip_id == trip_id))
    await db.execute(delete(Photo).where(Photo.trip_id == trip_id))
    await db.execute(delete(TripSettings).where(TripSettings.trip_id == trip_id))

    await db.delete(trip)
    await db.commit()
    return {"message": "Trip deleted"}


class TripSettingsResponse(BaseModel):
    trip_id: int
    moodboard_thumbnail_threshold: int


class TripSettingsUpdate(BaseModel):
    moodboard_thumbnail_threshold: Optional[int] = None


@router.get("/{trip_id}/settings", response_model=TripSettingsResponse)
async def get_trip_settings(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(TripSettings).where(TripSettings.trip_id == trip_id)
    )
    settings = result.scalar_one_or_none()

    if not settings:
        settings = TripSettings(trip_id=trip_id, moodboard_thumbnail_threshold=20)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    return TripSettingsResponse.model_validate(settings)


@router.put("/{trip_id}/settings", response_model=TripSettingsResponse)
async def update_trip_settings(
    trip_id: int,
    req: TripSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    if member.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update settings")

    result = await db.execute(
        select(TripSettings).where(TripSettings.trip_id == trip_id)
    )
    settings = result.scalar_one_or_none()

    if not settings:
        settings = TripSettings(trip_id=trip_id, moodboard_thumbnail_threshold=20)
        db.add(settings)

    if req.moodboard_thumbnail_threshold is not None:
        settings.moodboard_thumbnail_threshold = req.moodboard_thumbnail_threshold

    await db.commit()
    await db.refresh(settings)

    return TripSettingsResponse.model_validate(settings)
