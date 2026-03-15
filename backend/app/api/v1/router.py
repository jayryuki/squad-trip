from fastapi import APIRouter
from app.api.v1 import (
    auth,
    trips,
    stops,
    itinerary,
    roles,
    packing,
    budget,
    outfits,
    moodboard,
    chat,
    polls,
    weather,
    documents,
    safety,
    photos,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(trips.router, prefix="/trips", tags=["trips"])
api_router.include_router(stops.router, prefix="/trips/{trip_id}/stops", tags=["stops"])
api_router.include_router(
    itinerary.router, prefix="/trips/{trip_id}/itinerary", tags=["itinerary"]
)
api_router.include_router(roles.router, prefix="/trips/{trip_id}/roles", tags=["roles"])
api_router.include_router(
    packing.router, prefix="/trips/{trip_id}/packing", tags=["packing"]
)
api_router.include_router(
    budget.router, prefix="/trips/{trip_id}/expenses", tags=["budget"]
)
api_router.include_router(
    outfits.router, prefix="/trips/{trip_id}/outfits", tags=["outfits"]
)
api_router.include_router(
    moodboard.router, prefix="/trips/{trip_id}/moodboard", tags=["moodboard"]
)
api_router.include_router(
    chat.router, prefix="/trips/{trip_id}/messages", tags=["chat"]
)
api_router.include_router(polls.router, prefix="/trips/{trip_id}/polls", tags=["polls"])
api_router.include_router(
    weather.router, prefix="/trips/{trip_id}/weather", tags=["weather"]
)
api_router.include_router(
    documents.router, prefix="/trips/{trip_id}/documents", tags=["documents"]
)
api_router.include_router(
    safety.router, prefix="/trips/{trip_id}/safety", tags=["safety"]
)
api_router.include_router(
    photos.router, prefix="/trips/{trip_id}/photos", tags=["photos"]
)
