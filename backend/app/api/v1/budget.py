from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.api.deps import get_current_user, get_trip_member
from app.models.user import User
from app.models.trip import TripMember
from app.models.expense import Expense

router = APIRouter()


class ExpenseCreateRequest(BaseModel):
    title: str
    amount: float
    currency: str = "USD"
    paid_by_user_id: int
    split_type: str = "equal"
    split_details: Optional[str] = None
    category: Optional[str] = None


class ExpenseUpdateRequest(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    paid_by_user_id: Optional[int] = None
    split_type: Optional[str] = None
    split_details: Optional[str] = None
    category: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: int
    title: str
    amount: float
    currency: str
    paid_by_user_id: int
    creator_id: Optional[int] = None
    split_type: str
    split_details: Optional[str]
    category: Optional[str]

    class Config:
        from_attributes = True


class BudgetSummaryResponse(BaseModel):
    total: float
    currency: str
    by_user: dict[int, float]
    by_category: dict[str, float]


@router.get("", response_model=list[ExpenseResponse])
async def list_expenses(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(select(Expense).where(Expense.trip_id == trip_id))
    expenses = result.scalars().all()
    return [ExpenseResponse.model_validate(e) for e in expenses]


@router.get("/summary", response_model=BudgetSummaryResponse)
async def get_budget_summary(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(select(Expense).where(Expense.trip_id == trip_id))
    expenses = result.scalars().all()

    total = sum(e.amount for e in expenses)
    currency = "USD"
    by_user: dict[int, float] = {}
    by_category: dict[str, float] = {}

    for e in expenses:
        by_user[e.paid_by_user_id] = by_user.get(e.paid_by_user_id, 0) + e.amount
        if e.category:
            by_category[e.category] = by_category.get(e.category, 0) + e.amount

    return BudgetSummaryResponse(
        total=total,
        currency=currency,
        by_user=by_user,
        by_category=by_category,
    )


@router.post("", response_model=ExpenseResponse)
async def create_expense(
    trip_id: int,
    req: ExpenseCreateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    expense = Expense(
        trip_id=trip_id,
        creator_id=member.user_id,
        title=req.title,
        amount=req.amount,
        currency=req.currency,
        paid_by_user_id=req.paid_by_user_id,
        split_type=req.split_type,
        split_details=req.split_details,
        category=req.category,
    )
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return ExpenseResponse.model_validate(expense)


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    trip_id: int,
    expense_id: int,
    req: ExpenseUpdateRequest,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.trip_id == trip_id)
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    if req.title is not None:
        expense.title = req.title
    if req.amount is not None:
        expense.amount = req.amount
    if req.currency is not None:
        expense.currency = req.currency
    if req.paid_by_user_id is not None:
        expense.paid_by_user_id = req.paid_by_user_id
    if req.split_type is not None:
        expense.split_type = req.split_type
    if req.split_details is not None:
        expense.split_details = req.split_details
    if req.category is not None:
        expense.category = req.category

    await db.commit()
    await db.refresh(expense)
    return ExpenseResponse.model_validate(expense)


@router.delete("/{expense_id}")
async def delete_expense(
    trip_id: int,
    expense_id: int,
    db: AsyncSession = Depends(get_db),
    member: TripMember = Depends(get_trip_member),
):
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.trip_id == trip_id)
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    await db.delete(expense)
    await db.commit()
    return {"message": "Expense deleted"}
