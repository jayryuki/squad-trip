from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.api.deps import get_current_user, get_trip_member
from app.models.user import User
from app.models.trip import TripMember

router = APIRouter()


class WeatherData(BaseModel):
    date: str
    temperature_high: int
    temperature_low: int
    condition: str
    icon: str


class WeatherResponse(BaseModel):
    location: str
    current: Optional[WeatherData]
    forecast: list[WeatherData]


@router.get("", response_model=WeatherResponse)
async def get_weather(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(select(TripMember).where(TripMember.trip_id == trip_id))
    trip = result.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    placeholder_forecast = [
        WeatherData(
            date=datetime.now().strftime("%Y-%m-%d"),
            temperature_high=75,
            temperature_low=60,
            condition="Partly Cloudy",
            icon="partly-cloudy",
        ),
        WeatherData(
            date="2026-03-15",
            temperature_high=78,
            temperature_low=62,
            condition="Sunny",
            icon="sunny",
        ),
        WeatherData(
            date="2026-03-16",
            temperature_high=72,
            temperature_low=58,
            condition="Rain",
            icon="rainy",
        ),
    ]

    return WeatherResponse(
        location="Trip Location",
        current=placeholder_forecast[0],
        forecast=placeholder_forecast,
    )
