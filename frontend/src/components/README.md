# React Components

Reusable UI components organized by purpose.

## Directory Structure

```
components/
├── layout/    # Layout components
├── common/    # Shared/common components
└── ui/        # UI primitives (shadcn/ui)
```

## Layout Components (`layout/`)

| Component | Description |
|-----------|-------------|
| `AppShell.tsx` | Main layout wrapper combining Sidebar, TopBar, BottomNav |
| `Sidebar.tsx` | Desktop navigation sidebar |
| `TopBar.tsx` | Mobile-friendly top bar with back button |
| `BottomNav.tsx` | Mobile bottom navigation |
| `PageWrapper.tsx` | Reusable page container with padding |

## Common Components (`common/`)

| Component | Description |
|-----------|-------------|
| `CreatorTag.tsx` | Badge showing which user created an item |
| `BadgeCard.tsx` | Displays user badges/achievements |
| `UserProfile.tsx` | Full profile with view/edit modes |
| `EmptyState.tsx` | Reusable empty state with icon, title, action |
| `ConfirmDialog.tsx` | Reusable confirmation dialog |
| `SkeletonCard.tsx` | Loading skeleton components |
| `FeatureCard.tsx` | Icon-based navigation card for dashboard grid |
| `ListCard.tsx` | Reusable list item card with title, subtitle, image, actions |
| `StopForm.tsx` | Form for adding/editing Map stops with geocoding |
| `EditCarDialog.tsx` | Modal dialog for editing car details (color, make/model, seats, driver transfer) |

## UI Components (`ui/`)

shadcn/ui components - reusable UI primitives:

| Component | Description |
|-----------|-------------|
| `button.tsx` | Button with variants |
| `input.tsx` | Input field |
| `label.tsx` | Form label |
| `card.tsx` | Card container |
| `badge.tsx` | Badge/label |
| `avatar.tsx` | Avatar with image and fallback |
| `dialog.tsx` | Modal dialog |
| `alert-dialog.tsx` | Confirmation dialog |
| `toast.tsx` | Toast notifications (sonner) |

## Usage

```typescript
import { Button } from '@/components/ui/button'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { EmptyState } from '@/components/common/EmptyState'
```
