# State Management - Zustand Stores

Lightweight state management using Zustand.

## Stores

| File | Description |
|------|-------------|
| `authStore.ts` | Authentication state (user, token) |
| `tripStore.ts` | Active trip state |

## Auth Store (`authStore.ts`)

Manages user authentication state.

### State

| Property | Type | Description |
|----------|------|-------------|
| user | User \| null | Current authenticated user |
| accessToken | string \| null | JWT access token |

### Actions

| Action | Description |
|--------|-------------|
| `setUser(user)` | Set current user |
| `setAccessToken(token)` | Set access token |
| `logout()` | Clear user and token |

### Persistence

User is persisted to localStorage for session restoration.

### Usage

```typescript
import { useAuthStore } from '@/stores/authStore'

const { user, logout } = useAuthStore()
```

## Trip Store (`tripStore.ts`)

Manages the currently active trip across the application.

### State

| Property | Type | Description |
|----------|------|-------------|
| activeTrip | Trip \| null | Currently selected trip |

### Actions

| Action | Description |
|--------|-------------|
| `setActiveTrip(trip)` | Set active trip |

### Usage

```typescript
import { useTripStore } from '@/stores/tripStore'

const { activeTrip, setActiveTrip } = useTripStore()
```

## Adding New Stores

1. Create `nameStore.ts` in this directory
2. Define types and store using Zustand's `create`
3. Export for use in components
