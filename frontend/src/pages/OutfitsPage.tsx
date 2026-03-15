import { useState, useRef } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2, Shirt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageWrapper from "@/components/layout/PageWrapper"
import api from "@/lib/api"
import { toast } from "sonner"

interface Outfit {
  id: number
  name: string
  image_url: string | null
  created_by_user_id: number
}

export default function OutfitsPage() {
  const { tripId } = useParams()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newOutfit, setNewOutfit] = useState({ name: "" })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: outfits, isLoading } = useQuery<Outfit[]>({
    queryKey: ["outfits", tripId],
    queryFn: () => api.get(`/trips/${tripId}/outfits`).then((r) => r.data),
  })

  const createOutfit = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.append("name", newOutfit.name)
      if (selectedFile) formData.append("file", selectedFile)
      return api.post(`/trips/${tripId}/outfits`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outfits", tripId] })
      setShowAddForm(false)
      setNewOutfit({ name: "" })
      setSelectedFile(null)
      setPreviewUrl(null)
      toast.success("Outfit added!")
    },
    onError: () => toast.error("Failed to add outfit"),
  })

  const deleteOutfit = useMutation({
    mutationFn: (outfitId: number) => api.delete(`/trips/${tripId}/outfits/${outfitId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outfits", tripId] })
      toast.success("Outfit deleted")
    },
    onError: () => toast.error("Failed to delete outfit"),
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
    if (!newOutfit.name) {
      toast.error("Please enter an outfit name")
      return
    }
    createOutfit.mutate()
  }

  const resetForm = () => {
    setShowAddForm(false)
    setNewOutfit({ name: "" })
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
          <h1 className="text-2xl font-display font-bold gradient-text">Outfits</h1>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="mr-2 size-4" />
            Add Outfit
          </Button>
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add Outfit</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Outfit Name</Label>
                  <Input
                    id="name"
                    value={newOutfit.name}
                    onChange={(e) => setNewOutfit({ ...newOutfit, name: e.target.value })}
                    placeholder="e.g., Beach Day, Night Out"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Image (optional)</Label>
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
                <div className="flex gap-2">
                  <Button type="submit" disabled={createOutfit.isPending}>
                    {createOutfit.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Add Outfit
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {outfits && outfits.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {outfits.map((outfit) => (
              <Card key={outfit.id} className="overflow-hidden">
                <div className="aspect-square bg-surface-raised relative">
                  {outfit.image_url ? (
                    <img
                      src={outfit.image_url}
                      alt={outfit.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Shirt className="size-12 text-foreground-muted" />
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => deleteOutfit.mutate(outfit.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <CardContent className="p-3">
                  <p className="font-medium truncate">{outfit.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-foreground-muted">
            <Shirt className="mx-auto size-12 mb-4 opacity-50" />
            <p>No outfits yet. Plan what to wear!</p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
