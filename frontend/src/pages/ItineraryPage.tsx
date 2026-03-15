import { useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2, Calendar as CalendarIcon, Clock, MapPin, Pencil, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageWrapper from "@/components/layout/PageWrapper"
import { CreatorTag } from "@/components/common/CreatorTag"
import { StopForm } from "@/components/common/StopForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import api from "@/lib/api"
import { toast } from "sonner"
import { format } from "date-fns"

interface ItineraryItem {
  id: number
  title: string
  description: string | null
  date: string | null
  start_time: string | null
  end_time: string | null
  location: string | null
  assigned_members: string | null
  order_index: number
  creator_id: number | null
  stop_id: number | null
}

interface Stop {
  id: number
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  notes: string | null
  order_index: number
  creator_id: number | null
}

export default function ItineraryPage() {
  const { tripId } = useParams()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [showLocationDialog, setShowLocationDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null)
  const [selectedStopId, setSelectedStopId] = useState<number | "custom" | "">("")
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    date: "",
    start_time: "",
    end_time: "",
    location: "",
  })
  const [editItem, setEditItem] = useState({
    title: "",
    description: "",
    date: "",
    start_time: "",
    end_time: "",
    location: "",
    stop_id: null as number | null,
  })

  const { data: items, isLoading } = useQuery<ItineraryItem[]>({
    queryKey: ["itinerary", tripId],
    queryFn: () => api.get(`/trips/${tripId}/itinerary`).then((r) => r.data),
  })

  const { data: stops } = useQuery<Stop[]>({
    queryKey: ["stops", tripId],
    queryFn: () => api.get(`/trips/${tripId}/stops`).then((r) => r.data),
  })

  const createItem = useMutation({
    mutationFn: () => {
      const payload: Record<string, string | number> = { title: newItem.title }
      if (newItem.description) payload.description = newItem.description
      if (newItem.date) payload.date = newItem.date
      if (newItem.start_time) payload.start_time = newItem.start_time
      if (newItem.end_time) payload.end_time = newItem.end_time
      if (newItem.location) payload.location = newItem.location
      if (selectedStopId && selectedStopId !== "custom") {
        payload.stop_id = selectedStopId as number
      }
      return api.post(`/trips/${tripId}/itinerary`, payload as Record<string, string>)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", tripId] })
      setShowAddForm(false)
      setNewItem({ title: "", description: "", date: "", start_time: "", end_time: "", location: "" })
      setSelectedStopId("")
      toast.success("Item added!")
    },
    onError: () => toast.error("Failed to add item"),
  })

  const createStop = useMutation({
    mutationFn: (data: { name: string; address: string; latitude: string; longitude: string; notes: string }) =>
      api.post(`/trips/${tripId}/stops`, {
        name: data.name,
        address: data.address || null,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        notes: data.notes || null,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["stops", tripId] })
      setSelectedStopId(response.data.id)
      toast.success("Stop added to map!")
    },
    onError: () => toast.error("Failed to add stop"),
  })

  const deleteItem = useMutation({
    mutationFn: (itemId: number) => api.delete(`/trips/${tripId}/itinerary/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", tripId] })
      toast.success("Item deleted")
    },
    onError: () => toast.error("Failed to delete item"),
  })

  const updateItem = useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: Record<string, string> }) =>
      api.put(`/trips/${tripId}/itinerary/${itemId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", tripId] })
      setEditingItem(null)
      toast.success("Item updated!")
    },
    onError: () => toast.error("Failed to update item"),
  })

  const handleEdit = (item: ItineraryItem) => {
    setEditingItem(item)
    setEditItem({
      title: item.title,
      description: item.description || "",
      date: item.date || "",
      start_time: item.start_time || "",
      end_time: item.end_time || "",
      location: item.location || "",
      stop_id: item.stop_id,
    })
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    const payload: Record<string, string | number> = { title: editItem.title }
    if (editItem.description) payload.description = editItem.description
    if (editItem.date) payload.date = editItem.date
    if (editItem.start_time) payload.start_time = editItem.start_time
    if (editItem.end_time) payload.end_time = editItem.end_time
    if (editItem.location) payload.location = editItem.location
    if (editItem.stop_id) payload.stop_id = editItem.stop_id
    updateItem.mutate({ itemId: editingItem.id, data: payload as Record<string, string> })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createItem.mutate()
  }

  const groupedItems = items?.reduce((acc, item) => {
    const dateKey = item.date || "No Date"
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(item)
    return acc
  }, {} as Record<string, ItineraryItem[]>)

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr + "T00:00:00"), "EEEE, MMMM d, yyyy")
  }

  const formatTime = (timeStr: string) => {
    return format(new Date("2000-01-01T" + timeStr), "h:mm a")
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

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold gradient-text">Itinerary</h1>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="mr-2 size-4" />
            Add Item
          </Button>
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add Itinerary Item</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newItem.title}
                      onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                      placeholder="Activity name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newItem.date}
                      onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={newItem.start_time}
                      onChange={(e) => setNewItem({ ...newItem, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={newItem.end_time}
                      onChange={(e) => setNewItem({ ...newItem, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <select
                    id="location"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedStopId}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "custom") {
                        setShowLocationDialog(true)
                      } else if (value === "") {
                        setSelectedStopId("")
                        setNewItem({ ...newItem, location: "" })
                      } else {
                        setSelectedStopId(parseInt(value))
                        const stop = stops?.find((s) => s.id === parseInt(value))
                        if (stop) {
                          setNewItem({ ...newItem, location: stop.name })
                        }
                      }
                    }}
                  >
                    <option value="">Select a location (optional)</option>
                    {stops?.map((stop) => (
                      <option key={stop.id} value={stop.id}>
                        {stop.name}
                      </option>
                    ))}
                    <option value="custom">+ Add custom location...</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Description"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createItem.isPending}>
                    {createItem.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Add Item
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowAddForm(false)
                    setSelectedStopId("")
                  }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Location</DialogTitle>
            </DialogHeader>
            <StopForm
              onSubmit={(data) => {
                createStop.mutate(data)
                setShowLocationDialog(false)
              }}
              onCancel={() => setShowLocationDialog(false)}
              isPending={createStop.isPending}
              submitLabel="Add to Map"
            />
          </DialogContent>
        </Dialog>

        {editingItem && (
          <Card>
            <CardHeader>
              <CardTitle>Edit Itinerary Item</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={editItem.title}
                      onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                      placeholder="Activity name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-date">Date</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={editItem.date}
                      onChange={(e) => setEditItem({ ...editItem, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-start_time">Start Time</Label>
                    <Input
                      id="edit-start_time"
                      type="time"
                      value={editItem.start_time}
                      onChange={(e) => setEditItem({ ...editItem, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-end_time">End Time</Label>
                    <Input
                      id="edit-end_time"
                      type="time"
                      value={editItem.end_time}
                      onChange={(e) => setEditItem({ ...editItem, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <select
                    id="edit-location"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editItem.stop_id ?? ""}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "") {
                        setEditItem({ ...editItem, stop_id: null, location: "" })
                      } else {
                        const stop = stops?.find((s) => s.id === parseInt(value))
                        if (stop) {
                          setEditItem({ ...editItem, stop_id: stop.id, location: stop.name })
                        }
                      }
                    }}
                  >
                    <option value="">Select a location (optional)</option>
                    {stops?.map((stop) => (
                      <option key={stop.id} value={stop.id}>
                        {stop.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={editItem.description}
                    onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                    placeholder="Description"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={updateItem.isPending}>
                    {updateItem.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {groupedItems && Object.keys(groupedItems).length > 0 ? (
          Object.entries(groupedItems)
            .sort(([a], [b]) => {
              if (a === "No Date") return 1
              if (b === "No Date") return -1
              return a.localeCompare(b)
            })
            .map(([date, dateItems]) => (
              <div key={date} className="space-y-2">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CalendarIcon className="size-5 text-brand" />
                  {date === "No Date" ? "No Date" : formatDate(date)}
                </h2>
                <div className="space-y-2">
                  {dateItems?.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{item.title}</h3>
                            <CreatorTag creatorId={item.creator_id} />
                          </div>
                          {item.date && (
                            <p className="text-sm text-foreground-muted flex items-center gap-1">
                              <CalendarIcon className="size-3" />
                              {formatDate(item.date)}
                            </p>
                          )}
                          {(item.start_time || item.end_time) && (
                            <p className="text-sm text-foreground-muted flex items-center gap-1">
                              <Clock className="size-3" />
                              {item.start_time && formatTime(item.start_time)}
                              {item.end_time && ` - ${formatTime(item.end_time)}`}
                            </p>
                          )}
                          {item.location && (
                            <p className="text-sm text-foreground-muted flex items-center gap-1">
                              <MapPin className="size-3" />
                              {item.location}
                              {item.stop_id && !stops?.find((s) => s.id === item.stop_id) && (
                                <span title="This stop has been removed from the map">
                                  <AlertTriangle className="size-3 text-amber-500" />
                                </span>
                              )}
                            </p>
                          )}
                          {item.description && (
                            <p className="text-sm text-foreground-muted mt-2">{item.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteItem.mutate(item.id)}>
                            <Trash2 className="size-4 text-danger" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-8 text-foreground-muted">
            <p>No itinerary items yet. Add your first item!</p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
