import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"
import { authStore } from "@/stores/authStore"
import AppShell from "@/components/layout/AppShell"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = authStore((s) => s.user)
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

const router = createBrowserRouter([
  { path: "/setup", 
    lazy: async () => ({ 
      Component: (await import("@/pages/SetupPage")).default 
    }) 
  },
  { path: "/login", 
    lazy: async () => ({ 
      Component: (await import("@/pages/LoginPage")).default 
    }) 
  },
  { path: "/register", 
    lazy: async () => ({ 
      Component: (await import("@/pages/RegisterPage")).default 
    }) 
  },
  { path: "/join/:code", 
    lazy: async () => ({ 
      Component: (await import("@/pages/JoinTripPage")).default 
    }) 
  },
  {
    element: <ProtectedRoute><AppShell /></ProtectedRoute>,
    children: [
      { path: "/", 
        lazy: async () => ({ 
          Component: (await import("@/pages/TripsListPage")).default 
        }) 
      },
      { path: "/trips/:tripId", 
        lazy: async () => ({ 
          Component: (await import("@/pages/TripDashboardPage")).default 
        }) 
      },
      { path: "/trips/:tripId/map", 
        lazy: async () => ({ 
          Component: (await import("@/pages/MapPage")).default 
        }) 
      },
      { path: "/trips/:tripId/itinerary", 
        lazy: async () => ({ 
          Component: (await import("@/pages/ItineraryPage")).default 
        }) 
      },
      { path: "/trips/:tripId/roles", 
        lazy: async () => ({ 
          Component: (await import("@/pages/RolesPage")).default 
        }) 
      },
      { path: "/trips/:tripId/packing", 
        lazy: async () => ({ 
          Component: (await import("@/pages/PackingPage")).default 
        }) 
      },
      { path: "/trips/:tripId/budget", 
        lazy: async () => ({ 
          Component: (await import("@/pages/BudgetPage")).default 
        }) 
      },
      { path: "/trips/:tripId/outfits", 
        lazy: async () => ({ 
          Component: (await import("@/pages/OutfitsPage")).default 
        }) 
      },
      { path: "/trips/:tripId/moodboard", 
        lazy: async () => ({ 
          Component: (await import("@/pages/MoodboardPage")).default 
        }) 
      },
      { path: "/trips/:tripId/chat", 
        lazy: async () => ({ 
          Component: (await import("@/pages/ChatPage")).default 
        }) 
      },
      { path: "/trips/:tripId/polls", 
        lazy: async () => ({ 
          Component: (await import("@/pages/PollsPage")).default 
        }) 
      },
      { path: "/trips/:tripId/weather", 
        lazy: async () => ({ 
          Component: (await import("@/pages/WeatherPage")).default 
        }) 
      },
      { path: "/trips/:tripId/documents", 
        lazy: async () => ({ 
          Component: (await import("@/pages/DocumentsPage")).default 
        }) 
      },
      { path: "/trips/:tripId/safety", 
        lazy: async () => ({ 
          Component: (await import("@/pages/SafetyPage")).default 
        }) 
      },
      { path: "/trips/:tripId/photos", 
        lazy: async () => ({ 
          Component: (await import("@/pages/PhotosPage")).default 
        }) 
      },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
