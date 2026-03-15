from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class PackingItem(Base):
    __tablename__ = "packing_items"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)  # clothing, toiletries, electronics, etc.
    quantity = Column(Integer, default=1)
    is_packed = Column(Boolean, default=False)
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_shared = Column(Boolean, default=True)  # shared or personal
    created_at = Column(DateTime, default=datetime.utcnow)
    
    trip = relationship("Trip", back_populates="packing_items")
