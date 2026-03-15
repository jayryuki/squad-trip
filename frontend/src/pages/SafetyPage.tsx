import { useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2, Shield, AlertTriangle, Info, Cross } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageWrapper from "@/components/layout/PageWrapper"
import api from "@/lib/api"
import { toast } from "sonner"

interface SafetyInfo {
  id: number
  title: string
  content: string
  category: string | null
  created_at: string
}

const CATEGORIES = [
  { value: "emergency", label: "Emergency", icon: AlertTriangle, color: "text-red-500" },
  { value: "medical", label: "Medical", icon: Cross, color: "text-blue-500" },
  { value: "general", label: "General", icon: Info, color: "text-green-500" },
]

export default function SafetyPage() {
  const { tripId } = useParams()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newInfo, setNewInfo] = useState({ title: "", content: "", category: "general" })

  const { data: safetyInfo, isLoading } = useQuery<SafetyInfo[]>({
    queryKey: ["safety", tripId],
    queryFn: () => api.get(`/trips/${tripId}/safety`).then((r) => r.data),
  })

  const createInfo = useMutation({
    mutationFn: () =>
      api.post(`/trips/${tripId}/safety`, {
        title: newInfo.title,
        content: newInfo.content,
        category: newInfo.category,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["safety", tripId] })
      setShowAddForm(false)
      setNewInfo({ title: "", content: "", category: "general" })
      toast.success("Safety info added!")
    },
    onError: () => toast.error("Failed to add safety info"),
  })

  const deleteInfo = useMutation({
    mutationFn: (infoId: number) => api.delete(`/trips/${tripId}/safety/${infoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["safety", tripId] })
      toast.success("Safety info deleted")
    },
    onError: () => toast.error("Failed to delete safety info"),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createInfo.mutate()
  }

  const getCategoryInfo = (category: string | null) => {
    return CATEGORIES.find((c) => c.value === category) || CATEGORIES[2]
  }

  const groupedInfo = safetyInfo?.reduce((acc, item) => {
    const category = item.category || "general"
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as Record<string, SafetyInfo[]>)

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
          <h1 className="text-2xl font-display font-bold gradient-text">Safety</h1>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="mr-2 size-4" />
            Add Info
          </Button>
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add Safety Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newInfo.title}
                      onChange={(e) => setNewInfo({ ...newInfo, title: e.target.value })}
                      placeholder="e.g., Emergency Contacts"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={newInfo.category}
                      onChange={(e) => setNewInfo({ ...newInfo, category: e.target.value })}
                      className="flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <textarea
                    id="content"
                    value={newInfo.content}
                    onChange={(e) => setNewInfo({ ...newInfo, content: e.target.value })}
                    placeholder="Important safety information..."
                    className="flex min-h-[100px] w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createInfo.isPending}>
                    {createInfo.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Add Info
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {groupedInfo && Object.keys(groupedInfo).length > 0 ? (
          Object.entries(groupedInfo).map(([category, items]) => {
            const categoryInfo = getCategoryInfo(category)
            const Icon = categoryInfo.icon

            return (
              <div key={category} className="space-y-2">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Icon className={`size-5 ${categoryInfo.color}`} />
                  {categoryInfo.label}
                </h2>
                {items.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-foreground-muted mt-1 whitespace-pre-wrap">
                          {item.content}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => deleteInfo.mutate(item.id)}>
                        <Trash2 className="size-4 text-danger" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )
          })
        ) : (
          <div className="text-center py-8 text-foreground-muted">
            <Shield className="mx-auto size-12 mb-4 opacity-50" />
            <p>No safety information yet. Add emergency contacts and important details!</p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
