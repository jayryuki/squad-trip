# Page Components

All page components for the Squad Trip application.

## Shared Components

Pages use shared components from `@/components/common/`:
- `FeatureCard` - Dashboard navigation grid (TripDashboardPage)
- `ListCard` - Generic list item cards
- `CreatorTag` - Shows which user created an item
- `EmptyState` - Empty state with icon, title, action
- `StopForm` - Form for adding/editing Map stops (used by MapPage and ItineraryPage)

## Authentication Pages

| Page | Path | Description |
|------|------|-------------|
| `SetupPage.tsx` | `/setup` | Initial database setup (SQLite/PostgreSQL) |
| `LoginPage.tsx` | `/login` | User login with email/password |
| `RegisterPage.tsx` | `/register` | User registration |
| `JoinTripPage.tsx` | `/join/:code` | Join trip via invite code |

## Main Pages

| Page | Path | Description |
|------|------|-------------|
| `TripsListPage.tsx` | `/trips` | List all user's trips, create/delete trips |
| `TripDashboardPage.tsx` | `/trips/:tripId` | Trip overview with 13 feature cards |
| `UserProfilePage.tsx` | `/profile` | View/edit user profile |

## Trip Feature Pages

| Page | Path | Description |
|------|------|-------------|
| `MapPage.tsx` | `/trips/:tripId/map` | Interactive map with Leaflet, draggable stops, auto-fit to show all stops |
| `ItineraryPage.tsx` | `/trips/:tripId/itinerary` | Day-by-day activity planning, linked to Map stops |
| `PackingPage.tsx` | `/trips/:tripId/packing` | Shared packing list with categories |
| `BudgetPage.tsx` | `/trips/:tripId/budget` | Expense tracking and splitting |
| `OutfitsPage.tsx` | `/trips/:tripId/outfits` | Outfit planning with images |
| `MoodboardPage.tsx` | `/trips/:tripId/moodboard` | Inspiration image board |
| `ChatPage.tsx` | `/trips/:tripId/chat` | Real-time group messaging |
| `PollsPage.tsx` | `/trips/:tripId/polls` | Group voting polls |
| `WeatherPage.tsx` | `/trips/:tripId/weather` | Weather forecast (placeholder) |
| `DocumentsPage.tsx` | `/trips/:tripId/documents` | File sharing |
| `SafetyPage.tsx` | `/trips/:tripId/safety` | Safety information |
| `PhotosPage.tsx` | `/trips/:tripId/photos` | Trip photo gallery |
| `RolesPage.tsx` | `/trips/:tripId/roles` | Trip role assignments |

## Adding New Pages

1. Create component in `pages/`
2. Add route in `router/index.tsx`
3. Implement with layout wrapper as needed
