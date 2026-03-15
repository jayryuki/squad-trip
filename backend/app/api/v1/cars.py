from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
from app.core.database import get_db
from app.api.deps import get_current_user, get_trip_member
from app.models.user import User
from app.models.trip import TripMember
from app.models.car import Car

router = APIRouter()


class CarCreateRequest(BaseModel):
    color: str
    make: str
    model: Optional[str] = None
    total_seats: int = 4


class CarUpdateRequest(BaseModel):
    color: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    total_seats: Optional[int] = None
    driver_user_id: Optional[int] = None


class UserSummary(BaseModel):
    id: int
    display_name: str
    avatar_url: Optional[str]
    emoji: Optional[str]

    class Config:
        from_attributes = True


class CarResponse(BaseModel):
    id: int
    trip_id: int
    driver_user_id: int
    driver: Optional[UserSummary] = None
    color: str
    make: str
    model: Optional[str]
    total_seats: int
    passenger_ids: List[int]
    passengers: List[UserSummary] = []

    class Config:
        from_attributes = True


async def get_user_summary(user_id: int, db: AsyncSession) -> Optional[UserSummary]:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user:
        return UserSummary(
            id=user.id,
            display_name=user.display_name,
            avatar_url=user.avatar_url,
            emoji=user.emoji,
        )
    return None


async def build_car_response(car: Car, db: AsyncSession) -> CarResponse:
    driver = await get_user_summary(car.driver_user_id, db)
    passengers = []
    for passenger_id in car.passenger_ids or []:
        passenger = await get_user_summary(passenger_id, db)
        if passenger:
            passengers.append(passenger)
    return CarResponse(
        id=car.id,
        trip_id=car.trip_id,
        driver_user_id=car.driver_user_id,
        driver=driver,
        color=car.color,
        make=car.make,
        model=car.model,
        total_seats=car.total_seats,
        passenger_ids=car.passenger_ids or [],
        passengers=passengers,
    )


@router.get("", response_model=list[CarResponse])
async def list_cars(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(select(Car).where(Car.trip_id == trip_id))
    cars = result.scalars().all()

    response = []
    for car in cars:
        driver = await get_user_summary(car.driver_user_id, db)
        passengers = []
        for passenger_id in car.passenger_ids or []:
            passenger = await get_user_summary(passenger_id, db)
            if passenger:
                passengers.append(passenger)

        response.append(
            CarResponse(
                id=car.id,
                trip_id=car.trip_id,
                driver_user_id=car.driver_user_id,
                driver=driver,
                color=car.color,
                make=car.make,
                model=car.model,
                total_seats=car.total_seats,
                passenger_ids=car.passenger_ids or [],
                passengers=passengers,
            )
        )

    return response


@router.post("", response_model=CarResponse)
async def create_car(
    trip_id: int,
    req: CarCreateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    car = Car(
        trip_id=trip_id,
        driver_user_id=member.user_id,
        color=req.color,
        make=req.make,
        model=req.model,
        total_seats=req.total_seats,
        passenger_ids=[],
    )
    db.add(car)
    await db.commit()
    await db.refresh(car)

    driver = await get_user_summary(car.driver_user_id, db)

    return CarResponse(
        id=car.id,
        trip_id=car.trip_id,
        driver_user_id=car.driver_user_id,
        driver=driver,
        color=car.color,
        make=car.make,
        model=car.model,
        total_seats=car.total_seats,
        passenger_ids=car.passenger_ids or [],
        passengers=passengers,
    )


@router.delete("/{car_id}/passengers/{user_id}")
async def remove_passenger(
    trip_id: int,
    car_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Car).where(Car.id == car_id, Car.trip_id == trip_id)
    )
    car = result.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    passenger_ids = car.passenger_ids or []
    if user_id not in passenger_ids:
        raise HTTPException(
            status_code=400, detail="User is not a passenger in this car"
        )

    passenger_ids = [pid for pid in passenger_ids if pid != user_id]
    car.passenger_ids = passenger_ids

    await db.commit()
    await db.refresh(car)

    return await build_car_response(car, db)


class AddPassengerRequest(BaseModel):
    user_id: int


@router.post("/{car_id}/passengers", response_model=CarResponse)
async def add_passenger(
    trip_id: int,
    car_id: int,
    req: AddPassengerRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Car).where(Car.id == car_id, Car.trip_id == trip_id)
    )
    car = result.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    if car.driver_user_id == req.user_id:
        raise HTTPException(status_code=400, detail="User is already the driver")

    passenger_ids = car.passenger_ids or []
    if req.user_id in passenger_ids:
        raise HTTPException(status_code=400, detail="User is already in this car")

    current_passengers = len(passenger_ids)
    if current_passengers >= car.total_seats - 1:
        raise HTTPException(status_code=400, detail="No seats available")

    passenger_ids.append(req.user_id)
    car.passenger_ids = passenger_ids

    await db.commit()
    await db.refresh(car)

    return await build_car_response(car, db)


