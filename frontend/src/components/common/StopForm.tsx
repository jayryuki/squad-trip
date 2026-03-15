import { useState } from "react"
import { Loader2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface StopFormData {
  name: string
  address: string
  latitude: string
  longitude: string
  notes: string
}

interface StopFormProps {
  onSubmit: (data: StopFormData) => void
  onCancel?: () => void
  isPending?: boolean
  initialData?: Partial<StopFormData>
  submitLabel?: string
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

export function StopForm({
  onSubmit,
  onCancel,
  isPending = false,
  initialData,
  submitLabel = "Add Stop",
}: StopFormProps) {
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [formData, setFormData] = useState<StopFormData>({
    name: initialData?.name || "",
    address: initialData?.address || "",
    latitude: initialData?.latitude || "",
    longitude: initialData?.longitude || "",
    notes: initialData?.notes || "",
  })

  const handleGeocode = async () => {
    if (!formData.address) return
    setIsGeocoding(true)
    try {
      const coords = await geocodeAddress(formData.address)
      if (coords) {
        setFormData({
          ...formData,
          latitude: coords.lat.toString(),
          longitude: coords.lng.toString(),
        })
      }
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.address && (!formData.latitude || !formData.longitude)) {
      setIsGeocoding(true)
      try {
        const coords = await geocodeAddress(formData.address)
        if (coords) {
          onSubmit({
            ...formData,
            latitude: coords.lat.toString(),
            longitude: coords.lng.toString(),
          })
        } else {
          onSubmit(formData)
        }
      } finally {
        setIsGeocoding(false)
      }
    } else {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="stop-name">Name</Label>
        <Input
          id="stop-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Stop name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stop-address">Address</Label>
        <div className="flex gap-2">
          <Input
            id="stop-address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Address"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleGeocode}
            disabled={isGeocoding || !formData.address}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stop-latitude">Latitude</Label>
          <Input
            id="stop-latitude"
            type="number"
            step="any"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
            placeholder="39.8283"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stop-longitude">Longitude</Label>
          <Input
            id="stop-longitude"
            type="number"
            step="any"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
            placeholder="-98.5795"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stop-notes">Notes</Label>
        <Input
          id="stop-notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Notes about this stop"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending || isGeocoding}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
