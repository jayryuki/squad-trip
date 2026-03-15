import { cn } from "@/lib/utils"

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-surface-raised rounded", className)} />
}

export function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
      <SkeletonLine className="h-4 w-3/4" />
      <SkeletonLine className="h-3 w-1/2" />
      <SkeletonLine className="h-3 w-5/6" />
    </div>
  )
}

export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = { sm: "size-7", md: "size-9", lg: "size-12" }[size]
  return <div className={cn("animate-pulse bg-surface-raised rounded-full", s)} />
}
