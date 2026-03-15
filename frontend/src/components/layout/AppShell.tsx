import { Outlet, useParams } from "react-router-dom"
import { useEffect } from "react"
import Sidebar from "./Sidebar"
import BottomNav from "./BottomNav"
import TopBar from "./TopBar"
import { tripStore } from "@/stores/tripStore"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"

export default function AppShell() {
  const { tripId } = useParams()
  const setActiveTrip = tripStore((s) => s.setActiveTrip)

  const { data: trip } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => api.get(`/trips/${tripId}`).then((r) => r.data),
    enabled: !!tripId,
  })

  useEffect(() => {
    setActiveTrip(trip ?? null)
  }, [trip])

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border">
        <Sidebar />
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
        <nav className="md:hidden border-t border-border bg-surface pb-safe">
          <BottomNav />
        </nav>
      </div>
    </div>
  )
}
