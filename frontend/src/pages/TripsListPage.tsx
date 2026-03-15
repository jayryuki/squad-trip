import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, MapPin, Calendar, Users, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
import PageWrapper from "@/components/layout/PageWrapper"
import EmptyState from "@/components/common/EmptyState"
import api from "@/lib/api"
import { toast } from "sonner"

interface Trip {
  id: number
  name: string
  type: string
  start_date: string
  end_date: string | null
  cover_image_url: string | null
  member_count: number
}

export default function TripsListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newTripName, setNewTripName] = useState("")
  
  const { data: trips, isLoading } = useQuery<Trip[]>({
    queryKey: ["trips"],
    queryFn: () => api.get("/trips").then((r) => r.data),
  })

  const createTrip = useMutation({
    mutationFn: (name: string) => api.post<Trip>("/trips", { name }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] })
      setShowCreate(false)
      setNewTripName("")
      navigate(`/trips/${data.data.id}`)
      toast.success("Trip created!")
    },
    onError: () => toast.error("Failed to create trip"),
  })

  const deleteTrip = useMutation({
    mutationFn: (tripId: number) => api.delete(`/trips/${tripId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] })
      navigate("/")
      toast.success("Trip deleted")
    },
    onError: () => toast.error("Failed to delete trip"),
  })

  const handleCreate = () => {
    if (newTripName.trim()) {
      createTrip.mutate(newTripName)
    }
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-brand" />
        </div>
      </PageWrapper>
    )
  }

  if (!trips?.length && !showCreate) {
    return (
      <PageWrapper>
        <EmptyState
          icon={MapPin}
          title="No trips yet"
          description="Start planning your first adventure with your crew!"
          actionLabel="Create Trip"
          onAction={() => setShowCreate(true)}
        />
        {showCreate && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Create New Trip</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="text"
                placeholder="Trip name"
                value={newTripName}
                onChange={(e) => setNewTripName(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createTrip.isPending}>
                  {createTrip.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold gradient-text">My Trips</h1>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 size-4" />
          New Trip
        </Button>
      </div>

      {showCreate && (
        <Card className="mb-6">
          <CardContent className="pt-4 space-y-4">
            <input
              type="text"
              placeholder="Trip name (e.g., Summer Road Trip 2024)"
              value={newTripName}
              onChange={(e) => setNewTripName(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createTrip.isPending || !newTripName.trim()}>
                {createTrip.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Create Trip
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {trips?.map((trip) => (
          <Card 
            key={trip.id} 
            className="cursor-pointer hover:border-border-strong hover:bg-surface-raised transition-all relative group"
            onClick={() => navigate(`/trips/${trip.id}`)}
          >
            <div 
              className="h-32 rounded-t-lg bg-cover bg-center"
              style={{ backgroundImage: trip.cover_image_url ? `url(${trip.cover_image_url})` : undefined }}
            >
              {!trip.cover_image_url && (
                <div className="h-full bg-gradient-to-br from-brand to-brand-dim flex items-center justify-center">
                  <MapPin className="size-12 text-white/50" />
                </div>
              )}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <AlertDialog>
                  <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="destructive" size="sm" className="h-8">
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Trip</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{trip.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteTrip.mutate(trip.id)}>
                        {deleteTrip.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{trip.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Calendar className="size-3" />
                {trip.start_date}
                {trip.end_date && ` - ${trip.end_date}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-foreground-muted">
                <Users className="size-4" />
                {trip.member_count} members
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageWrapper>
  )
}
