# Backend - Squad Trip API

FastAPI-based REST API for the Squad Trip application.

## Tech Stack

- **Framework:** FastAPI
- **ORM:** SQLAlchemy (async)
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **Auth:** JWT (Jose) + bcrypt
- **Migrations:** Alembic
- **WebSockets:** Native FastAPI WebSocket

## Project Structure

```
backend/
├── main.py                 # Application entry point
├── requirements.txt        # Python dependencies
├── alembic.ini            # Alembic configuration
├── .env                   # Environment variables
├── data/                  # SQLite database storage
├── uploads/              # Uploaded files storage
└── app/
    ├── api/              # API route handlers
    │   ├── deps.py       # Dependency injection (auth)
    │   ├── setup.py      # Database setup endpoints
    │   └── v1/           # API v1 endpoints
    │       ├── router.py
    │       ├── auth.py
    │       ├── users.py
    │       ├── badges.py
    │       ├── trips.py
    │       ├── stops.py
    │       ├── itinerary.py
    │       ├── roles.py
    │       ├── packing.py
    │       ├── budget.py
    │       ├── outfits.py
    │       ├── moodboard.py
    │       ├── chat.py
    │       ├── polls.py
    │       ├── weather.py
    │       ├── documents.py
    │       ├── safety.py
    │       └── photos.py
    ├── core/             # Core utilities
    │   ├── config.py     # Settings (environment variables)
    │   ├── security.py  # JWT & password utilities
    │   ├── database.py  # SQLAlchemy setup
    │   └── storage.py   # File upload handling
    ├── models/           # SQLAlchemy ORM models
    │   ├── user.py
    │   ├── trip.py
    │   ├── stop.py
    │   ├── itinerary.py
    │   ├── role.py
    │   ├── packing.py
    │   ├── expense.py
    │   ├── outfit.py
    │   ├── moodboard.py
    │   ├── chat.py
    │   ├── poll.py
    │   ├── document.py
    │   ├── safety.py
    │   ├── photo.py
    │   └── badge.py
    ├── schemas/          # Pydantic schemas (currently unused - inline)
    ├── services/         # Business logic (currently unused)
    └── websockets/       # WebSocket handlers
        └── manager.py    # Connection manager for real-time chat
```

## Database Models

| Model | Description |
|-------|-------------|
| User | User accounts (username, email, password, avatar) |
| Trip | Trip entity with name, dates, cover image, invite code |
| TripMember | Many-to-many relationship (user ↔ trip) with roles |
| Stop | Trip destinations/stops with coordinates |
| ItineraryItem | Scheduled activities with date/time/location |
| Role | Trip responsibilities (driver, cook, navigator) |
| PackingItem | Shared packing list items |
| Expense | Trip expenses with split tracking |
| Outfit | Planned outfits with images |
| MoodboardItem | Inspirational images |
| Message | Chat messages |
| Poll | Group decision polls with voting |
| Document | Trip documents (PDFs, files) |
| SafetyInfo | Safety information (emergency, medical) |
| Photo | Trip photos |
| Badge | Achievement badges |
| UserBadge | Earned badges tracking |

## API Endpoints

All endpoints are prefixed with `/api/v1`.

| Category | Endpoints |
|----------|-----------|
| Auth | POST /register, POST /login, POST/refresh, GET /me |
| Users | GET/PATCH /users/me, GET /users/{id}/profile |
| Badges | GET /badges, POST /badges/seed |
| Trips | GET/POST /trips, GET/PUT/DELETE /trips/{id}, POST /trips/join/{code} |
| Stops | CRUD at /trips/{id}/stops |
| Itinerary | CRUD at /trips/{id}/itinerary |
| Roles | CRUD at /trips/{id}/roles |
| Packing | CRUD at /trips/{id}/packing |
| Budget | CRUD at /trips/{id}/expenses, GET /summary |
| Outfits | CRUD at /trips/{id}/outfits |
| Moodboard | CRUD at /trips/{id}/moodboard |
| Chat | GET/POST /trips/{id}/messages |
| Polls | CRUD + vote at /trips/{id}/polls |
| Weather | GET /trips/{id}/weather |
| Documents | CRUD at /trips/{id}/documents |
| Safety | CRUD at /trips/{id}/safety |
| Photos | CRUD at /trips/{id}/photos |

## WebSocket

Real-time chat via `/ws/{trip_id}` - managed by `ConnectionManager` in `app/websockets/manager.py`.

## Getting Started

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload
```

API docs available at `http://localhost:8000/docs`.

See `app/` folder for detailed module documentation.
