from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class PackingItem(Base):
    __tablename__ = "packing_items"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    quantity = Column(Integer, default=1)
    is_packed = Column(Boolean, default=False)
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_shared = Column(Boolean, default=True)
    visibility = Column(String, default="public")  # 'public' | 'shared' | 'private'
    visible_to = Column(
        String, default="[]"
    )  # JSON array of user IDs for 'shared' visibility
    list_name = Column(String, nullable=True)  # For multiple personal lists
    packed_status = Column(
        String, default="{}"
    )  # JSON object: {user_id: true/false} for per-user packed status
    created_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="packing_items")
