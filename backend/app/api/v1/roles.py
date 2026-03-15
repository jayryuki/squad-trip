from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.api.deps import get_current_user, get_trip_member
from app.models.user import User
from app.models.trip import TripMember
from app.models.role import Role

router = APIRouter()


class RoleCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None


class RoleUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    assigned_user_id: Optional[int] = None
    is_filled: Optional[bool] = None


class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    assigned_user_id: Optional[int]
    is_filled: bool

    class Config:
        from_attributes = True


@router.get("", response_model=list[RoleResponse])
async def list_roles(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(select(Role).where(Role.trip_id == trip_id))
    roles = result.scalars().all()
    return [RoleResponse.model_validate(r) for r in roles]


@router.post("", response_model=RoleResponse)
async def create_role(
    trip_id: int,
    req: RoleCreateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    role = Role(
        trip_id=trip_id,
        name=req.name,
        description=req.description,
    )
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return RoleResponse.model_validate(role)


@router.put("/{role_id}", response_model=RoleResponse)
async def update_role(
    trip_id: int,
    role_id: int,
    req: RoleUpdateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Role).where(Role.id == role_id, Role.trip_id == trip_id)
    )
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if req.name is not None:
        role.name = req.name
    if req.description is not None:
        role.description = req.description
    if req.assigned_user_id is not None:
        role.assigned_user_id = req.assigned_user_id
        role.is_filled = req.assigned_user_id is not None
    if req.is_filled is not None:
        role.is_filled = req.is_filled

    await db.commit()
    await db.refresh(role)
    return RoleResponse.model_validate(role)


@router.delete("/{role_id}")
async def delete_role(
    trip_id: int,
    role_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Role).where(Role.id == role_id, Role.trip_id == trip_id)
    )
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    await db.delete(role)
    await db.commit()
    return {"message": "Role deleted"}
