import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-surface group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-foreground-muted",
          actionButton: "group-[.toast]:bg-brand group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-surface-raised group-[.toast]:text-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
