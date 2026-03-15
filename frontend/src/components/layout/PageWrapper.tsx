import { cn } from "@/lib/utils"

interface Props { 
  children: React.ReactNode
  className?: string
  fullWidth?: boolean
}

export default function PageWrapper({ children, className, fullWidth = false }: Props) {
  return (
    <div className={cn("px-4 md:px-6 py-6 mx-auto w-full", !fullWidth && "max-w-5xl", className)}>
      {children}
    </div>
  )
}
