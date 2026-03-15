import { useState, useRef } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2, Image } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageWrapper from "@/components/layout/PageWrapper"
import api from "@/lib/api"
import { toast } from "sonner"

interface MoodboardItem {
  id: number
  image_url: string
  caption: string | null
  created_by_user_id: number
}

export default function MoodboardPage() {
  const { tripId } = useParams()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({ caption: "" })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: items, isLoading } = useQuery<MoodboardItem[]>({
    queryKey: ["moodboard", tripId],
    queryFn: () => api.get(`/trips/${tripId}/moodboard`).then((r) => r.data),
  })

  const createItem = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      if (selectedFile) formData.append("file", selectedFile)
      if (newItem.caption) formData.append("caption", newItem.caption)
      return api.post(`/trips/${tripId}/moodboard`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moodboard", tripId] })
      setShowAddForm(false)
      setNewItem({ caption: "" })
      setSelectedFile(null)
      setPreviewUrl(null)
      toast.success("Image added!")
    },
    onError: () => toast.error("Failed to add image"),
  })

  const deleteItem = useMutation({
    mutationFn: (itemId: number) => api.delete(`/trips/${tripId}/moodboard/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moodboard", tripId] })
      toast.success("Image deleted")
    },
    onError: () => toast.error("Failed to delete image"),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      toast.error("Please select an image")
      return
    }
    createItem.mutate()
  }

  const resetForm = () => {
    setShowAddForm(false)
    setNewItem({ caption: "" })
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-brand" />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold gradient-text">Moodboard</h1>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="mr-2 size-4" />
            Add Image
          </Button>
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add to Moodboard</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Choose Image</Label>
                  <input
                    type="file"
                    id="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-muted-foreground
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary/10 file:text-primary
                      hover:file:bg-primary/20"
                  />
                  {previewUrl && (
                    <div className="mt-2 relative w-32 h-32">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caption">Caption (optional)</Label>
                  <Input
                    id="caption"
                    value={newItem.caption}
                    onChange={(e) => setNewItem({ ...newItem, caption: e.target.value })}
                    placeholder="Caption"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createItem.isPending || !selectedFile}>
                    {createItem.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Add Image
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {items && items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <div key={item.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-surface-raised">
                  <img
                    src={item.image_url}
                    alt={item.caption || "Moodboard image"}
                    className="w-full h-full object-cover"
                  />
                </div>
                {item.caption && (
                  <p className="mt-1 text-sm text-foreground-muted truncate">{item.caption}</p>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteItem.mutate(item.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-foreground-muted">
            <Image className="mx-auto size-12 mb-4 opacity-50" />
            <p>No images yet. Add inspiration for your trip!</p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
