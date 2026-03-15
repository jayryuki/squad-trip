# Squad Trip App - Development Plan

## Overview
This document tracks the progress of building out the Squad Trip application. The app consists of a FastAPI backend and a React/Vite frontend. All 13 feature stub pages need to be implemented with both backend endpoints and frontend components.

---

## 1. Create Backend Dependencies File

### 1.1 Create `requirements.txt` with all Python dependencies
- **File:** `/home/jay/.openclaw/workspace/projects/squad-trip/backend/requirements.txt`
- **Dependencies needed:**
  - fastapi
  - uvicorn
  - sqlalchemy[asyncio]
  - aiosqlite (for SQLite)
  - alembic
  - python-jose[cryptography]
  - bcrypt
  - pydantic
  - pydantic-settings
  - python-multipart
  - psycopg2-binary (optional for PostgreSQL)

---

## 2. Fix Database Setup

### 2.1 Verify `.env` file exists and configure SQLite
- **Location:** `/home/jay/.openclaw/workspace/projects/squad-trip/backend/.env`
- **Content needed:**
  ```
  DATABASE_URL=sqlite+aiosqlite:///./data/squad-trip.db
  SECRET_KEY=<generate-secure-key>
  ```

### 2.2 Create data directory
- **Location:** `/home/jay/.openclaw/workspace/projects/squad-trip/backend/data/`

### 2.3 Run database migrations
- **Command:** `cd backend && alembic upgrade head`

### 2.4 Verify database tables are created
- Check that all 13 tables exist: users, trips, trip_members, stops, itinerary_items, roles, packing_items, expenses, outfits, moodboard_items, messages, polls, documents, safety_info, photos

---

## 3. Implement Backend API Endpoints

### 3.1 Stops API (for Map page)
**Model:** `/home/jay/.openclaw/workspace/projects/squad-trip/backend/app/models/stop.py`
- `GET /api/v1/trips/{trip_id}/stops` - List all stops
- `POST /api/v1/trips/{trip_id}/stops` - Create stop
- `PUT /api/v1/trips/{trip_id}/stops/{stop_id}` - Update stop
- `DELETE /api/v1/trips/{trip_id}/stops/{stop_id}` - Delete stop
- `PUT /api/v1/trips/{trip_id}/stops/reorder` - Reorder stops

### 3.2 Itinerary API
**Model:** `/home/jay/.openclaw/workspace/projects/squad-trip/backend/app/models/itinerary.py`
- `GET /api/v1/trips/{trip_id}/itinerary` - List all itinerary items
- `POST /api/v1/trips/{trip_id}/itinerary` - Create itinerary item
- `PUT /api/v1/trips/{trip_id}/itinerary/{item_id}` - Update itinerary item
- `DELETE /api/v1/trips/{trip_id}/itinerary/{item_id}` - Delete itinerary item

### 3.3 Roles API
**Model:** `/home/jay/.openclaw/workspace/projects/squad-trip/backend/app/models/role.py`
- `GET /api/v1/trips/{trip_id}/roles` - List all roles
- `POST /api/v1/trips/{trip_id}/roles` - Create role
- `PUT /api/v1/trips/{trip_id}/roles/{role_id}` - Update/assign role
- `DELETE /api/v1/trips/{trip_id}/roles/{role_id}` - Delete role

### 3.4 Packing API
**Model:** `/home/jay/.openclaw/workspace/projects/squad-trip/backend/app/models/packing.py`
- `GET /api/v1/trips/{trip_id}/packing` - List all packing items
- `POST /api/v1/trips/{trip_id}/packing` - Create packing item
- `PUT /api/v1/trips/{trip_id}/packing/{item_id}` - Update packing item (mark as packed)
- `DELETE /api/v1/trips/{trip_id}/packing/{item_id}` - Delete packing item

### 3.5 Budget/Expenses API
**Model:** `/home/jay/.openclaw/workspace/projects/squad-trip/backend/app/models/expense.py`
- `GET /api/v1/trips/{trip_id}/expenses` - List all expenses
- `POST /api/v1/trips/{trip_id}/expenses` - Create expense
- `PUT /api/v1/trips/{trip_id}/expenses/{expense_id}` - Update expense
- `DELETE /api/v1/trips/{trip_id}/expenses/{expense_id}` - Delete expense
- `GET /api/v1/trips/{trip_id}/expenses/summary` - Get budget summary (total, per-user, by category)

