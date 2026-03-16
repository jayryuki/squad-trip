import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { AddItemModal } from "./AddItemModal"
import api from "@/lib/api"
import { toast } from "sonner"
import type { PersonalMoodboard } from "./types"

interface PersonalMoodboardProps {
  tripId: string
}

export function PersonalMoodboard({ tripId }: PersonalMoodboardProps) {
  const queryClient = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)

  const { data: moodboard, isLoading } = useQuery<PersonalMoodboard>({
    queryKey: ["moodboard", "personal", tripId],
    queryFn: () => api.get(`/trips/${tripId}/moodboard/personal`).then((r) => r.data),
  })

  const deleteItem = useMutation({
    mutationFn: (itemId: string) => api.delete(`/trips/${tripId}/moodboard/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moodboard", "personal", tripId] })
      toast.success("Item deleted")
    },
    onError: () => toast.error("Failed to delete item"),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    )
  }

  const items = moodboard?.items || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Moodboard</h2>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 size-4" />
          Add Item
        </Button>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-surface-raised">
                  <img
                    src={item.image_url}
                    alt={item.name || item.caption || "Moodboard item"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {item.type === "outfit" && item.name && (
                      <p className="text-sm font-medium truncate">{item.name}</p>
                    )}
                    {item.caption && (
                      <p className="text-xs text-foreground-muted truncate">{item.caption}</p>
                    )}
                    <span className="text-xs text-foreground-muted capitalize">
                      {item.type}
                    </span>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteItem.mutate(item.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-12 text-foreground-muted">
          <p>No items yet. Add your first outfit or image!</p>
        </div>
      )}

      <AddItemModal
        tripId={tripId}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["moodboard", "personal", tripId] })}
      />
    </div>
  )
}
