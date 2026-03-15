from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.api.deps import get_current_user, get_trip_member
from app.models.user import User
from app.models.trip import TripMember
from app.models.chat import Message

router = APIRouter()


class MessageCreateRequest(BaseModel):
    content: str
    is_announcement: bool = False


class MessageResponse(BaseModel):
    id: int
    user_id: int
    content: str
    is_announcement: bool
    created_at: str

    class Config:
        from_attributes = True


@router.get("", response_model=list[MessageResponse])
async def list_messages(
    trip_id: int,
    limit: int = Query(50, le=100),
    before_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    query = select(Message).where(Message.trip_id == trip_id)

    if before_id:
        query = query.where(Message.id < before_id)

    query = query.order_by(Message.created_at.desc()).limit(limit)

    result = await db.execute(query)
    messages = result.scalars().all()

    return [
        MessageResponse(
            id=m.id,
            user_id=m.user_id,
            content=m.content,
            is_announcement=m.is_announcement == "true",
            created_at=m.created_at.isoformat(),
        )
        for m in messages
    ]


@router.post("", response_model=MessageResponse)
async def create_message(
    trip_id: int,
    req: MessageCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    member: TripMember = Depends(get_trip_member),
):
    message = Message(
        trip_id=trip_id,
        user_id=current_user.id,
        content=req.content,
        is_announcement="true" if req.is_announcement else "false",
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return MessageResponse(
        id=message.id,
        user_id=message.user_id,
        content=message.content,
        is_announcement=message.is_announcement == "true",
        created_at=message.created_at.isoformat(),
    )


@router.delete("/{message_id}")
async def delete_message(
    trip_id: int,
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Message).where(Message.id == message_id, Message.trip_id == trip_id)
    )
    message = result.scalar_one_or_none()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    if message.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Cannot delete other user's messages"
        )

    await db.delete(message)
    await db.commit()
    return {"message": "Message deleted"}
