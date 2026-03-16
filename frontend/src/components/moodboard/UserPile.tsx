import { useState } from "react"
import { motion } from "framer-motion"
import { Users, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { UserMoodboard } from "./types"

interface UserPileProps {
  user: UserMoodboard
  threshold: number
  onOpenUser: (user: UserMoodboard) => void
}

export function UserPile({ user, threshold, onOpenUser }: UserPileProps) {
  const [isHovered, setIsHovered] = useState(false)
  const showThumbnail = threshold > 0 && user.thumbnail_url

  return (
    <motion.div
      layout
      className="relative cursor-pointer"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onOpenUser(user)}
    >
      <motion.div
        animate={{
          rotate: isHovered ? -2 : 0,
          scale: isHovered ? 1.05 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative w-40 h-40"
      >
        {showThumbnail ? (
          <div className="w-full h-full rounded-xl overflow-hidden shadow-lg border-2 border-background">
            <img
              src={user.thumbnail_url || ""}
              alt={user.user_display_name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-full rounded-xl overflow-hidden shadow-lg border-2 border-background bg-surface-raised relative">
            {user.items.slice(0, 3).map((item, i) => (
              <motion.img
                key={item.id}
                src={item.image_url}
                alt=""
                className="absolute w-24 h-24 object-cover rounded-lg border-2 border-background"
                style={{
                  zIndex: 3 - i,
                  left: i * 8,
                  top: i * 8,
                  rotate: (i - 1) * 5,
                }}
                animate={{
                  x: isHovered ? (i - 1) * 10 : 0,
                  y: isHovered ? (i - 1) * -5 : 0,
                  rotate: isHovered ? (i - 1) * 8 : (i - 1) * 5,
                }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              />
            ))}
            {user.items.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <User className="size-8 text-foreground-muted opacity-50" />
              </div>
            )}
          </div>
        )}
      </motion.div>

      <div className="mt-2 flex items-center gap-2">
        <Avatar className="size-6">
          <AvatarImage src={user.user_avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {user.user_emoji || user.user_display_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium truncate max-w-[120px]">
          {user.user_display_name}
        </span>
        <span className="text-xs text-foreground-muted bg-surface-raised px-1.5 py-0.5 rounded-full">
          {user.item_count}
        </span>
      </div>
    </motion.div>
  )
}

interface UserPileModalProps {
  user: UserMoodboard | null
  isOpen: boolean
  onClose: () => void
}

export function UserPileModal({ user, isOpen, onClose }: UserPileModalProps) {
  if (!user) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isOpen ? "" : "pointer-events-none"
      }`}
    >
      {isOpen && (
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      )}
      <div
        className={`relative bg-background rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden transition-all duration-300 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="p-4 border-b flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.user_avatar_url || undefined} />
            <AvatarFallback>
              {user.user_emoji || user.user_display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{user.user_display_name}</h2>
            <p className="text-sm text-foreground-muted">{user.item_count} items</p>
          </div>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {user.items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {user.items.map((item) => (
                <div key={item.id} className="relative">
                  <div className="aspect-square rounded-lg overflow-hidden bg-surface-raised">
                    <img
                      src={item.image_url}
                      alt={item.name || item.caption || ""}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {(item.name || item.caption) && (
                    <p className="text-xs text-foreground-muted mt-1 truncate">
                      {item.name || item.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-foreground-muted">
              <Users className="mx-auto size-12 mb-2 opacity-50" />
              <p>No items yet</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
