# Routing Configuration

React Router v6 setup with lazy loading and route protection.

## File

| File | Description |
|------|-------------|
| `index.tsx` | Main router configuration |

## Routes

### Public Routes (No Auth Required)

| Path | Page | Description |
|------|------|-------------|
| `/setup` | SetupPage | Initial database setup |
| `/login` | LoginPage | User login |
| `/register` | RegisterPage | User registration |
| `/join/:code` | JoinTripPage | Join trip via invite code |

### Protected Routes (Auth Required)

| Path | Page | Description |
|------|------|-------------|
| `/trips` | TripsListPage | List all user's trips |
| `/profile` | UserProfilePage | User profile |
| `/trips/:tripId` | TripDashboardPage | Trip overview |
| `/trips/:tripId/map` | MapPage | Interactive map with auto-fit to show all stops |
| `/trips/:tripId/itinerary` | ItineraryPage | Day-by-day planning |
| `/trips/:tripId/roles` | RolesPage | Trip roles |
| `/trips/:tripId/packing` | PackingPage | Packing list |
| `/trips/:tripId/budget` | BudgetPage | Expense tracking |
| `/trips/:tripId/outfits` | OutfitsPage | Outfit planning |
| `/trips/:tripId/moodboard` | MoodboardPage | Inspiration board |
| `/trips/:tripId/chat` | ChatPage | Group chat |
| `/trips/:tripId/polls` | PollsPage | Group voting |
| `/trips/:tripId/weather` | WeatherPage | Weather forecast |
| `/trips/:tripId/documents` | DocumentsPage | File sharing |
| `/trips/:tripId/safety` | SafetyPage | Safety info |
| `/trips/:tripId/photos` | PhotosPage | Photo gallery |

## Route Protection

- `ProtectedRoute` wrapper checks authentication
- Unauthenticated users redirected to `/login`
- Setup page is accessible without auth (for first-time setup)

## Lazy Loading

All pages use React.lazy() for code splitting:

```typescript
const MapPage = lazy(() => import('@/pages/MapPage'))
```

## Usage

The router is used in `App.tsx`:

```typescript
import { RouterProvider } from 'react-router-dom'
import router from '@/router'

<RouterProvider router={router} />
```

## Adding New Routes

1. Create page component in `pages/`
2. Import and add to lazy loading list
3. Add route definition with path and element
4. Wrap protected routes with ProtectedRoute
