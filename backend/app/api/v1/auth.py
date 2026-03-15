from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_access_token,
)
from app.core.config import settings
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


class RegisterRequest(BaseModel):
    username: str
    display_name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    user: dict
    access_token: str
    refresh_token: str


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where((User.email == req.email) | (User.username == req.username))
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(
        username=req.username,
        display_name=req.display_name,
        email=req.email,
        hashed_password=hash_password(req.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    response = JSONResponse(
        content={
            "user": {
                "id": user.id,
                "username": user.username,
                "display_name": user.display_name,
                "avatar_url": user.avatar_url,
                "emoji": user.emoji,
            },
            "access_token": access_token,
            "refresh_token": refresh_token,
        }
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * settings.REFRESH_TOKEN_EXPIRE_DAYS,
    )
    return response


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    response = JSONResponse(
        content={
            "user": {
                "id": user.id,
                "username": user.username,
                "display_name": user.display_name,
                "avatar_url": user.avatar_url,
                "emoji": user.emoji,
            },
            "access_token": access_token,
            "refresh_token": refresh_token,
        }
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * settings.REFRESH_TOKEN_EXPIRE_DAYS,
    )
    return response


@router.post("/refresh")
async def refresh(request: Request, db: AsyncSession = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        return JSONResponse(status_code=401, content={"detail": "No refresh token"})

    payload = decode_access_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        return JSONResponse(
            status_code=401, content={"detail": "Invalid refresh token"}
        )

    user = await db.get(User, int(payload["sub"]))
    if not user:
        return JSONResponse(status_code=401, content={"detail": "User not found"})

    return {
        "access_token": create_access_token(user.id),
    }


@router.get("/me")
async def get_me(
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    return {
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
        "emoji": user.emoji,
    }
