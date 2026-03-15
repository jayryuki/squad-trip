import { NavLink, useParams } from "react-router-dom"
import { Home, Map, Calendar, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/", icon: Home, label: "Home" },
]

export default function BottomNav() {
  const { tripId } = useParams()

  const getTripNavItems = () => {
    if (!tripId) return []
    return [
      { to: `/trips/${tripId}/map`, icon: Map, label: "Map" },
      { to: `/trips/${tripId}/itinerary`, icon: Calendar, label: "Plan" },
      { to: `/trips/${tripId}/roles`, icon: Users, label: "Roles" },
    ]
  }

  const tripNavItems = getTripNavItems()

  return (
    <div className="flex items-center justify-around h-16">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
              isActive ? "text-brand" : "text-foreground-muted hover:text-foreground"
            )
          }
        >
          <item.icon className="size-5" />
          <span className="text-xs">{item.label}</span>
        </NavLink>
      ))}
      {tripNavItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
              isActive ? "text-brand" : "text-foreground-muted hover:text-foreground"
            )
          }
        >
          <item.icon className="size-5" />
          <span className="text-xs">{item.label}</span>
        </NavLink>
      ))}
    </div>
  )
}
