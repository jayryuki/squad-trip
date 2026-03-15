from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    paid_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    split_type = Column(String, default="equal")  # equal, custom
    split_details = Column(String, nullable=True)  # JSON string
    category = Column(String, nullable=True)  # food, transport, accommodation, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    
    trip = relationship("Trip", back_populates="expenses")
