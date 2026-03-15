import { useLocation } from "react-router-dom"
import { ArrowLeft, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { tripStore } from "@/stores/tripStore"

export default function TopBar() {
  const location = useLocation()
  const activeTrip = tripStore((s) => s.activeTrip)
  
  const isTripPage = location.pathname.includes("/trips/")
  const pageName = isTripPage ? activeTrip?.name || "Trip" : "Squad Trip"

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-surface">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
        </Button>
        {isTripPage && (
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="size-5" />
          </Button>
        )}
        <h1 className="font-display text-lg font-semibold">{pageName}</h1>
      </div>
    </header>
  )
}