### 3.6 Outfits API
**Model:** `/home/jay/.openclaw/workspace/projects/squad-trip/backend/app/models/outfit.py`
- `GET /api/v1/trips/{trip_id}/outfits` - List all outfits
- `POST /api/v1/trips/{trip_id}/outfits` - Create outfit
- `PUT /api/v1/trips/{trip_id}/outfits/{outfit_id}` - Update outfit
- `DELETE /api/v1/trips/{trip_id}/outfits/{outfit_id}` - Delete outfit

### 3.7 Moodboard API
**Model:** `/home/jay/.openclaw/workspace/projects/squad-trip/backend/app/models/moodboard.py`
- `GET /api/v1/trips/{trip_id}/moodboard` - List all moodboard items
- `POST /api/v1/trips/{trip_id}/moodboard` - Create moodboard item
- `DELETE /api/v1/trips/{trip_id}/moodboard/{item_id}` - Delete moodboard item

### 3.8 Chat/Messages API
**Model:** `/home/jay/.openclaw/workspace/projects/squad-trip/backend/app/models/chat.py`
- `GET /api/v1/trips/{trip_id}/messages` - List all messages (with pagination)
- `POST /api/v1/trips/{trip_id}/messages` - Send message
- `DELETE /api/v1/trips/{trip_id}/messages/{message_id}` - Delete message
- **WebSocket:** `/ws/trips/{trip_id}/chat` - Real-time chat

### 3.9 Polls API
**Model:** `/home/jay/.openclaw/workspace/projects/squad-trip/backend/app/models/poll.py`
- `GET /api/v1/trips/{trip_id}/polls` - List all polls
- `POST /api/v1/trips/{trip_id}/polls` - Create poll
- `POST /api/v1/trips/{trip_id}/polls/{poll_id}/vote` - Vote on poll
- `DELETE /api/v1/trips/{trip_id}/polls/{poll_id}` - Delete poll

### 3.10 Weather API
- `GET /api/v1/trips/{trip_id}/weather` - Get weather forecast (requires external API)
- **Note:** May need external API integration (OpenWeatherMap, etc.)

### 3.11 Documents API
**Model:** `/home/jay/.openclaw/workspace/projects/squad-trip/backend/app/models/document.py`
- `GET /api/v1/trips/{trip_id}/documents` - List all documents
- `POST /api/v1/trips/{trip_id}/documents` - Upload document
- `DELETE /api/v1/trips/{trip_id}/documents/{document_id}` - Delete document

### 3.12 Safety Info API
**Model:** `/home/jay/.openclaw/workspace/projects/squad-trip/backend/app/models/safety.py`
- `GET /api/v1/trips/{trip_id}/safety` - List all safety info
- `POST /api/v1/trips/{trip_id}/safety` - Create safety info
- `PUT /api/v1/trips/{trip_id}/safety/{info_id}` - Update safety info
- `DELETE /api/v1/trips/{trip_id}/safety/{info_id}` - Delete safety info

### 3.13 Photos API
**Model:** `/home/jay/.openclaw/workspace/projects/squad-trip/backend/app/models/photo.py`
- `GET /api/v1/trips/{trip_id}/photos` - List all photos
- `POST /api/v1/trips/{trip_id}/photos` - Upload photo
- `DELETE /api/v1/trips/{trip_id}/photos/{photo_id}` - Delete photo

### 3.14 File Upload Support
- **Location:** `/home/jay/.openclaw/workspace/projects/squad-trip/backend/app/core/storage.py`
- Need to implement: `upload_file(file, folder)` function
- Need to implement: `delete_file(url)` function

### 3.15 Update Router
- **File:** `/home/jay/.openclaw/workspace/projects/squad-trip/backend/app/api/v1/router.py`
- Add new routers for each feature:
  ```python
  from app.api.v1 import auth, trips, stops, itinerary, roles, packing, budget, outfits, moodboard, chat, polls, weather, documents, safety, photos
  
  api_router.include_router(stops.router, prefix="/trips/{trip_id}/stops", tags=["stops"])
  api_router.include_router(itinerary.router, prefix="/trips/{trip_id}/itinerary", tags=["itinerary"])
  # ... etc
  ```

---

## 4. Connect Frontend to Backend

### 4.1 Map Page (`/trips/:tripId/map`)
- Display stops on a Leaflet map
- Auto-fit map to show all stops in view
- Add/remove/reorder stops
- Add stop form: name, address, latitude, longitude, notes

