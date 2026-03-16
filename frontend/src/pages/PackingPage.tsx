import { useState, useMemo } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2, Check, Package, Search, X, Edit2, List, ArrowDownToLine, Copy, Download, Upload, FolderPlus, ChevronDown, ChevronRight } from "lucide-react"
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

const DEFAULT_CATEGORIES = ["clothing", "toiletries", "electronics", "documents", "miscellaneous"]

function normalizeCategory(category: string): string {
  const lower = category.toLowerCase().trim()
  const found = DEFAULT_CATEGORIES.find(c => c.toLowerCase() === lower)
  if (found) {
    return found.charAt(0).toUpperCase() + found.slice(1)
  }
  return category.trim().charAt(0).toUpperCase() + category.trim().slice(1).toLowerCase()
}

function getAllCategories(items: PackingItem[]): string[] {
  const categories = new Set(DEFAULT_CATEGORIES.map(c => c.charAt(0).toUpperCase() + c.slice(1)))
  items.forEach(item => {
    if (item.category) {
      categories.add(normalizeCategory(item.category))
    }
  })
  return Array.from(categories).sort()
}

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
  list_name: string | null
  created_at: string
  user_packed: boolean | null
}

interface TripMember {
  id: number
  username: string
  display_name: string
  avatar_url: string | null
  emoji: string | null
  role: string
}



