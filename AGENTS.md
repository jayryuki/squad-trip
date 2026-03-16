# Agent Guidelines for Squad Trip

This is a full-stack application with a React/TypeScript frontend and FastAPI Python backend.

## Project Structure

```
squad-trip/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/    # UI components (ui/, common/, layout/)
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities (api.ts, utils.ts, queryClient.ts)
│   │   ├── stores/        # Zustand stores (authStore.ts, tripStore.ts)
│   │   └── router/        # React Router configuration
│   └── package.json
└── backend/           # FastAPI Python
    ├── app/
    │   ├── api/v1/    # API endpoints
    │   ├── core/      # Config, database, security
    │   ├── models/    # SQLAlchemy models
    │   └── websockets/
    ├── main.py
    └── requirements.txt
```

## Build Commands

### Frontend (cd frontend)

```bash
npm run dev          # Start development server (port 5173)
npm run build        # TypeScript check + production build
npm run lint         # Run ESLint (max-warnings 0)
npm run preview      # Preview production build
```

### Running a Single Test

No tests currently exist in this codebase. If tests are added:
- Use Vitest for frontend (follows Vite conventions)
- Run single test: `npm run test -- <test-file>` or `vitest run <test-file>`

### Backend

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload        # Development server (port 8000)
alembic upgrade head             # Run migrations
alembic migration create <name>  # Create migration
```

## Code Style Guidelines

### TypeScript / React

**Imports**
- Use path alias `@/` for relative imports from `src/`
- Order: React imports → external libs → internal components/lib → types
- Example: `import { useState } from "react"; import axios from "axios"; import { cn } from "@/lib/utils";`

**Formatting**
- Use double quotes for strings (`"string"`, not `'string'`)
- Use Prettier defaults (semi-colons, single quotes off)
- 2-space indentation in TSX/JSX

**Types**
- Enable strict TypeScript (`strict: true` in tsconfig.json)
- Always type function parameters and return values
- Use `interface` for object shapes, `type` for unions/intersections
- Export types when used across files

**Naming Conventions**
- Components: PascalCase (`TripDashboardPage.tsx`)
- Files: kebab-case (`auth-store.ts`)
- Variables/functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- React components: Should have `displayName` when using `forwardRef`

**Components**
- Use `React.forwardRef` for components that need DOM refs
- Use `class-variance-authority` (cva) for component variants
- Use `cn()` utility for merging Tailwind classes
- Extract common UI components to `components/ui/`

**State Management**
- Use Zustand for global client state
- Use React Query (TanStack Query) for server state
- Use React `useState` for local component state

**Error Handling**
- Use try/catch with async/await
- Return proper HTTP errors with `HTTPException` (backend) or show user feedback (frontend)
- Handle API errors in axios interceptors (see `lib/api.ts`)

### Python / FastAPI

**Imports**
- Order: standard library → third-party → local application
- Use absolute imports (`from app.core.config import settings`)

**Naming**
- Variables/functions: snake_case
- Classes: PascalCase
- Constants: UPPER_SNAKE_CASE

**Type Hints**
- Use Python 3.10+ union syntax (`str | None` instead of `Optional[str]`)
- Use Pydantic `BaseModel` for request/response schemas

**Database**
- Use async SQLAlchemy (`AsyncSession`)
- Use Alembic for migrations
- Import models in `main.py` to register them with Base

**API Endpoints**
- Use dependency injection for auth (`Depends(get_current_user)`)
- Use `HTTPException` for error responses with proper status codes

## Key Dependencies

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + tailwindcss-animate
- Radix UI (component primitives)
- Zustand (state)
- TanStack Query (server state)
- React Router DOM (routing)
- React Hook Form + Zod (forms)
- Recharts (charts)
- React Leaflet (maps)

### Backend
- FastAPI
- SQLAlchemy (async) + aiosqlite
- Pydantic v2
- python-jose (JWT)
- bcrypt (passwords)
- Alembic (migrations)

## Environment Variables

### Frontend
- No `.env` needed (uses Vite proxy to backend)

### Backend
- Copy `.env.example` to `.env` and configure:
  - `DATABASE_URL` (SQLite: `sqlite+aiosqlite:///data.db`)
  - `SECRET_KEY`
  - `CORS_ORIGINS`

## Common Tasks

**Add new API endpoint:**
1. Create/update endpoint in `backend/app/api/v1/<module>.py`
2. Register in `backend/app/api/v1/router.py`

**Add new frontend page:**
1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/router/index.tsx`

**Add new UI component:**
1. Follow pattern in `components/ui/button.tsx`
2. Use cva for variants, forwardRef for refs, cn for classes
