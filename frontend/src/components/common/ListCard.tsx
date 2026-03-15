import { ReactNode } from "react"

interface ListCardProps {
  title: string
  subtitle?: string
  imageUrl?: string | null
  children?: ReactNode
  actions?: ReactNode
  creatorId?: number | null
  onClick?: () => void
}

export default function ListCard({ title, subtitle, imageUrl, children, actions, onClick }: ListCardProps) {
  return (
    <div 
      className={`border border-border bg-surface rounded-lg ${onClick ? 'cursor-pointer hover:border-border-strong hover:bg-surface-raised transition-all' : ''}`}
      onClick={onClick}
    >
      {imageUrl && (
        <div className="h-32 overflow-hidden rounded-t-lg">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{title}</h3>
            {subtitle && <p className="text-sm text-foreground-muted truncate">{subtitle}</p>}
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  )
}
