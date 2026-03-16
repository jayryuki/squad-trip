from sqlalchemy import Column, Integer, String, DateTime, Date, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class TripType(str, enum.Enum):
    ROAD_TRIP = "road_trip"
    VACATION = "vacation"
    CAMPING = "camping"
    CITY_BREAK = "city_break"
    OTHER = "other"


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, default=TripType.OTHER.value)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    currency = Column(String, default="USD")
    cover_image_url = Column(String, nullable=True)
    invite_code = Column(String, unique=True, index=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("TripMember", back_populates="trip")
    stops = relationship("Stop", back_populates="trip")
    itinerary_items = relationship("ItineraryItem", back_populates="trip")
    roles = relationship("Role", back_populates="trip")
    cars = relationship("Car", back_populates="trip")
    packing_items = relationship("PackingItem", back_populates="trip")
    expenses = relationship("Expense", back_populates="trip")
    outfits = relationship("Outfit", back_populates="trip")
    moodboard_items = relationship("MoodboardItem", back_populates="trip")
    messages = relationship("Message", back_populates="trip")
    polls = relationship("Poll", back_populates="trip")
    documents = relationship("Document", back_populates="trip")
    safety_info = relationship("SafetyInfo", back_populates="trip")
    photos = relationship("Photo", back_populates="trip")
    user_moodboards = relationship("UserMoodboard", back_populates="trip")


class TripSettings(Base):
    __tablename__ = "trip_settings"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False, unique=True)
    moodboard_thumbnail_threshold = Column(Integer, default=20)


class TripMember(Base):
    __tablename__ = "trip_members"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, default="member")
    stops_count = Column(Integer, default=0)
    itinerary_count = Column(Integer, default=0)
    packing_count = Column(Integer, default=0)
    expenses_count = Column(Integer, default=0)
    polls_count = Column(Integer, default=0)
    joined_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="members")
    user = relationship("User", back_populates="trips")
