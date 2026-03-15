from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.core.database import get_db
from app.api.deps import get_current_user
from app.core.security import hash_password
from app.models.user import User
from app.models.trip import TripMember
from app.models.badge import Badge, UserBadge
from app.models.stop import Stop
from app.models.itinerary import ItineraryItem
from app.models.packing import PackingItem
from app.models.expense import Expense
from app.models.poll import Poll

router = APIRouter()


@router.get("/users/{user_id}/profile")
async def get_user_profile(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.execute(select(UserBadge).where(UserBadge.user_id == user_id))
    user_badges = result.scalars().all()

    badges = []
    for ub in user_badges:
        badge = await db.get(Badge, ub.badge_id)
        if badge:
            badges.append(
                {
                    "id": badge.id,
                    "name": badge.name,
                    "description": badge.description,
                    "icon": badge.icon,
                    "earned_at": ub.earned_at.isoformat() if ub.earned_at else None,
                }
            )

    result = await db.execute(select(TripMember).where(TripMember.user_id == user_id))
    memberships = result.scalars().all()

    trips_count = len(memberships)
    admin_count = sum(1 for m in memberships if m.role == "admin")

    stops_result = await db.execute(
        select(func.count(Stop.id)).where(Stop.creator_id == user_id)
    )
    stops_count = stops_result.scalar() or 0

    itinerary_result = await db.execute(
        select(func.count(ItineraryItem.id)).where(ItineraryItem.creator_id == user_id)
    )
    itinerary_count = itinerary_result.scalar() or 0

    packing_result = await db.execute(
        select(func.count(PackingItem.id)).where(PackingItem.creator_id == user_id)
    )
    packing_count = packing_result.scalar() or 0

    expenses_result = await db.execute(
        select(func.count(Expense.id)).where(Expense.creator_id == user_id)
    )
    expenses_count = expenses_result.scalar() or 0

    polls_result = await db.execute(
        select(func.count(Poll.id)).where(Poll.created_by_user_id == user_id)
    )
    polls_count = polls_result.scalar() or 0

    return {
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
        "emoji": user.emoji,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "badges": badges,
        "stats": {
            "trips_count": trips_count,
            "admin_count": admin_count,
            "stops_count": stops_count,
            "itinerary_count": itinerary_count,
            "packing_count": packing_count,
            "expenses_count": expenses_count,
            "polls_count": polls_count,
        },
    }


@router.get("/trips/{trip_id}/members/{user_id}/stats")
async def get_trip_member_stats(
    trip_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_id,
            TripMember.user_id == user_id,
        )
    )
    member = membership.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    stops_result = await db.execute(
        select(func.count(Stop.id)).where(
            Stop.trip_id == trip_id,
            Stop.creator_id == user_id,
        )
    )
    stops_count = stops_result.scalar() or 0

    itinerary_result = await db.execute(
        select(func.count(ItineraryItem.id)).where(
            ItineraryItem.trip_id == trip_id,
            ItineraryItem.creator_id == user_id,
        )
    )
    itinerary_count = itinerary_result.scalar() or 0

    packing_result = await db.execute(
        select(func.count(PackingItem.id)).where(
            PackingItem.trip_id == trip_id,
            PackingItem.creator_id == user_id,
        )
    )
    packing_count = packing_result.scalar() or 0

    expenses_result = await db.execute(
        select(func.count(Expense.id)).where(
            Expense.trip_id == trip_id,
            Expense.creator_id == user_id,
        )
    )
    expenses_count = expenses_result.scalar() or 0

    polls_result = await db.execute(
        select(func.count(Poll.id)).where(
            Poll.trip_id == trip_id,
            Poll.created_by_user_id == user_id,
        )
    )
    polls_count = polls_result.scalar() or 0

    return {
        "user_id": user_id,
        "username": user.username,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
        "role": member.role,
        "joined_at": member.joined_at.isoformat() if member.joined_at else None,
        "contributions": {
            "stops_count": stops_count,
            "itinerary_count": itinerary_count,
            "packing_count": packing_count,
            "expenses_count": expenses_count,
            "polls_count": polls_count,
        },
    }


class UpdateProfileRequest(BaseModel):
    username: Optional[str] = None
    display_name: Optional[str] = None
    email: Optional[EmailStr] = None
    emoji: Optional[str] = None
    avatar_url: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


class UpdateProfileResponse(BaseModel):
    id: int
    username: str
    display_name: str
    email: str
    avatar_url: Optional[str]
    emoji: Optional[str]


@router.patch("/users/me", response_model=UpdateProfileResponse)
async def update_my_profile(
    req: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if req.username:
        result = await db.execute(
            select(User).where(
                User.username == req.username, User.id != current_user.id
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = req.username

    if req.display_name:
        current_user.display_name = req.display_name

    if req.email:
        result = await db.execute(
            select(User).where(User.email == req.email, User.id != current_user.id)
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already taken")
        current_user.email = req.email

    if req.emoji is not None:
        current_user.emoji = req.emoji

    if req.avatar_url is not None:
        current_user.avatar_url = req.avatar_url

    if req.new_password:
        if not req.current_password:
            raise HTTPException(
                status_code=400, detail="Current password required to set new password"
            )
        from app.core.security import verify_password

        if not verify_password(req.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        current_user.hashed_password = hash_password(req.new_password)

    await db.commit()
    await db.refresh(current_user)

    return {
        "id": current_user.id,
        "username": current_user.username,
        "display_name": current_user.display_name,
        "email": current_user.email,
        "avatar_url": current_user.avatar_url,
        "emoji": current_user.emoji,
    }


@router.get("/users/me", response_model=UpdateProfileResponse)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "display_name": current_user.display_name,
        "email": current_user.email,
        "avatar_url": current_user.avatar_url,
        "emoji": current_user.emoji,
    }
