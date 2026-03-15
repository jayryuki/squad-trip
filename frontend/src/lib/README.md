# Library Utilities

Centralized utilities and API client configuration.

## Files

| File | Description |
|------|-------------|
| `api.ts` | Axios instance with auth interceptors and token refresh logic |
| `queryClient.ts` | TanStack React Query client configuration |
| `utils.ts` | Utility functions (cn, formatCurrency) |

## API Client (`api.ts`)

The centralized Axios client with:

- Base URL: `/api/v1`
- Automatic JWT token injection via request interceptor
- Token refresh on 401 responses
- Automatic retry of failed requests after refresh
- Logout on refresh failure

### Usage

```typescript
import api from '@/lib/api'

// GET request
const response = await api.get('/trips')

// POST request
const response = await api.post('/trips', { name: 'My Trip' })
```

## React Query Client (`queryClient.ts`)

Configuration for TanStack React Query:

- Stale time: 30 seconds
- GC time: 10 minutes
- Retries: 2 on failure
- Refetch on focus: disabled

## Utilities (`utils.ts`)

| Function | Description |
|----------|-------------|
| `cn(...)` | Merges Tailwind CSS classes (wraps clsx + tailwind-merge) |
| `formatCurrency(amount, currency)` | Formats number as currency string (default USD) |

### Usage

```typescript
import { cn, formatCurrency } from '@/lib/utils'

// Class name merging
<div className={cn('base-class', condition && 'conditional-class')} />

// Currency formatting
formatCurrency(1234.56) // "$1,234.56"
formatCurrency(99.99, 'EUR') // "€99.99"
```