export default function PackingPage() {
  const { tripId } = useParams()
  const queryClient = useQueryClient()
  const user = authStore((s) => s.user)
  const [activeTab, setActiveTab] = useState<"general" | "personal">("general")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<PackingItem | null>(null)
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkInput, setBulkInput] = useState("")
  const [activeList, setActiveList] = useState<string | null>(null)
  const [showExportImport, setShowExportImport] = useState(false)
  const [importData, setImportData] = useState("")
  const [newListName, setNewListName] = useState("")
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [bulkVisibility, setBulkVisibility] = useState<string>("private")
  const [bulkListName, setBulkListName] = useState<string>("")
  const [showCategoryEdit, setShowCategoryEdit] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string>("")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Miscellaneous",
    quantity: 1,
    is_shared: true,
    visibility: "private" as "public" | "shared" | "private",
    visible_to: [] as number[],
    list_name: null as string | null,
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
        category: newItem.category.toLowerCase(),
        quantity: newItem.quantity,
        is_shared: newItem.is_shared,
        visibility: newItem.visibility,
        visible_to: newItem.visibility === "shared" ? newItem.visible_to : [],
        list_name: newItem.list_name,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing", tripId] })
      setShowAddForm(false)
      setNewItem({
        name: "",
        category: "Miscellaneous",
        quantity: 1,
        is_shared: true,
        visibility: "private",
        visible_to: [],
        list_name: activeList === "My Items" ? null : activeList,
      })
      toast.success("Item added!")
    },
    onError: () => toast.error("Failed to add item"),
  })

  const bulkCreateItems = useMutation({
    mutationFn: async (items: Array<{ name: string; category: string; quantity: number }>) => {
      const results = []
      for (const item of items) {
        const result = await api.post(`/trips/${tripId}/packing`, {
          name: item.name,
          category: item.category.toLowerCase(),
          quantity: item.quantity,
          is_shared: newItem.is_shared,
          visibility: newItem.visibility,
          visible_to: newItem.visibility === "shared" ? newItem.visible_to : [],
          list_name: newItem.list_name,
        })
        results.push(result)
      }
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing", tripId] })
      setShowAddForm(false)
      setBulkInput("")
      setBulkMode(false)
      toast.success("Items added!")
    },
    onError: () => toast.error("Failed to add items"),
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
      api.post(`/trips/${tripId}/packing/${itemId}/toggle-packed`, { is_packed: isPacked }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing", tripId] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || "Failed to update item"
      toast.error(message)
    },
  })

  const copyItem = useMutation({
    mutationFn: ({ itemId, listName }: { itemId: number; listName?: string }) =>
      api.post(`/trips/${tripId}/packing/${itemId}/copy`, { list_name: listName || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing", tripId] })
      toast.success("Added to your list!")
    },
    onError: () => toast.error("Failed to add item to list"),
  })

  const createPersonalList = useMutation({
    mutationFn: (name: string) =>
      api.post(`/trips/${tripId}/packing/lists`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packingLists", tripId] })
      toast.success("List created!")
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || "Failed to create list"
      toast.error(message)
    },
  })

  const exportItems = useMutation({
    mutationFn: (listName?: string) =>
      api.post(`/trips/${tripId}/packing/export`, { list_name: listName || null }),
    onSuccess: (data) => {
      const jsonStr = JSON.stringify(data.data, null, 2)
      const blob = new Blob([jsonStr], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `packing-list-${tripId}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Export downloaded!")
    },
    onError: () => toast.error("Failed to export"),
  })

  const importItems = useMutation({
    mutationFn: ({ items, listName }: { items: Array<{ name: string; category?: string; quantity: number }>; listName?: string }) =>
      api.post(`/trips/${tripId}/packing/import`, { items, list_name: listName || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing", tripId] })
      toast.success("Items imported!")
    },
    onError: () => toast.error("Failed to import items"),
  })

  const bulkUpdateItems = useMutation({
    mutationFn: ({ itemIds, visibility, visibleTo, listName }: { itemIds: number[]; visibility?: string; visibleTo?: number[]; listName?: string }) =>
      api.post(`/trips/${tripId}/packing/bulk-update`, {
        item_ids: itemIds,
        visibility,
        visible_to: visibleTo,
        list_name: listName || null,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["packing", tripId] })
      setSelectedItems([])
      setShowBulkEdit(false)
      toast.success(`${data.data.updated_count} items updated!`)
    },
    onError: () => toast.error("Failed to update items"),
  })

  const renameCategory = useMutation({
    mutationFn: ({ oldCategory, newCategory }: { oldCategory: string; newCategory: string }) =>
      api.post(`/trips/${tripId}/packing/rename-category`, {
        old_category: oldCategory,
        new_category: newCategory,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["packing", tripId] })
      setShowCategoryEdit(false)
      setEditingCategory("")
      setNewCategoryName("")
      toast.success(`${data.data.renamed_count} items updated!`)
    },
    onError: () => toast.error("Failed to rename category"),
  })

  const { data: personalLists } = useQuery<Array<{ name: string; item_count: number }>>({
    queryKey: ["packingLists", tripId],
    queryFn: () => api.get(`/trips/${tripId}/packing/lists`).then((r) => r.data),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (bulkMode) {
      const lines = bulkInput.split(/[\n,]/).map(l => l.trim()).filter(l => l.length > 0)
      const items = lines.map(line => {
        const colonIndex = line.lastIndexOf(':')
        let name = line
        let category = newItem.category
        if (colonIndex > 0) {
          name = line.slice(0, colonIndex).trim()
          category = line.slice(colonIndex + 1).trim()
        }
        return { name, category: normalizeCategory(category), quantity: 1 }
      })
      bulkCreateItems.mutate(items)
    } else {
      createItem.mutate()
    }
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

    if (activeList && activeList !== "My Items") {
      filtered = filtered.filter((item) => item.list_name === activeList && isOwner(item))
    } else if (activeList === "My Items") {
      filtered = filtered.filter((item) => !item.list_name && isOwner(item))
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(query))
    }

    return filtered
  }, [items, activeTab, searchQuery, user, activeList])

  const groupedItems = filteredItems?.reduce((acc, item) => {
    const category = normalizeCategory(item.category || "uncategorized")
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as Record<string, PackingItem[]>)

  const allCategories = useMemo(() => getAllCategories(items || []), [items])

  const generalCount = items?.filter((i) => i.visibility === "public").length || 0
  const personalCount = items?.filter((i) => i.visibility !== "public" || isOwner(i)).length || 0
  const packedCount = filteredItems?.filter((i) => i.user_packed).length || 0
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCategoryEdit(true)}>
              <Edit2 className="size-4 mr-1" />
              Edit Categories
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowExportImport(!showExportImport)}>
              <Download className="size-4 mr-1" />
              Export/Import
            </Button>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="mr-2 size-4" />
              Add Item
            </Button>
          </div>
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
          {activeTab === "personal" && personalLists && personalLists.length > 0 && (
            <div className="flex items-center gap-2 ml-auto border-l pl-4">
              <select
                value={activeList || ""}
                onChange={(e) => setActiveList(e.target.value || null)}
                className="text-sm bg-transparent border-none focus:outline-none"
              >
                <option value="">All My Items</option>
                {personalLists.map((list) => (
                  <option key={list.name} value={list.name}>
                    {list.name} ({list.item_count})
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const name = prompt("Enter new list name:")
                  if (name) createPersonalList.mutate(name)
                }}
              >
                <FolderPlus className="size-4" />
              </Button>
            </div>
          )}
          {activeTab === "personal" && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setShowBulkEdit(true)}
              disabled={selectedItems.length === 0}
            >
              <Edit2 className="size-4 mr-1" />
              Edit Selected ({selectedItems.length})
            </Button>
          )}
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
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={!bulkMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBulkMode(false)}
                >
                  <List className="size-4 mr-1" />
                  Single
                </Button>
                <Button
                  type="button"
                  variant={bulkMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBulkMode(true)}
                >
                  <ArrowDownToLine className="size-4 mr-1" />
                  Bulk Add
                </Button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {bulkMode ? (
                  <div className="space-y-2">
                    <Label htmlFor="bulk-input">Items (one per line or comma separated)</Label>
                    <textarea
                      id="bulk-input"
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      placeholder="T-shirt&#10;Pants:Clothing&#10;Toothbrush,Shampoo:Toiletries"
                      className="flex min-h-[120px] w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tip: Use "ItemName:Category" to set category inline (e.g., "Socks:Clothing")
                    </p>
                  </div>
                ) : (
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
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
                    >
                      {allCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
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
                  <Button type="submit" disabled={createItem.isPending || bulkCreateItems.isPending || (bulkMode && !bulkInput.trim())}>
                    {(createItem.isPending || bulkCreateItems.isPending) && <Loader2 className="mr-2 size-4 animate-spin" />}
                    {bulkMode ? "Add All Items" : "Add Item"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowAddForm(false); setBulkMode(false); setBulkInput(""); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {groupedItems && Object.keys(groupedItems).length > 0 ? (
          Object.entries(groupedItems).map(([category, categoryItems]) => {
            const isCollapsed = collapsedCategories.has(category)
            const packedInCategory = categoryItems?.filter((i) => i.user_packed).length || 0
            const totalInCategory = categoryItems?.length || 0
            const ownedItems = categoryItems?.filter((i) => isOwner(i)) || []
            const allOwnedSelected = ownedItems.length > 0 && ownedItems.every((i) => selectedItems.includes(i.id))

            return (
              <Card key={category} className="overflow-hidden">
                <CardHeader 
                  className="py-2 px-3 cursor-pointer flex flex-row items-center justify-between bg-muted/30"
                  onClick={() => {
                    const newCollapsed = new Set(collapsedCategories)
                    if (newCollapsed.has(category)) {
                      newCollapsed.delete(category)
                    } else {
                      newCollapsed.add(category)
                    }
                    setCollapsedCategories(newCollapsed)
                  }}
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                    <span className="font-semibold capitalize">{category}</span>
                    <Badge variant="secondary" className="text-xs">{packedInCategory}/{totalInCategory}</Badge>
                  </div>
                  {activeTab === "personal" && ownedItems.length > 0 && !isCollapsed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (allOwnedSelected) {
                          setSelectedItems(selectedItems.filter((id) => !ownedItems.find((i) => i.id === id)))
                        } else {
                          const newSelected = [...selectedItems]
                          ownedItems.forEach((item) => {
                            if (!newSelected.includes(item.id)) {
                              newSelected.push(item.id)
                            }
                          })
                          setSelectedItems(newSelected)
                        }
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground mr-2"
                    >
                      {allOwnedSelected ? "Deselect all" : "Select all"}
                    </button>
                  )}
                </CardHeader>
                {!isCollapsed && (
                  <CardContent className="p-2 space-y-1">
                    {categoryItems?.map((item) => {
                      const itemOwner = getMemberById(item.creator_id || 0)
                      const isItemOwner = isOwner(item)

                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between px-2 py-1.5 rounded ${item.user_packed ? "opacity-60 bg-muted/30" : ""}`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {activeTab === "personal" && isItemOwner && (
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(item.id)}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  if (e.target.checked) {
                                    setSelectedItems([...selectedItems, item.id])
                                  } else {
                                    setSelectedItems(selectedItems.filter(id => id !== item.id))
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded border-border flex-shrink-0"
                              />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                togglePacked.mutate({ itemId: item.id, isPacked: !item.user_packed })
                              }}
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                                item.user_packed
                                  ? "bg-green-500 border-green-500"
                                  : "border-border hover:border-primary"
                              }`}
                            >
                              {item.user_packed && <Check className="size-2.5 text-white" />}
                            </button>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`text-sm truncate ${item.user_packed ? "line-through" : ""}`}>{item.name}</span>
                              {itemOwner && !isItemOwner && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0 flex-shrink-0">
                                  {itemOwner.emoji || itemOwner.display_name.charAt(0)}
                                </Badge>
                              )}
                              {item.visibility === "shared" && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 flex-shrink-0">Shared</Badge>
                              )}
                              {item.list_name && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 flex-shrink-0">{item.list_name}</Badge>
                              )}
                              <span className="text-xs text-muted-foreground flex-shrink-0">x{item.quantity}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            {!isItemOwner && item.visibility === "public" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyItem.mutate({ itemId: item.id })
                                }}
                              >
                                <Copy className="size-3" />
                              </Button>
                            )}
                            {isItemOwner && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingItem(item)
                                }}
                              >
                                <Edit2 className="size-3" />
                              </Button>
                            )}
                            {isItemOwner && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteItem.mutate(item.id)
                                }}
                              >
                                <Trash2 className="size-3 text-danger" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                )}
              </Card>
            )
          })
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
                    value={normalizeCategory(editingItem.category || "miscellaneous")}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
                  >
                    {allCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
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

      {showExportImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Export / Import Packing List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Export</Label>
                <p className="text-sm text-muted-foreground">Download your packing list as JSON</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => exportItems.mutate(undefined)}
                    disabled={exportItems.isPending}
                  >
                    <Download className="size-4 mr-2" />
                    Export All
                  </Button>
                  {personalLists && personalLists.length > 0 && (
                    <select
                      className="flex h-10 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
                      onChange={(e) => exportItems.mutate(e.target.value || undefined)}
                    >
                      <option value="">Export All</option>
                      {personalLists.map((list) => (
                        <option key={list.name} value={list.name}>
                          {list.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <Label>Import</Label>
                <p className="text-sm text-muted-foreground">Paste JSON to import items</p>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder='[{"name": "Item", "category": "Clothing", "quantity": 1}]'
                  className="flex min-h-[100px] w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm resize-none"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="List name (optional)"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => {
                      try {
                        const items = JSON.parse(importData)
                        if (Array.isArray(items)) {
                          importItems.mutate({ items, listName: newListName || undefined })
                          setImportData("")
                          setNewListName("")
                        } else {
                          toast.error("Invalid format: expected array")
                        }
                      } catch {
                        toast.error("Invalid JSON")
                      }
                    }}
                    disabled={!importData.trim() || importItems.isPending}
                  >
                    <Upload className="size-4 mr-2" />
                    Import
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowExportImport(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showBulkEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Bulk Edit {selectedItems.length} Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-visibility">Visibility</Label>
                <select
                  id="bulk-visibility"
                  value={bulkVisibility}
                  onChange={(e) => setBulkVisibility(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
                >
                  <option value="private">Private (only me)</option>
                  <option value="shared">Shared with specific users</option>
                  <option value="public">Public (everyone)</option>
                </select>
              </div>

              {bulkVisibility === "shared" && members && (
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

              <div className="space-y-2">
                <Label htmlFor="bulk-list">Move to list</Label>
                <select
                  id="bulk-list"
                  value={bulkListName}
                  onChange={(e) => setBulkListName(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
                >
                  <option value="">Keep current list</option>
                  <option value="__default__">My Items (default)</option>
                  {personalLists?.map((list) => (
                    <option key={list.name} value={list.name}>
                      {list.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    bulkUpdateItems.mutate({
                      itemIds: selectedItems,
                      visibility: bulkVisibility,
                      visibleTo: bulkVisibility === "shared" ? newItem.visible_to : undefined,
                      listName: bulkListName === "__default__" ? undefined : bulkListName || undefined,
                    })
                  }}
                  disabled={bulkUpdateItems.isPending}
                >
                  {bulkUpdateItems.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Update {selectedItems.length} Items
                </Button>
                <Button variant="outline" onClick={() => { setShowBulkEdit(false); setSelectedItems([]); }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showCategoryEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a category to rename all items in that category.
              </p>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Category to edit</Label>
                <select
                  id="edit-category"
                  value={editingCategory}
                  onChange={(e) => setEditingCategory(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
                >
                  <option value="">Select a category</option>
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat.toLowerCase()}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {editingCategory && (
                <div className="space-y-2">
                  <Label htmlFor="new-category">New category name</Label>
                  <Input
                    id="new-category"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter new name"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (editingCategory && newCategoryName.trim()) {
                      renameCategory.mutate({
                        oldCategory: editingCategory,
                        newCategory: newCategoryName.trim(),
                      })
                    }
                  }}
                  disabled={!editingCategory || !newCategoryName.trim() || renameCategory.isPending}
                >
                  {renameCategory.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Rename Category
                </Button>
                <Button variant="outline" onClick={() => { setShowCategoryEdit(false); setEditingCategory(""); setNewCategoryName(""); }}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageWrapper>
  )
}
