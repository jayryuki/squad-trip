import { useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2, Check, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageWrapper from "@/components/layout/PageWrapper"
import { CreatorTag } from "@/components/common/CreatorTag"
import api from "@/lib/api"
import { toast } from "sonner"

interface PackingItem {
  id: number
  name: string
  category: string | null
  quantity: number
  is_packed: boolean
  assigned_user_id: number | null
  is_shared: boolean
  creator_id: number | null
}

const CATEGORIES = ["clothing", "toiletries", "electronics", "documents", "miscellaneous"]

export default function PackingPage() {
  const { tripId } = useParams()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({
    name: "",
    category: "miscellaneous",
    quantity: 1,
    is_shared: true,
  })

  const { data: items, isLoading } = useQuery<PackingItem[]>({
    queryKey: ["packing", tripId],
    queryFn: () => api.get(`/trips/${tripId}/packing`).then((r) => r.data),
  })

  const createItem = useMutation({
    mutationFn: () =>
      api.post(`/trips/${tripId}/packing`, {
        name: newItem.name,
        category: newItem.category,
        quantity: newItem.quantity,
        is_shared: newItem.is_shared,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing", tripId] })
      setShowAddForm(false)
      setNewItem({ name: "", category: "miscellaneous", quantity: 1, is_shared: true })
      toast.success("Item added!")
    },
    onError: () => toast.error("Failed to add item"),
  })

  const deleteItem = useMutation({
    mutationFn: (itemId: number) => api.delete(`/trips/${tripId}/packing/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing", tripId] })
      toast.success("Item deleted")
    },
    onError: () => toast.error("Failed to delete item"),
  })

  const togglePacked = useMutation({
    mutationFn: ({ itemId, isPacked }: { itemId: number; isPacked: boolean }) =>
      api.put(`/trips/${tripId}/packing/${itemId}`, { is_packed: isPacked }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing", tripId] })
    },
    onError: () => toast.error("Failed to update item"),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createItem.mutate()
  }

  const groupedItems = items?.reduce((acc, item) => {
    const category = item.category || "uncategorized"
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as Record<string, PackingItem[]>)

  const packedCount = items?.filter((i) => i.is_packed).length || 0
  const totalCount = items?.length || 0

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
                </div>
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
                {categoryItems?.map((item) => (
                  <Card
                    key={item.id}
                    className={`p-4 cursor-pointer ${item.is_packed ? "opacity-60" : ""}`}
                    onClick={() => togglePacked.mutate({ itemId: item.id, isPacked: !item.is_packed })}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            item.is_packed ? "bg-green-500 border-green-500" : "border-border"
                          }`}
                        >
                          {item.is_packed && <Check className="size-4 text-white" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={item.is_packed ? "line-through" : ""}>{item.name}</p>
                            <CreatorTag creatorId={item.creator_id} />
                          </div>
                          <p className="text-xs text-foreground-muted">
                            Qty: {item.quantity} · {item.is_shared ? "Shared" : "Personal"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteItem.mutate(item.id)
                        }}
                      >
                        <Trash2 className="size-4 text-danger" />
                      </Button>
                    </div>
                  </Card>
                ))}
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
    </PageWrapper>
  )
}
