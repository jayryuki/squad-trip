# App Module - Backend Core

This directory contains the core application modules.

## Directories

### `api/` - API Route Handlers

| File | Description |
|------|-------------|
| `deps.py` | Dependency injection: `get_current_user()` validates JWT, `get_trip_member()` verifies trip membership |
| `setup.py` | Initial setup endpoints: GET /status, POST /complete, POST /test-connection |
| `v1/router.py` | Central router aggregating all v1 endpoints |
| `v1/auth.py` | Authentication: register, login, refresh, me |
| `v1/users.py` | User profile management and stats |
| `v1/badges.py` | Badge listing and seeding |
| `v1/trips.py` | Trip CRUD, join via code, members, invite codes |
| `v1/stops.py` | Trip destinations with reorder support |
| `v1/itinerary.py` | Activity scheduling |
| `v1/roles.py` | Trip role management |
| `v1/packing.py` | Packing list items |
| `v1/budget.py` | Expenses and budget summary |
| `v1/outfits.py` | Outfit planning |
| `v1/moodboard.py` | Inspiration images |
| `v1/chat.py` | Chat messages with pagination |
| `v1/polls.py` | Polls with voting |
| `v1/weather.py` | Weather data (stub) |
| `v1/documents.py` | Document uploads |
| `v1/safety.py` | Safety information |
| `v1/photos.py` | Photo gallery |

### `core/` - Core Utilities

| File | Description |
|------|-------------|
| `config.py` | Pydantic Settings for environment variables (DATABASE_URL, SECRET_KEY, etc.) |
| `security.py` | JWT token creation/validation, password hashing with bcrypt |
| `database.py` | Async SQLAlchemy engine, session factory, get_db dependency |
| `storage.py` | File upload/delete to local storage with UUID filenames |

### `models/` - SQLAlchemy ORM Models

Each file contains one or more SQLAlchemy models:

| File | Models |
|------|--------|
| `user.py` | User |
| `trip.py` | Trip, TripMember |
| `stop.py` | Stop |
| `itinerary.py` | ItineraryItem |
| `role.py` | Role |
| `packing.py` | PackingItem |
| `expense.py` | Expense |
| `outfit.py` | Outfit |
| `moodboard.py` | MoodboardItem |
| `chat.py` | Message |
| `poll.py` | Poll |
| `document.py` | Document |
| `safety.py` | SafetyInfo |
| `photo.py` | Photo |
| `badge.py` | Badge, UserBadge |

### `schemas/` - Pydantic Schemas

Currently empty - schemas are defined inline in route handlers.

### `services/` - Business Logic

Currently empty - business logic is embedded in route handlers.

### `websockets/` - Real-time Communication

| File | Description |
|------|-------------|
| `manager.py` | ConnectionManager class - manages WebSocket connections grouped by trip_id. Singleton `ws_manager` for global access. |
