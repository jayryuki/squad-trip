import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import api from "@/lib/api"
import { toast } from "sonner"

interface AddItemModalProps {
  tripId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddItemModal({ tripId, isOpen, onClose, onSuccess }: AddItemModalProps) {
  const [itemType, setItemType] = useState<"outfit" | "moodboard">("moodboard")
  const [name, setName] = useState("")
  const [caption, setCaption] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setName("")
    setCaption("")
    setFile(null)
    setPreviewUrl(null)
    setItemType("moodboard")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile))
    }
  }

  const handleSubmit = async () => {
    if (!file && itemType === "moodboard") {
      toast.error("Please select an image")
      return
    }
    if (!name.trim() && itemType === "outfit") {
      toast.error("Please enter a name for the outfit")
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("type", itemType)
      if (name) formData.append("name", name)
      if (caption) formData.append("caption", caption)
      if (file) formData.append("file", file)

      await api.post(`/trips/${tripId}/moodboard/items`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      toast.success("Item added to your moodboard!")
      handleClose()
      onSuccess()
    } catch {
      toast.error("Failed to add item")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-background rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3"
              onClick={handleClose}
            >
              <X className="size-4" />
            </Button>

            <h2 className="text-xl font-semibold mb-4">Add to Moodboard</h2>

            <Tabs value={itemType} onValueChange={(v: string) => setItemType(v as "outfit" | "moodboard")}>
              <TabsList className="w-full mb-4">
                <TabsTrigger value="moodboard" className="flex-1">
                  Image
                </TabsTrigger>
                <TabsTrigger value="outfit" className="flex-1">
                  Outfit
                </TabsTrigger>
              </TabsList>

              <TabsContent value="moodboard" className="space-y-4">
                <div className="space-y-2">
                  <Label>Choose Image</Label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  {previewUrl && (
                    <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Caption (optional)</Label>
                  <Input
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="outfit" className="space-y-4">
                <div className="space-y-2">
                  <Label>Outfit Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Beach Day, Night Out"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Outfit Image (optional)</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  {previewUrl && (
                    <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add notes..."
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Add Item
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
