import { NavLink, useLocation, useParams } from "react-router-dom"
import { 
  Home, Map, Calendar, Users, Luggage, DollarSign, 
  Shirt, Images, MessageSquare, Vote, Cloud, FileText, 
  Shield, Camera, LogOut 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { authStore } from "@/stores/authStore"
import { cn } from "@/lib/utils"

const mainNav = [
  { to: "/", icon: Home, label: "My Trips" },
]

const tripNav = [
  { to: "map", icon: Map, label: "Map" },
  { to: "itinerary", icon: Calendar, label: "Itinerary" },
  { to: "roles", icon: Users, label: "Roles" },
  { to: "packing", icon: Luggage, label: "Packing" },
  { to: "budget", icon: DollarSign, label: "Budget" },
  { to: "outfits", icon: Shirt, label: "Outfits" },
  { to: "moodboard", icon: Images, label: "Moodboard" },
  { to: "chat", icon: MessageSquare, label: "Chat" },
  { to: "polls", icon: Vote, label: "Polls" },
  { to: "weather", icon: Cloud, label: "Weather" },
  { to: "documents", icon: FileText, label: "Documents" },
  { to: "safety", icon: Shield, label: "Safety" },
  { to: "photos", icon: Camera, label: "Photos" },
]

export default function Sidebar() {
  const location = useLocation()
  const { tripId } = useParams()
  const logout = authStore((s) => s.logout)
  const isInTrip = location.pathname.includes("/trips/")

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h1 className="font-display text-xl font-bold gradient-text">Squad Trip</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-2">
        {mainNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors",
                isActive ? "bg-brand/10 text-brand" : "text-foreground-muted hover:bg-surface-raised hover:text-foreground"
              )
            }
          >
            <item.icon className="size-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
        
        {isInTrip && tripId && (
          <>
            <div className="my-3 mx-3 h-px bg-border" />
            {tripNav.map((item) => (
              <NavLink
                key={item.to}
                to={`/trips/${tripId}/${item.to}`}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors",
                    isActive ? "bg-brand/10 text-brand" : "text-foreground-muted hover:bg-surface-raised hover:text-foreground"
                  )
                }
              >
                <item.icon className="size-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>
      
      <div className="p-3 border-t border-border">
        <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
          <LogOut className="size-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
