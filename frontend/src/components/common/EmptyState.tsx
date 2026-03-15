import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
      <div className="bg-surface-raised rounded-xl p-6 w-20 h-20 flex items-center justify-center mb-6 border border-border">
        <Icon className="size-9 text-foreground-muted" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-lg font-semibold mb-2">{title}</h3>
      <p className="text-foreground-muted text-sm max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-6 bg-gradient-to-r from-brand to-brand-dim rounded-full"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
