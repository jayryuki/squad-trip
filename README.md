# Squad Trip

> **IMPORTANT:** Read all README.md files in all folders to understand the codebase so you don't have to go line by line.

A full-stack trip planning application for groups. Plan trips together with features for mapping, itinerary, packing lists, budgets, chat, and more.

## Tech Stack

- **Backend:** FastAPI (Python)
- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Database:** SQLite (via SQLAlchemy with alembic migrations)
- **Maps:** Leaflet

## Features

- **Map** - Interactive trip map with stops
- **Itinerary** - Day-by-day activity planning
- **Roles** - Assign trip responsibilities (driver, cook, etc.)
- **Packing** - General and personal packing lists with visibility controls, bulk add items, custom categories
- **Budget** - Expense tracking and splitting
- **Outfits** - Outfit planning
- **Moodboard** - Inspiration images
- **Chat** - Real-time group messaging
- **Polls** - Group voting
- **Weather** - Trip weather forecast
- **Documents** - File sharing
- **Safety** - Emergency info
- **Photos** - Trip photo gallery

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
alembic upgrade head
```

Create a `.env` file in backend:
```
DATABASE_URL=sqlite+aiosqlite:///./data/squad-trip.db
SECRET_KEY=your-secret-key
```

Run backend:
```bash
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## API

The backend runs at `http://localhost:8000`. API docs available at `/docs`.

## License

MIT
