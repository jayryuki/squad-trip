import { useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageWrapper from "@/components/layout/PageWrapper"
import { CreatorTag } from "@/components/common/CreatorTag"
import api from "@/lib/api"
import { toast } from "sonner"

interface Expense {
  id: number
  title: string
  amount: number
  currency: string
  paid_by_user_id: number
  creator_id: number | null
  split_type: string
  category: string | null
}

interface Member {
  id: number
  display_name: string
}

interface BudgetSummary {
  total: number
  currency: string
  by_user: Record<number, number>
  by_category: Record<string, number>
}

const CATEGORIES = ["food", "transport", "accommodation", "activities", "other"]

export default function BudgetPage() {
  const { tripId } = useParams()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    paid_by_user_id: "",
    category: "other",
  })

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ["expenses", tripId],
    queryFn: () => api.get(`/trips/${tripId}/expenses`).then((r) => r.data),
  })

  const { data: summary } = useQuery<BudgetSummary>({
    queryKey: ["expensesSummary", tripId],
    queryFn: () => api.get(`/trips/${tripId}/expenses/summary`).then((r) => r.data),
  })

  const { data: members } = useQuery<Member[]>({
    queryKey: ["tripMembers", tripId],
    queryFn: () => api.get(`/trips/${tripId}/members`).then((r) => r.data),
  })

  const createExpense = useMutation({
    mutationFn: () =>
      api.post(`/trips/${tripId}/expenses`, {
        title: newExpense.title,
        amount: parseFloat(newExpense.amount),
        paid_by_user_id: parseInt(newExpense.paid_by_user_id),
        category: newExpense.category,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", tripId] })
      queryClient.invalidateQueries({ queryKey: ["expensesSummary", tripId] })
      setShowAddForm(false)
      setNewExpense({ title: "", amount: "", paid_by_user_id: "", category: "other" })
      toast.success("Expense added!")
    },
    onError: () => toast.error("Failed to add expense"),
  })

  const deleteExpense = useMutation({
    mutationFn: (expenseId: number) => api.delete(`/trips/${tripId}/expenses/${expenseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", tripId] })
      queryClient.invalidateQueries({ queryKey: ["expensesSummary", tripId] })
      toast.success("Expense deleted")
    },
    onError: () => toast.error("Failed to delete expense"),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createExpense.mutate()
  }

  const getMemberName = (userId: number) => {
    return members?.find((m) => m.id === userId)?.display_name || "Unknown"
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
          <h1 className="text-2xl font-display font-bold gradient-text">Budget</h1>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="mr-2 size-4" />
            Add Expense
          </Button>
        </div>

        {summary && (
          <Card className="p-6 bg-gradient-to-br from-brand/10 to-brand-dim/10">
            <div className="text-center">
              <p className="text-sm text-foreground-muted">Total Expenses</p>
              <p className="text-4xl font-bold gradient-text">
                ${summary.total.toFixed(2)} {summary.currency}
              </p>
            </div>
            {summary.by_category && Object.keys(summary.by_category).length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {Object.entries(summary.by_category).map(([cat, amount]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="capitalize text-foreground-muted">{cat}</span>
                    <span>${amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Description</Label>
                    <Input
                      id="title"
                      value={newExpense.title}
                      onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                      placeholder="What was it for?"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paid_by">Paid By</Label>
                    <select
                      id="paid_by"
                      value={newExpense.paid_by_user_id}
                      onChange={(e) => setNewExpense({ ...newExpense, paid_by_user_id: e.target.value })}
                      className="flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select person</option>
                      {members?.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.display_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                      className="flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createExpense.isPending}>
                    {createExpense.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Add Expense
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {expenses && expenses.length > 0 ? (
          <div className="space-y-2">
            {expenses.map((expense) => (
              <Card key={expense.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{expense.title}</h3>
                      <CreatorTag creatorId={expense.creator_id} />
                    </div>
                    <p className="text-sm text-foreground-muted">
                      Paid by {getMemberName(expense.paid_by_user_id)} ·{" "}
                      <span className="capitalize">{expense.category || "other"}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">${expense.amount.toFixed(2)}</span>
                    <Button variant="ghost" size="sm" onClick={() => deleteExpense.mutate(expense.id)}>
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-foreground-muted">
            <DollarSign className="mx-auto size-12 mb-4 opacity-50" />
            <p>No expenses yet. Track your trip spending!</p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
