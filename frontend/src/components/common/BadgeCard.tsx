import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { 
  Map, MapPin, Calendar, Package, DollarSign, 
  BarChart, Crown, Star, Award 
} from "lucide-react"

interface BadgeCardProps {
  name: string
  description?: string
  icon?: string
  earnedAt?: string | null
  className?: string
}

const iconMap: Record<string, React.ElementType> = {
  map: Map,
  "map-pin": MapPin,
  calendar: Calendar,
  package: Package,
  "dollar-sign": DollarSign,
  "bar-chart": BarChart,
  crown: Crown,
  star: Star,
  award: Award,
}

export function BadgeCard({ name, description, icon, earnedAt, className }: BadgeCardProps) {
  const IconComponent = icon ? iconMap[icon] : Award

  return (
    <Card className={cn("flex flex-row items-center gap-3 p-3", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
        <IconComponent className="h-5 w-5 text-brand" />
      </div>
      <CardContent className="flex-1 p-0">
        <p className="font-medium text-sm">{name}</p>
        {description && (
          <p className="text-xs text-foreground-muted">{description}</p>
        )}
        {earnedAt && (
          <p className="text-xs text-foreground-muted mt-1">Earned: {new Date(earnedAt).toLocaleDateString()}</p>
        )}
      </CardContent>
    </Card>
  )
}
