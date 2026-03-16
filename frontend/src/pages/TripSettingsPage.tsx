import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageWrapper from "@/components/layout/PageWrapper"
import api from "@/lib/api"
import { toast } from "sonner"

interface TripSettings {
  trip_id: number
  moodboard_thumbnail_threshold: number
}

export default function TripSettingsPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery<TripSettings>({
    queryKey: ["trip", tripId, "settings"],
    queryFn: () => api.get(`/trips/${tripId}/settings`).then((r) => r.data),
  })

  const [threshold, setThreshold] = useState(20)

  useEffect(() => {
    if (settings?.moodboard_thumbnail_threshold) {
      setThreshold(settings.moodboard_thumbnail_threshold)
    }
  }, [settings])

  const updateSettings = useMutation({
    mutationFn: async (newThreshold: number) => {
      return api.put(`/trips/${tripId}/settings`, {
        moodboard_thumbnail_threshold: newThreshold,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", tripId, "settings"] })
      toast.success("Settings saved!")
    },
    onError: () => toast.error("Failed to save settings"),
  })

  const handleSave = () => {
    updateSettings.mutate(threshold)
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
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-2xl font-display font-bold">Trip Settings</h1>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Moodboard</h2>
            <div className="space-y-2">
              <Label htmlFor="threshold">Thumbnail Threshold</Label>
              <p className="text-sm text-foreground-muted">
                When the number of users exceeds this threshold, moodboard piles will show compressed thumbnails instead of individual items.
              </p>
              <Input
                id="threshold"
                type="number"
                min={1}
                max={100}
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value) || 20)}
                className="w-32"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            <Save className="mr-2 size-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </PageWrapper>
  )
}
