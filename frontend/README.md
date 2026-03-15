# Frontend - Squad Trip

React-based frontend for the Squad Trip application.

## Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Routing:** React Router v6
- **State Management:** Zustand
- **Data Fetching:** TanStack React Query (React Query)
- **HTTP Client:** Axios
- **Maps:** Leaflet + React Leaflet
- **Icons:** Lucide React

## Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── main.tsx           # Entry point
│   ├── App.tsx           # Root component
│   ├── index.css         # Global styles (Tailwind)
│   ├── App.css          # App-specific styles
│   ├── router/          # Routing configuration
│   ├── lib/             # Utilities and API client
│   ├── stores/          # Zustand state stores
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom hooks (currently empty)
│   ├── types/          # TypeScript types (currently empty)
│   ├── features/       # Feature modules (currently empty)
│   └── assets/         # Local assets
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── postcss.config.js
```

## Key Dependencies

| Package | Purpose |
|---------|---------|
| react-router-dom | Client-side routing |
| zustand | Lightweight state management |
| @tanstack/react-query | Server state/cache management |
| axios | HTTP client |
| leaflet, react-leaflet | Map integration |
| lucide-react | Icon library |
| sonner | Toast notifications |
| clsx, tailwind-merge | Class name utilities |

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default.

## Features

The frontend implements 18 pages:

| Category | Pages |
|----------|-------|
| Auth | Setup, Login, Register, Join Trip |
| Main | Trips List, Trip Dashboard, User Profile |
| Trip Features | Map, Itinerary, Roles, Packing, Budget, Outfits, Moodboard, Chat, Polls, Weather, Documents, Safety, Photos |

See `src/` folder for detailed module documentation.
