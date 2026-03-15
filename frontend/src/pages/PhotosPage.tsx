import { useState, useRef } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageWrapper from "@/components/layout/PageWrapper"
import api from "@/lib/api"
import { toast } from "sonner"

interface Photo {
  id: number
  image_url: string
  caption: string | null
  uploaded_by_user_id: number
  created_at: string
}

export default function PhotosPage() {
  const { tripId } = useParams()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPhoto, setNewPhoto] = useState({ caption: "" })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  const { data: photos, isLoading } = useQuery<Photo[]>({
    queryKey: ["photos", tripId],
    queryFn: () => api.get(`/trips/${tripId}/photos`).then((r) => r.data),
  })

  const createPhoto = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      if (selectedFile) formData.append("file", selectedFile)
      if (newPhoto.caption) formData.append("caption", newPhoto.caption)
      return api.post(`/trips/${tripId}/photos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos", tripId] })
      setShowAddForm(false)
      setNewPhoto({ caption: "" })
      setSelectedFile(null)
      setPreviewUrl(null)
      toast.success("Photo added!")
    },
    onError: () => toast.error("Failed to add photo"),
  })

  const deletePhoto = useMutation({
    mutationFn: (photoId: number) => api.delete(`/trips/${tripId}/photos/${photoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos", tripId] })
      setSelectedPhoto(null)
      toast.success("Photo deleted")
    },
    onError: () => toast.error("Failed to delete photo"),
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
      toast.error("Please select a photo")
      return
    }
    createPhoto.mutate()
  }

  const resetForm = () => {
    setShowAddForm(false)
    setNewPhoto({ caption: "" })
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
          <h1 className="text-2xl font-display font-bold gradient-text">Photos</h1>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="mr-2 size-4" />
            Add Photo
          </Button>
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Choose Photo</Label>
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
                    value={newPhoto.caption}
                    onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })}
                    placeholder="Caption"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createPhoto.isPending || !selectedFile}>
                    {createPhoto.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Add Photo
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {photos && photos.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square relative group cursor-pointer overflow-hidden rounded-lg"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.image_url}
                    alt={photo.caption || "Trip photo"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deletePhoto.mutate(photo.id)
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {selectedPhoto && (
              <div
                className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedPhoto(null)}
              >
                <div className="max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
                  <img
                    src={selectedPhoto.image_url}
                    alt={selectedPhoto.caption || "Full size"}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                  />
                  {selectedPhoto.caption && (
                    <p className="text-white text-center mt-4">{selectedPhoto.caption}</p>
                  )}
                  <Button
                    variant="destructive"
                    className="absolute top-4 right-4"
                    onClick={() => deletePhoto.mutate(selectedPhoto.id)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-foreground-muted">
            <Camera className="mx-auto size-12 mb-4 opacity-50" />
            <p>No photos yet. Add memories from your trip!</p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
