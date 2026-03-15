from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Car(Base):
    __tablename__ = "cars"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    driver_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    color = Column(String, nullable=False)
    make = Column(String, nullable=False)
    model = Column(String, nullable=True)
    total_seats = Column(Integer, default=4)
    passenger_ids = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="cars")
