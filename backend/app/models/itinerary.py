from sqlalchemy import Column, Integer, String, DateTime, Date, Time, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class ItineraryItem(Base):
    __tablename__ = "itinerary_items"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    stop_id = Column(
        Integer, ForeignKey("stops.id", ondelete="SET NULL"), nullable=True
    )
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    date = Column(Date, nullable=True)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    location = Column(String, nullable=True)
    assigned_members = Column(String, nullable=True)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="itinerary_items")
    stop = relationship("Stop", back_populates="itinerary_items")
