from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.badge import Badge, UserBadge

router = APIRouter()


@router.get("/badges")
async def get_all_badges(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Badge))
    badges = result.scalars().all()
    return [
        {
            "id": b.id,
            "name": b.name,
            "description": b.description,
            "icon": b.icon,
            "badge_type": b.badge_type,
            "criteria_type": b.criteria_type,
            "criteria_count": b.criteria_count,
        }
        for b in badges
    ]


@router.post("/badges/seed")
async def seed_default_badges(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    default_badges = [
        {
            "name": "First Trip",
            "description": "Created your first trip",
            "icon": "map",
            "badge_type": "role",
            "criteria_type": "trips",
            "criteria_count": 1,
        },
        {
            "name": "Trip Admin",
            "description": "Became an admin of a trip",
            "icon": "crown",
            "badge_type": "role",
            "criteria_type": "admin",
            "criteria_count": 1,
        },
        {
            "name": "Explorer",
            "description": "Added 5 stops to trips",
            "icon": "map-pin",
            "badge_type": "contribution",
            "criteria_type": "stops",
            "criteria_count": 5,
        },
        {
            "name": "Planner",
            "description": "Created 5 itinerary items",
            "icon": "calendar",
            "badge_type": "contribution",
            "criteria_type": "itinerary",
            "criteria_count": 5,
        },
        {
            "name": "Packer",
            "description": "Added 10 packing items",
            "icon": "package",
            "badge_type": "contribution",
            "criteria_type": "packing",
            "criteria_count": 10,
        },
        {
            "name": "Budget Master",
            "description": "Added 5 expenses",
            "icon": "dollar-sign",
            "badge_type": "contribution",
            "criteria_type": "expenses",
            "criteria_count": 5,
        },
        {
            "name": "Poll Creator",
            "description": "Created 3 polls",
            "icon": "bar-chart",
            "badge_type": "contribution",
            "criteria_type": "polls",
            "criteria_count": 3,
        },
    ]

    created = []
    for badge_data in default_badges:
        existing = await db.execute(
            select(Badge).where(Badge.name == badge_data["name"])
        )
        if not existing.scalar_one_or_none():
            badge = Badge(**badge_data)
            db.add(badge)
            created.append(badge_data["name"])

    await db.commit()
    return {"message": f"Created {len(created)} badges", "badges": created}