### 4.2 Itinerary Page (`/trips/:tripId/itinerary`)
- Calendar view of itinerary items
- Add/edit/delete items: title, description, date, start/end time, location
- Drag-and-drop reordering

### 4.3 Roles Page (`/trips/:tripId/roles`)
- List roles (driver, cook, navigator, etc.)
- Assign/unassign members to roles
- Mark roles as filled/unfilled

### 4.4 Packing Page (`/trips/:tripId/packing`)
- List packing items by category
- Check off items as packed
- Assign items to specific members
- Add shared or personal items

### 4.5 Budget Page (`/trips/:tripId/budget`)
- List expenses with category
- Add expense form: title, amount, category, paid by, split type
- Summary: total spent, per-person breakdown, by category
- Visual charts (recharts already installed)

### 4.6 Outfits Page (`/trips/:tripId/outfits`)
- Grid of outfit cards with images
- Add outfit form: name, image upload
- Delete outfits

### 4.7 Moodboard Page (`/trips/:tripId/moodboard`)
- Masonry grid of images
- Add image: upload + caption
- Delete images

### 4.8 Chat Page (`/trips/:tripId/chat`)
- Message list with user avatars
- Message input at bottom
- Real-time updates via WebSocket
- Announcement messages (styled differently)

### 4.9 Polls Page (`/trips/:tripId/polls`)
- List active and closed polls
- Create poll form: question + options
- Vote on poll (single choice)
- Show vote counts and percentages
- Close/delete polls

### 4.10 Weather Page (`/trips/:tripId/weather`)
- Display weather forecast for trip dates
- Show current weather + daily forecast
- Location-based (from trip stops or manual entry)

### 4.11 Documents Page (`/trips/:tripId/documents`)
- List documents with icons by type
- Upload documents (PDF, images)
- Download/delete documents

### 4.12 Safety Page (`/trips/:tripId/safety`)
- List safety info by category (emergency, medical, general)
- Add/edit safety info: title, content, category
- Delete safety info

### 4.13 Photos Page (`/trips/:tripId/photos`)
- Grid gallery of photos
- Upload photos with captions
- Lightbox view for full-size
- Delete photos

---

## 5. Additional Tasks

### 5.1 Update Trip Members Endpoint
- Add endpoint to update member role: `PUT /api/v1/trips/{trip_id}/members/{member_id}`

### 5.2 Update Trip Endpoint
- Add endpoint to update trip details: `PUT /api/v1/trips/{trip_id}`

### 5.3 Generate Trip Invite Code
- Add endpoint to regenerate invite code: `POST /api/v1/trips/{trip_id}/invite-code`

### 5.4 Add .env to .gitignore (if not already)
- Ensure `.env` and `data/` are ignored

### 5.5 Test Full Flow
- Register new user
- Create trip
- Test all 13 features with actual data

---

## Progress Tracking

- [x] 1.1 Create requirements.txt
- [x] 2.1 Verify/create .env file
- [x] 2.2 Create data directory
- [x] 2.3 Run migrations
- [x] 2.4 Verify database tables
- [x] 3.1 Stops API
- [x] 3.2 Itinerary API
- [x] 3.3 Roles API
- [x] 3.4 Packing API
- [x] 3.5 Budget/Expenses API
- [x] 3.6 Outfits API
- [x] 3.7 Moodboard API
- [x] 3.8 Chat/Messages API
- [x] 3.9 Polls API
- [x] 3.10 Weather API
- [x] 3.11 Documents API
- [x] 3.12 Safety Info API
- [x] 3.13 Photos API
- [x] 3.14 File Upload Support
- [x] 3.15 Update Router
- [x] 4.1 Map Page
- [x] 4.2 Itinerary Page
- [x] 4.3 Roles Page
- [x] 4.4 Packing Page
- [x] 4.5 Budget Page
- [x] 4.6 Outfits Page
- [x] 4.7 Moodboard Page
- [x] 4.8 Chat Page
- [x] 4.9 Polls Page
- [x] 4.10 Weather Page
- [x] 4.11 Documents Page
- [x] 4.12 Safety Page
- [x] 4.13 Photos Page
- [x] 5.1 Update Trip Members Endpoint
- [x] 5.2 Update Trip Endpoint
- [x] 5.3 Generate Trip Invite Code
- [x] 5.4 Gitignore check
- [x] 5.5 Test Full Flow
