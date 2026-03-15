import { useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2, Calendar as CalendarIcon, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageWrapper from "@/components/layout/PageWrapper"
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
}

export default function ItineraryPage() {
  const { tripId } = useParams()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    date: "",
    start_time: "",
    end_time: "",
    location: "",
  })

  const { data: items, isLoading } = useQuery<ItineraryItem[]>({
    queryKey: ["itinerary", tripId],
    queryFn: () => api.get(`/trips/${tripId}/itinerary`).then((r) => r.data),
  })

  const createItem = useMutation({
    mutationFn: () =>
      api.post(`/trips/${tripId}/itinerary`, {
        title: newItem.title,
        description: newItem.description || null,
        date: newItem.date || null,
        start_time: newItem.start_time || null,
        end_time: newItem.end_time || null,
        location: newItem.location || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", tripId] })
      setShowAddForm(false)
      setNewItem({ title: "", description: "", date: "", start_time: "", end_time: "", location: "" })
      toast.success("Item added!")
    },
    onError: () => toast.error("Failed to add item"),
  })

  const deleteItem = useMutation({
    mutationFn: (itemId: number) => api.delete(`/trips/${tripId}/itinerary/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", tripId] })
      toast.success("Item deleted")
    },
    onError: () => toast.error("Failed to delete item"),
  })

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
                  <Input
                    id="location"
                    value={newItem.location}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                    placeholder="Location"
                  />
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
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
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
                  {date === "No Date" ? "No Date" : format(new Date(date), "EEEE, MMMM d, yyyy")}
                </h2>
                <div className="space-y-2">
                  {dateItems?.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium">{item.title}</h3>
                          {(item.start_time || item.end_time) && (
                            <p className="text-sm text-foreground-muted flex items-center gap-1">
                              <Clock className="size-3" />
                              {item.start_time}
                              {item.end_time && ` - ${item.end_time}`}
                            </p>
                          )}
                          {item.location && (
                            <p className="text-sm text-foreground-muted flex items-center gap-1">
                              <MapPin className="size-3" />
                              {item.location}
                            </p>
                          )}
                          {item.description && (
                            <p className="text-sm text-foreground-muted mt-2">{item.description}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteItem.mutate(item.id)}>
                          <Trash2 className="size-4 text-danger" />
                        </Button>
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
