from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.api.deps import get_current_user, get_trip_member
from app.models.user import User
from app.models.trip import TripMember
from app.models.safety import SafetyInfo

router = APIRouter()


class SafetyInfoCreateRequest(BaseModel):
    title: str
    content: str
    category: Optional[str] = None


class SafetyInfoUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None


class SafetyInfoResponse(BaseModel):
    id: int
    title: str
    content: str
    category: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


@router.get("", response_model=list[SafetyInfoResponse])
async def list_safety(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(select(SafetyInfo).where(SafetyInfo.trip_id == trip_id))
    items = result.scalars().all()

    return [
        SafetyInfoResponse(
            id=s.id,
            title=s.title,
            content=s.content,
            category=s.category,
            created_at=s.created_at.isoformat(),
        )
        for s in items
    ]


@router.post("", response_model=SafetyInfoResponse)
async def create_safety_info(
    trip_id: int,
    req: SafetyInfoCreateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    item = SafetyInfo(
        trip_id=trip_id,
        title=req.title,
        content=req.content,
        category=req.category,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return SafetyInfoResponse(
        id=item.id,
        title=item.title,
        content=item.content,
        category=item.category,
        created_at=item.created_at.isoformat(),
    )


@router.put("/{info_id}", response_model=SafetyInfoResponse)
async def update_safety_info(
    trip_id: int,
    info_id: int,
    req: SafetyInfoUpdateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(SafetyInfo).where(
            SafetyInfo.id == info_id, SafetyInfo.trip_id == trip_id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Safety info not found")

    if req.title is not None:
        item.title = req.title
    if req.content is not None:
        item.content = req.content
    if req.category is not None:
        item.category = req.category

    await db.commit()
    await db.refresh(item)
    return SafetyInfoResponse(
        id=item.id,
        title=item.title,
        content=item.content,
        category=item.category,
        created_at=item.created_at.isoformat(),
    )


@router.delete("/{info_id}")
async def delete_safety_info(
    trip_id: int,
    info_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(SafetyInfo).where(
            SafetyInfo.id == info_id, SafetyInfo.trip_id == trip_id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Safety info not found")

    await db.delete(item)
    await db.commit()
    return {"message": "Safety info deleted"}
