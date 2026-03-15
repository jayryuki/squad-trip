import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Map, Calendar, Users, Luggage, DollarSign, Shirt, Images, MessageSquare, Vote, Cloud, FileText, Shield, Camera, Loader2, Share2, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import PageWrapper from "@/components/layout/PageWrapper"
import FeatureCard from "@/components/common/FeatureCard"
import api from "@/lib/api"

const features = [
  { icon: Map, label: "Map", path: "map", color: "text-green-500" },
  { icon: Calendar, label: "Itinerary", path: "itinerary", color: "text-blue-500" },
  { icon: Users, label: "Roles", path: "roles", color: "text-purple-500" },
  { icon: Luggage, label: "Packing", path: "packing", color: "text-orange-500" },
  { icon: DollarSign, label: "Budget", path: "budget", color: "text-green-400" },
  { icon: Shirt, label: "Outfits", path: "outfits", color: "text-pink-500" },
  { icon: Images, label: "Moodboard", path: "moodboard", color: "text-yellow-500" },
  { icon: MessageSquare, label: "Chat", path: "chat", color: "text-indigo-500" },
  { icon: Vote, label: "Polls", path: "polls", color: "text-cyan-500" },
  { icon: Cloud, label: "Weather", path: "weather", color: "text-sky-500" },
  { icon: FileText, label: "Documents", path: "documents", color: "text-gray-400" },
  { icon: Shield, label: "Safety", path: "safety", color: "text-red-500" },
  { icon: Camera, label: "Photos", path: "photos", color: "text-violet-500" },
]

export default function TripDashboardPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()

  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => api.get(`/trips/${tripId}`).then((r) => r.data),
  })

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
      <div className="space-y-6">
        <div className="relative h-48 rounded-xl overflow-hidden">
          {trip?.cover_image_url ? (
            <img src={trip.cover_image_url} alt={trip.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand to-brand-dim" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-3xl font-display font-bold text-white">{trip?.name}</h1>
            <p className="text-white/80">{trip?.start_date} {trip?.end_date && `- ${trip.end_date}`}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            <Share2 className="mr-2 size-4" />
            Share
          </Button>
          <Button variant="outline" className="flex-1">
            <Settings className="mr-2 size-4" />
            Settings
          </Button>
        </div>

        <div>
          <h2 className="text-lg font-display font-semibold mb-3">Trip Features</h2>
          <div className="grid grid-cols-3 gap-3">
            {features.map((feature) => (
              <FeatureCard 
                key={feature.path}
                icon={feature.icon}
                label={feature.label}
                color={feature.color}
                onClick={() => navigate(`/trips/${tripId}/${feature.path}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
