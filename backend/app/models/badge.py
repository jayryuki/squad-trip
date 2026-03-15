from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    icon = Column(String, nullable=True)
    badge_type = Column(String, nullable=False)  # contribution, role
    criteria_type = Column(
        String, nullable=True
    )  # stops, itinerary, packing, expenses, polls, trips, roles
    criteria_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_badges = relationship("UserBadge", back_populates="badge")


class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    earned_at = Column(DateTime, default=datetime.utcnow)

    badge = relationship("Badge", back_populates="user_badges")
    user = relationship("User", back_populates="badges")
