# Source Code - Frontend

This directory contains all frontend source code.

## Directory Structure

| Directory | Description |
|-----------|-------------|
| `router/` | React Router configuration with lazy loading |
| `lib/` | Utilities: API client, React Query client, class name utils |
| `stores/` | Zustand stores for auth and active trip state |
| `components/` | React components (layout, common, UI primitives) |
| `pages/` | Page components (18 total) |
| `hooks/` | Custom hooks (currently empty) |
| `types/` | TypeScript type definitions (currently empty) |
| `features/` | Feature-based modules (currently empty) |

## Key Files

| File | Description |
|------|-------------|
| `main.tsx` | Application entry point, renders App |
| `App.tsx` | Root component with router and providers |
| `index.css` | Tailwind CSS directives and global styles |
| `App.css` | App-specific styles |

## Data Flow

```
Pages → Hooks/Components → lib/api.ts → Backend API
                ↓
         React Query (queryClient.ts)
                ↓
         Zustand Stores (stores/)
```

## Adding New Features

1. Create page in `pages/`
2. Add route in `router/index.tsx`
3. Create components in `components/`
4. Add API calls in `lib/api.ts`
5. Configure React Query hooks as needed

See subdirectories for detailed documentation.
