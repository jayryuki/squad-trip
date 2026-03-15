import React, { useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MapContainer, TileLayer, Popup, useMap, Marker } from "react-leaflet"
import { Loader2, Plus, Trash2, GripVertical, MapPin, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageWrapper from "@/components/layout/PageWrapper"
import api from "@/lib/api"
import { toast } from "sonner"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const markerIcon = (orderIndex: number) => L.divIcon({
  className: "custom-marker",
  html: `<div style="
    background-color: #e63946;
    width: 30px;
    height: 30px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  "><span style="
    transform: rotate(45deg);
    color: white;
    font-size: 12px;
    font-weight: bold;
  ">${orderIndex + 1}</span></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
})

interface Stop {
  id: number
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  notes: string | null
  order_index: number
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
  )
  const data = await response.json()
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  }
  return null
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  map.setView(center, map.getZoom())
  return null
}

export default function MapPage() {
  const { tripId } = useParams()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [editingStop, setEditingStop] = useState<Stop | null>(null)
  const [newStop, setNewStop] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    notes: "",
  })

  const { data: stops, isLoading } = useQuery<Stop[]>({
    queryKey: ["stops", tripId],
    queryFn: () => api.get(`/trips/${tripId}/stops`).then((r) => r.data),
  })

  const createStop = useMutation({
    mutationFn: (data: typeof newStop) =>
      api.post(`/trips/${tripId}/stops`, {
        name: data.name,
        address: data.address || null,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        notes: data.notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stops", tripId] })
      setShowAddForm(false)
      setNewStop({ name: "", address: "", latitude: "", longitude: "", notes: "" })
      toast.success("Stop added!")
    },
    onError: () => toast.error("Failed to add stop"),
  })

  const deleteStop = useMutation({
    mutationFn: (stopId: number) => api.delete(`/trips/${tripId}/stops/${stopId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stops", tripId] })
      toast.success("Stop deleted")
    },
    onError: () => toast.error("Failed to delete stop"),
  })

  const updateStop = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Stop> }) =>
      api.put(`/trips/${tripId}/stops/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stops", tripId] })
      setEditingStop(null)
      toast.success("Stop updated!")
    },
    onError: () => toast.error("Failed to update stop"),
  })

  const handleEditGeocode = async () => {
    if (!editingStop?.address) {
      toast.error("Enter an address to geocode")
      return
    }
    setIsGeocoding(true)
    try {
      const coords = await geocodeAddress(editingStop.address)
      if (coords) {
        setEditingStop({
          ...editingStop,
          latitude: coords.lat,
          longitude: coords.lng,
        })
        toast.success("Address found!")
      } else {
        toast.error("Address not found")
      }
    } catch {
      toast.error("Failed to geocode")
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleGeocode = async () => {
    if (!newStop.address) {
      toast.error("Enter an address to geocode")
      return
    }
    setIsGeocoding(true)
    try {
      const coords = await geocodeAddress(newStop.address)
      if (coords) {
        setNewStop({
          ...newStop,
          latitude: coords.lat.toString(),
          longitude: coords.lng.toString(),
        })
        toast.success("Address found!")
      } else {
        toast.error("Address not found. Try a more specific address.")
      }
    } catch {
      toast.error("Failed to geocode address")
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Auto-geocode if address provided but no coordinates
    if (newStop.address && (!newStop.latitude || !newStop.longitude)) {
      setIsGeocoding(true)
      try {
        const coords = await geocodeAddress(newStop.address)
        if (coords) {
          const updatedStop = {
            ...newStop,
            latitude: coords.lat.toString(),
            longitude: coords.lng.toString(),
          }
          createStop.mutate(updatedStop)
          toast.success("Address found and stop added!")
        } else {
          toast.error("Address not found. Try a more specific address or enter coordinates manually.")
        }
      } catch {
        toast.error("Failed to geocode address")
      } finally {
        setIsGeocoding(false)
      }
    } else {
      createStop.mutate(newStop)
    }
  }

  const defaultCenter: [number, number] = [39.8283, -98.5795]
  const mapCenter = stops && stops.length > 0 && stops[0].latitude && stops[0].longitude
    ? [stops[0].latitude, stops[0].longitude] as [number, number]
    : defaultCenter

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
          <h1 className="text-2xl font-display font-bold gradient-text">Map</h1>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="mr-2 size-4" />
            Add Stop
          </Button>
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Stop</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newStop.name}
                      onChange={(e) => setNewStop({ ...newStop, name: e.target.value })}
                      placeholder="Stop name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <div className="flex gap-2">
                      <Input
                        id="address"
                        value={newStop.address}
                        onChange={(e) => setNewStop({ ...newStop, address: e.target.value })}
                        placeholder="Address"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleGeocode}
                        disabled={isGeocoding || !newStop.address}
                        title="Geocode address to get coordinates"
                      >
                        {isGeocoding ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <MapPin className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={newStop.latitude}
                      onChange={(e) => setNewStop({ ...newStop, latitude: e.target.value })}
                      placeholder="39.8283"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={newStop.longitude}
                      onChange={(e) => setNewStop({ ...newStop, longitude: e.target.value })}
                      placeholder="-98.5795"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={newStop.notes}
                    onChange={(e) => setNewStop({ ...newStop, notes: e.target.value })}
                    placeholder="Notes about this stop"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createStop.isPending}>
                    {createStop.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Add Stop
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="h-[400px] rounded-lg overflow-hidden border border-border">
          <MapContainer center={mapCenter} zoom={4} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={mapCenter} />
            {stops?.map((stop) => {
              if (!stop.latitude || !stop.longitude) return null
              return (
                <React.Fragment key={stop.id}>
                  <Marker 
                    position={[stop.latitude, stop.longitude]}
                    icon={markerIcon(stop.order_index)}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold">{stop.name}</h3>
                        {stop.address && <p className="text-sm">{stop.address}</p>}
                        {stop.notes && <p className="text-sm mt-1">{stop.notes}</p>}
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              )
            })}
          </MapContainer>
        </div>

        {stops && stops.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Stops ({stops.length})</h2>
            <div className="grid gap-2">
              {stops.map((stop) => (
                <Card key={stop.id} className="p-4">
<div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical className="size-4 text-foreground-muted" />
                        <div>
                          <h3 className="font-medium">{stop.name}</h3>
                          {stop.address && <p className="text-sm text-foreground-muted">{stop.address}</p>}
                          {!stop.latitude && !stop.longitude && (
                            <p className="text-xs text-amber-500 mt-1">No coordinates - click edit to add</p>
                          )}
                          {stop.notes && <p className="text-sm text-foreground-muted mt-1">{stop.notes}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingStop(stop)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteStop.mutate(stop.id)}
                        >
                          <Trash2 className="size-4 text-danger" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {editingStop && (
          <Card>
            <CardHeader>
              <CardTitle>Edit Stop</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Address</Label>
                  <div className="flex gap-2">
                    <Input
                      value={editingStop.address || ""}
                      onChange={(e) => setEditingStop({ ...editingStop, address: e.target.value })}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon" onClick={handleEditGeocode} disabled={isGeocoding}>
                      {isGeocoding ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Latitude</Label>
                    <Input
                      type="number"
                      step="any"
                      value={editingStop.latitude ?? ""}
                      onChange={(e) => setEditingStop({ ...editingStop, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Longitude</Label>
                    <Input
                      type="number"
                      step="any"
                      value={editingStop.longitude ?? ""}
                      onChange={(e) => setEditingStop({ ...editingStop, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateStop.mutate({ id: editingStop.id, data: editingStop })}
                    disabled={updateStop.isPending}
                  >
                    {updateStop.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditingStop(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(!stops || stops.length === 0) && !showAddForm && (
          <div className="text-center py-8 text-foreground-muted">
            <p>No stops added yet. Add your first stop to see it on the map!</p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
