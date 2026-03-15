from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import json
from app.core.database import get_db
from app.api.deps import get_current_user, get_trip_member
from app.models.user import User
from app.models.trip import TripMember
from app.models.poll import Poll

router = APIRouter()


class PollCreateRequest(BaseModel):
    question: str
    options: list[str]


class PollVoteRequest(BaseModel):
    option_index: int


class PollResponse(BaseModel):
    id: int
    question: str
    options: list[str]
    votes: dict
    created_by_user_id: int
    is_active: bool

    class Config:
        from_attributes = True


@router.get("", response_model=list[PollResponse])
async def list_polls(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(select(Poll).where(Poll.trip_id == trip_id))
    polls = result.scalars().all()

    return [
        PollResponse(
            id=p.id,
            question=p.question,
            options=json.loads(p.options),
            votes=json.loads(p.votes) if p.votes else {},
            created_by_user_id=p.created_by_user_id,
            is_active=p.is_active,
        )
        for p in polls
    ]


@router.post("", response_model=PollResponse)
async def create_poll(
    trip_id: int,
    req: PollCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    member: TripMember = Depends(get_trip_member),
):
    poll = Poll(
        trip_id=trip_id,
        question=req.question,
        options=json.dumps(req.options),
        votes=json.dumps({}),
        created_by_user_id=current_user.id,
    )
    db.add(poll)
    await db.commit()
    await db.refresh(poll)
    return PollResponse(
        id=poll.id,
        question=poll.question,
        options=json.loads(poll.options),
        votes={},
        created_by_user_id=poll.created_by_user_id,
        is_active=poll.is_active,
    )


@router.post("/{poll_id}/vote", response_model=PollResponse)
async def vote_poll(
    trip_id: int,
    poll_id: int,
    req: PollVoteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Poll).where(Poll.id == poll_id, Poll.trip_id == trip_id)
    )
    poll = result.scalar_one_or_none()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")

    if not poll.is_active:
        raise HTTPException(status_code=400, detail="Poll is closed")

    options = json.loads(poll.options)
    if req.option_index < 0 or req.option_index >= len(options):
        raise HTTPException(status_code=400, detail="Invalid option index")

    votes = json.loads(poll.votes) if poll.votes else {}
    votes[str(req.option_index)] = votes.get(str(req.option_index), 0) + 1
    poll.votes = json.dumps(votes)

    await db.commit()
    await db.refresh(poll)
    return PollResponse(
        id=poll.id,
        question=poll.question,
        options=json.loads(poll.options),
        votes=json.loads(poll.votes),
        created_by_user_id=poll.created_by_user_id,
        is_active=poll.is_active,
    )


@router.delete("/{poll_id}")
async def delete_poll(
    trip_id: int,
    poll_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Poll).where(Poll.id == poll_id, Poll.trip_id == trip_id)
    )
    poll = result.scalar_one_or_none()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")

    await db.delete(poll)
    await db.commit()
    return {"message": "Poll deleted"}


@router.put("/{poll_id}/close", response_model=PollResponse)
async def close_poll(
    trip_id: int,
    poll_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Poll).where(Poll.id == poll_id, Poll.trip_id == trip_id)
    )
    poll = result.scalar_one_or_none()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")

    poll.is_active = False

    await db.commit()
    await db.refresh(poll)
    return PollResponse(
        id=poll.id,
        question=poll.question,
        options=json.loads(poll.options),
        votes=json.loads(poll.votes) if poll.votes else {},
        created_by_user_id=poll.created_by_user_id,
        is_active=poll.is_active,
    )
