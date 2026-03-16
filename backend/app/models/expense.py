from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
import json


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    paid_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    split_type = Column(String, default="equal")
    split_details = Column(String, nullable=True)
    category = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="expenses")

    def get_split_with(self) -> list[int]:
        if not self.split_details:
            return []
        try:
            data = json.loads(self.split_details)
            if self.split_type == "equal":
                return data.get("users", [])
            return list(data.get("shares", {}).keys())
        except (json.JSONDecodeError, AttributeError):
            return []

    def is_shared_with(self, user_id: int) -> bool:
        split_with = self.get_split_with()
        if not split_with:
            return True
        return user_id in split_with
