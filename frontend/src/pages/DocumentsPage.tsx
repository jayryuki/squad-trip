import { useState, useRef } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2, FileText, File, Image } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageWrapper from "@/components/layout/PageWrapper"
import api from "@/lib/api"
import { toast } from "sonner"

interface Document {
  id: number
  name: string
  file_url: string
  file_type: string | null
  uploaded_by_user_id: number
  created_at: string
}

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return File
  if (fileType.startsWith("image")) return Image
  return FileText
}

export default function DocumentsPage() {
  const { tripId } = useParams()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDoc, setNewDoc] = useState({ name: "" })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["documents", tripId],
    queryFn: () => api.get(`/trips/${tripId}/documents`).then((r) => r.data),
  })

  const createDoc = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.append("name", newDoc.name)
      if (selectedFile) formData.append("file", selectedFile)
      return api.post(`/trips/${tripId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", tripId] })
      setShowAddForm(false)
      setNewDoc({ name: "" })
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      toast.success("Document added!")
    },
    onError: () => toast.error("Failed to add document"),
  })

  const deleteDoc = useMutation({
    mutationFn: (docId: number) => api.delete(`/trips/${tripId}/documents/${docId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", tripId] })
      toast.success("Document deleted")
    },
    onError: () => toast.error("Failed to delete document"),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!newDoc.name) {
        setNewDoc({ ...newDoc, name: file.name.replace(/\.[^/.]+$/, "") })
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDoc.name) {
      toast.error("Please enter a document name")
      return
    }
    if (!selectedFile) {
      toast.error("Please select a file")
      return
    }
    createDoc.mutate()
  }

  const resetForm = () => {
    setShowAddForm(false)
    setNewDoc({ name: "" })
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
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
          <h1 className="text-2xl font-display font-bold gradient-text">Documents</h1>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="mr-2 size-4" />
            Add Document
          </Button>
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add Document</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Document Name</Label>
                  <Input
                    id="name"
                    value={newDoc.name}
                    onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                    placeholder="e.g., Flight Tickets"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Choose File</Label>
                  <input
                    type="file"
                    id="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="block w-full text-sm text-muted-foreground
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary/10 file:text-primary
                      hover:file:bg-primary/20"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createDoc.isPending || !selectedFile}>
                    {createDoc.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Add Document
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {documents && documents.length > 0 ? (
          <div className="grid gap-3">
            {documents.map((doc) => {
              const Icon = getFileIcon(doc.file_type)

              return (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 hover:opacity-80"
                    >
                      <div className="p-2 bg-surface-raised rounded">
                        <Icon className="size-6 text-brand" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-foreground-muted">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </a>
                    <Button variant="ghost" size="sm" onClick={() => deleteDoc.mutate(doc.id)}>
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-foreground-muted">
            <FileText className="mx-auto size-12 mb-4 opacity-50" />
            <p>No documents yet. Upload tickets, reservations, and more!</p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
