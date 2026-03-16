import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2, Grid, Layers, Users } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import type { SharedMoodboard, UserMoodboard } from "./types"
import { UserPile, UserPileModal } from "./UserPile"

interface SharedMoodboardProps {
  tripId: string
}

export function SharedMoodboard({ tripId }: SharedMoodboardProps) {
  const [viewMode, setViewMode] = useState<"grid" | "piles">("grid")
  const [selectedUser, setSelectedUser] = useState<UserMoodboard | null>(null)

  const { data: moodboard, isLoading } = useQuery<SharedMoodboard>({
    queryKey: ["moodboard", "shared", tripId],
    queryFn: () => api.get(`/trips/${tripId}/moodboard/shared`).then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }

  const users = moodboard?.users || []
  const threshold = moodboard?.threshold || 20

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Group Moodboard</h2>
          <p className="text-sm text-foreground-muted">
            {moodboard?.total_items || 0} items from {users.length} people
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface-raised rounded-lg p-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="size-4 mr-1" />
            Grid
          </Button>
          <Button
            variant={viewMode === "piles" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("piles")}
          >
            <Layers className="size-4 mr-1" />
            Piles
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {users.length > 0 ? (
              users.map((user) => (
                <div key={user.user_id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.user_display_name}</span>
                    <span className="text-xs text-foreground-muted">
                      ({user.item_count} items)
                    </span>
                  </div>
                  {user.items.length > 0 ? (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {user.items.map((item) => (
                        <div
                          key={item.id}
                          className="aspect-square rounded-lg overflow-hidden bg-surface-raised"
                        >
                          <img
                            src={item.image_url}
                            alt={item.name || item.caption || ""}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-foreground-muted">No items yet</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-foreground-muted">
                <Users className="mx-auto size-12 mb-2 opacity-50" />
                <p>No moodboard items yet. Be the first to add one!</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="piles"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {users.length > 0 ? (
              <div className="flex flex-wrap gap-6 justify-center">
                {users.map((user) => (
                  <UserPile
                    key={user.user_id}
                    user={user}
                    threshold={threshold}
                    onOpenUser={setSelectedUser}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-foreground-muted">
                <Users className="mx-auto size-12 mb-2 opacity-50" />
                <p>No moodboard items yet. Be the first to add one!</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <UserPileModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  )
}
