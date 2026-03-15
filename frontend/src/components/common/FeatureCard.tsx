import { LucideIcon } from "lucide-react"

interface FeatureCardProps {
  icon: LucideIcon
  label: string
  color?: string
  onClick?: () => void
}

export default function FeatureCard({ icon: Icon, label, color = "text-gray-500", onClick }: FeatureCardProps) {
  return (
    <div 
      className="cursor-pointer hover:border-border-strong hover:bg-surface-raised transition-all text-center py-4 border border-border bg-surface rounded-lg"
      onClick={onClick}
    >
      <Icon className={`size-6 mx-auto mb-2 ${color}`} />
      <span className="text-xs font-medium">{label}</span>
    </div>
  )
}
