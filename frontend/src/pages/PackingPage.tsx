import { useState, useMemo } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2, Check, Package, Search, X, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageWrapper from "@/components/layout/PageWrapper"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"
import { toast } from "sonner"
import { authStore } from "@/stores/authStore"

interface PackingItem {
  id: number
  name: string
  category: string | null
  quantity: number
  is_packed: boolean
  assigned_user_id: number | null
  is_shared: boolean
  visibility: string
  visible_to: number[]
  creator_id: number | null
  created_at: string
}

interface TripMember {
  id: number
  username: string
  display_name: string
  avatar_url: string | null
  emoji: string | null
  role: string
}

const CATEGORIES = ["clothing", "toiletries", "electronics", "documents", "miscellaneous"]

export default function PackingPage() {
  const { tripId } = useParams()
  const queryClient = useQueryClient()
  const user = authStore((s) => s.user)
  const [activeTab, setActiveTab] = useState<"general" | "personal">("general")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<PackingItem | null>(null)
  const [newItem, setNewItem] = useState({
    name: "",
    category: "miscellaneous",
    quantity: 1,
    is_shared: true,
    visibility: "private" as "public" | "shared" | "private",
    visible_to: [] as number[],
  })

  const { data: items, isLoading } = useQuery<PackingItem[]>({
    queryKey: ["packing", tripId],
    queryFn: () => api.get(`/trips/${tripId}/packing`).then((r) => r.data),
  })

  const { data: members } = useQuery<TripMember[]>({
    queryKey: ["tripMembers", tripId],
    queryFn: () => api.get(`/trips/${tripId}/members`).then((r) => r.data),
  })

  const createItem = useMutation({
    mutationFn: () =>
      api.post(`/trips/${tripId}/packing`, {
        name: newItem.name,
        category: newItem.category,
        quantity: newItem.quantity,
        is_shared: newItem.is_shared,
        visibility: newItem.visibility,
        visible_to: newItem.visibility === "shared" ? newItem.visible_to : [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing", tripId] })
      setShowAddForm(false)
      setNewItem({
        name: "",
        category: "miscellaneous",
        quantity: 1,
        is_shared: true,
        visibility: "private",
        visible_to: [],
      })
      toast.success("Item added!")
    },
    onError: () => toast.error("Failed to add item"),
  })

  const updateItem = useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: Partial<PackingItem> }) =>
      api.put(`/trips/${tripId}/packing/${itemId}`, {
        ...data,
        visible_to: data.visibility === "shared" ? data.visible_to : [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing", tripId] })
      setEditingItem(null)
      toast.success("Item updated!")
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || "Failed to update item"
      toast.error(message)
    },
  })

  const deleteItem = useMutation({
    mutationFn: (itemId: number) => api.delete(`/trips/${tripId}/packing/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing", tripId] })
      toast.success("Item deleted")
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || "Failed to delete item"
      toast.error(message)
    },
  })

  const togglePacked = useMutation({
    mutationFn: ({ itemId, isPacked }: { itemId: number; isPacked: boolean }) =>
      api.put(`/trips/${tripId}/packing/${itemId}`, { is_packed: isPacked }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing", tripId] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || "Failed to update item"
      toast.error(message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createItem.mutate()
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    updateItem.mutate({
      itemId: editingItem.id,
      data: {
        name: editingItem.name,
        category: editingItem.category || undefined,
        quantity: editingItem.quantity,
        visibility: editingItem.visibility,
        visible_to: editingItem.visible_to,
      },
    })
  }

  const isOwner = (item: PackingItem) => item.creator_id === user?.id

  const filteredItems = useMemo(() => {
    if (!items) return []

    let filtered: PackingItem[]
    if (activeTab === "general") {
      filtered = items.filter((item) => item.visibility === "public")
    } else {
      filtered = items.filter(
        (item) => item.visibility !== "public" || isOwner(item)
      )
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(query))
    }

    return filtered
  }, [items, activeTab, searchQuery, user])

  const groupedItems = filteredItems?.reduce((acc, item) => {
    const category = item.category || "uncategorized"
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as Record<string, PackingItem[]>)

  const generalCount = items?.filter((i) => i.visibility === "public").length || 0
  const personalCount = items?.filter((i) => i.visibility !== "public" || isOwner(i)).length || 0
  const packedCount = filteredItems?.filter((i) => i.is_packed).length || 0
  const totalCount = filteredItems?.length || 0

  const getMemberById = (id: number) => members?.find((m) => m.id === id)

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
          <div>
            <h1 className="text-2xl font-display font-bold gradient-text">Packing List</h1>
            <p className="text-sm text-foreground-muted">
              {packedCount} / {totalCount} items packed
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="mr-2 size-4" />
            Add Item
          </Button>
        </div>

        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors ${
              activeTab === "general"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            General
            {generalCount > 0 && (
              <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">{generalCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors ${
              activeTab === "personal"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Personal
            {personalCount > 0 && (
              <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">{personalCount}</span>
            )}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add Packing Item</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name</Label>
                    <Input
                      id="name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="Item name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <select
                      id="visibility"
                      value={newItem.visibility}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          visibility: e.target.value as "public" | "shared" | "private",
                          visible_to: e.target.value === "shared" ? newItem.visible_to : [],
                        })
                      }
                      className="flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
                    >
                      <option value="private">Private (only me)</option>
                      <option value="shared">Shared with specific users</option>
                      <option value="public">Public (everyone)</option>
                    </select>
                  </div>
                </div>

                {newItem.visibility === "shared" && members && (
                  <div className="space-y-2">
                    <Label>Share with</Label>
                    <div className="flex flex-wrap gap-2">
                      {members
                        .filter((m) => m.id !== user?.id)
                        .map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => {
                              const current = newItem.visible_to
                              const newVisibleTo = current.includes(member.id)
                                ? current.filter((id) => id !== member.id)
                                : [...current, member.id]
                              setNewItem({ ...newItem, visible_to: newVisibleTo })
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                              newItem.visible_to.includes(member.id)
                                ? "bg-primary/10 border-primary text-primary"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <Avatar className="size-5">
                              <AvatarImage src={member.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {member.emoji || member.display_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {member.display_name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={createItem.isPending}>
                    {createItem.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Add Item
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {groupedItems && Object.keys(groupedItems).length > 0 ? (
          Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category} className="space-y-2">
              <h2 className="text-lg font-semibold capitalize">{category}</h2>
              <div className="space-y-2">
                {categoryItems?.map((item) => {
                  const itemOwner = getMemberById(item.creator_id || 0)
                  const isItemOwner = isOwner(item)

                  return (
                    <Card
                      key={item.id}
                      className={`p-4 ${item.is_packed ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => togglePacked.mutate({ itemId: item.id, isPacked: !item.is_packed })}
                            disabled={!isItemOwner && item.is_packed}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              item.is_packed
                                ? "bg-green-500 border-green-500"
                                : "border-border hover:border-primary"
                            } ${!isItemOwner && item.is_packed ? "cursor-not-allowed opacity-50" : ""}`}
                          >
                            {item.is_packed && <Check className="size-4 text-white" />}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className={item.is_packed ? "line-through" : ""}>{item.name}</p>
                              {itemOwner && (
                                <Badge variant="secondary" className="text-[10px] gap-1">
                                  {itemOwner.emoji && <span>{itemOwner.emoji}</span>}
                                  {itemOwner.display_name}
                                </Badge>
                              )}
                              {item.visibility === "shared" && (
                                <Badge variant="outline" className="text-[10px]">
                                  Shared
                                </Badge>
                              )}
                              {item.visibility === "private" && isItemOwner && (
                                <Badge variant="outline" className="text-[10px]">
                                  Private
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-foreground-muted">
                              Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {isItemOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingItem(item)}
                            >
                              <Edit2 className="size-4" />
                            </Button>
                          )}
                          {isItemOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteItem.mutate(item.id)}
                            >
                              <Trash2 className="size-4 text-danger" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-foreground-muted">
            <Package className="mx-auto size-12 mb-4 opacity-50" />
            <p>No packing items yet. Add items to pack for your trip!</p>
          </div>
        )}
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Packing Item</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Item Name</Label>
                  <Input
                    id="edit-name"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <select
                    id="edit-category"
                    value={editingItem.category || "miscellaneous"}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Quantity</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    min="1"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-visibility">Visibility</Label>
                  <select
                    id="edit-visibility"
                    value={editingItem.visibility}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        visibility: e.target.value,
                        visible_to: e.target.value === "shared" ? editingItem.visible_to : [],
                      })
                    }
                    className="flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
                  >
                    <option value="private">Private (only me)</option>
                    <option value="shared">Shared with specific users</option>
                    <option value="public">Public (everyone)</option>
                  </select>
                </div>

                {editingItem.visibility === "shared" && members && (
                  <div className="space-y-2">
                    <Label>Share with</Label>
                    <div className="flex flex-wrap gap-2">
                      {members
                        .filter((m) => m.id !== user?.id)
                        .map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => {
                              const current = editingItem.visible_to
                              const newVisibleTo = current.includes(member.id)
                                ? current.filter((id) => id !== member.id)
                                : [...current, member.id]
                              setEditingItem({ ...editingItem, visible_to: newVisibleTo })
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                              editingItem.visible_to.includes(member.id)
                                ? "bg-primary/10 border-primary text-primary"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <Avatar className="size-5">
                              <AvatarImage src={member.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {member.emoji || member.display_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {member.display_name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={updateItem.isPending}>
                    {updateItem.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </PageWrapper>
  )
}
