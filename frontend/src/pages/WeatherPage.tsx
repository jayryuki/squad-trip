import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Loader2, Cloud, Sun, CloudRain, CloudSnow } from "lucide-react"
import PageWrapper from "@/components/layout/PageWrapper"
import { Card } from "@/components/ui/card"
import api from "@/lib/api"

interface WeatherData {
  location: string
  current: {
    date: string
    temperature_high: number
    temperature_low: number
    condition: string
    icon: string
  }
  forecast: {
    date: string
    temperature_high: number
    temperature_low: number
    condition: string
    icon: string
  }[]
}

const getWeatherIcon = (icon: string) => {
  switch (icon) {
    case "sunny":
      return Sun
    case "rainy":
      return CloudRain
    case "snowy":
      return CloudSnow
    default:
      return Cloud
  }
}

export default function WeatherPage() {
  const { tripId } = useParams()

  const { data: weather, isLoading } = useQuery<WeatherData>({
    queryKey: ["weather", tripId],
    queryFn: () => api.get(`/trips/${tripId}/weather`).then((r) => r.data),
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
      <div className="space-y-4">
        <h1 className="text-2xl font-display font-bold gradient-text">Weather</h1>

        {weather && (
          <div className="space-y-4">
            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10">
              <div className="text-center">
                <p className="text-lg text-foreground-muted mb-2">{weather.location}</p>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Cloud className="size-16 text-blue-500" />
                  <div>
                    <p className="text-5xl font-bold">{weather.current.temperature_high}°</p>
                    <p className="text-foreground-muted">High {weather.current.temperature_high}° / Low {weather.current.temperature_low}°</p>
                  </div>
                </div>
                <p className="text-xl">{weather.current.condition}</p>
              </div>
            </Card>

            <div className="grid grid-cols-3 gap-4">
              {weather.forecast.map((day, index) => {
                const Icon = getWeatherIcon(day.icon)

                return (
                  <Card key={index} className="p-4 text-center">
                    <p className="text-sm text-foreground-muted mb-2">
                      {index === 0 ? "Today" : new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <Icon className="size-8 mx-auto mb-2 text-blue-500" />
                    <p className="font-semibold">{day.temperature_high}°</p>
                    <p className="text-sm text-foreground-muted">{day.temperature_low}°</p>
                  </Card>
                )
              })}
            </div>

            <p className="text-sm text-foreground-muted text-center">
              Weather data is placeholder. Integrate with a weather API for real data.
            </p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