@router.put("/{car_id}", response_model=CarResponse)
async def update_car(
    trip_id: int,
    car_id: int,
    req: CarUpdateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Car).where(Car.id == car_id, Car.trip_id == trip_id)
    )
    car = result.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    if car.driver_user_id != member.user_id:
        raise HTTPException(
            status_code=403, detail="Only the driver can update the car"
        )

    if req.total_seats is not None:
        if req.total_seats < len(car.passenger_ids or []) + 1:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot reduce seats below {len(car.passenger_ids or []) + 1} (current passengers + driver)",
            )
        car.total_seats = req.total_seats

    if req.color is not None:
        car.color = req.color
    if req.make is not None:
        car.make = req.make
    if req.model is not None:
        car.model = req.model

    if req.driver_user_id is not None:
        if req.driver_user_id != car.driver_user_id:
            passenger_ids = car.passenger_ids or []
            if req.driver_user_id not in passenger_ids:
                raise HTTPException(
                    status_code=400, detail="New driver must be a passenger in this car"
                )
            passenger_ids = [pid for pid in passenger_ids if pid != req.driver_user_id]
            passenger_ids.append(car.driver_user_id)
            car.passenger_ids = passenger_ids
            car.driver_user_id = req.driver_user_id

    await db.commit()
    await db.refresh(car)

    driver = await get_user_summary(car.driver_user_id, db)
    passengers = []
    for passenger_id in car.passenger_ids or []:
        passenger = await get_user_summary(passenger_id, db)
        if passenger:
            passengers.append(passenger)

    return CarResponse(
        id=car.id,
        trip_id=car.trip_id,
        driver_user_id=car.driver_user_id,
        driver=driver,
        color=car.color,
        make=car.make,
        model=car.model,
        total_seats=car.total_seats,
        passenger_ids=car.passenger_ids or [],
        passengers=passengers,
    )


@router.delete("/{car_id}")
async def delete_car(
    trip_id: int,
    car_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Car).where(Car.id == car_id, Car.trip_id == trip_id)
    )
    car = result.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    if car.driver_user_id != member.user_id:
        raise HTTPException(
            status_code=403, detail="Only the driver can delete the car"
        )

    await db.delete(car)
    await db.commit()
    return {"message": "Car deleted"}


@router.post("/{car_id}/join")
async def join_car(
    trip_id: int,
    car_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Car).where(Car.id == car_id, Car.trip_id == trip_id)
    )
    car = result.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    if car.driver_user_id == member.user_id:
        raise HTTPException(status_code=400, detail="You are the driver")

    passenger_ids = car.passenger_ids or []
    if member.user_id in passenger_ids:
        raise HTTPException(status_code=400, detail="Already in this car")

    current_passengers = len(passenger_ids)
    if current_passengers >= car.total_seats - 1:
        raise HTTPException(status_code=400, detail="No seats available")

    passenger_ids.append(member.user_id)
    car.passenger_ids = passenger_ids

    await db.commit()
    await db.refresh(car)

    driver = await get_user_summary(car.driver_user_id, db)
    passengers = []
    for passenger_id in car.passenger_ids or []:
        passenger = await get_user_summary(passenger_id, db)
        if passenger:
            passengers.append(passenger)

    return CarResponse(
        id=car.id,
        trip_id=car.trip_id,
        driver_user_id=car.driver_user_id,
        driver=driver,
        color=car.color,
        make=car.make,
        model=car.model,
        total_seats=car.total_seats,
        passenger_ids=car.passenger_ids or [],
        passengers=passengers,
    )


@router.post("/{car_id}/leave")
async def leave_car(
    trip_id: int,
    car_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Car).where(Car.id == car_id, Car.trip_id == trip_id)
    )
    car = result.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    passenger_ids = car.passenger_ids or []
    if member.user_id not in passenger_ids:
        raise HTTPException(status_code=400, detail="Not in this car")

    passenger_ids = [pid for pid in passenger_ids if pid != member.user_id]
    car.passenger_ids = passenger_ids

    await db.commit()
    await db.refresh(car)

    driver = await get_user_summary(car.driver_user_id, db)
    passengers = []
    for passenger_id in car.passenger_ids or []:
        passenger = await get_user_summary(passenger_id, db)
        if passenger:
            passengers.append(passenger)

    return CarResponse(
        id=car.id,
        trip_id=car.trip_id,
        driver_user_id=car.driver_user_id,
        driver=driver,
        color=car.color,
        make=car.make,
        model=car.model,
        total_seats=car.total_seats,
        passenger_ids=car.passenger_ids or [],
        passengers=passengers,
    )
