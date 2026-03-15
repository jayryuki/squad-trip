import { useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2, Vote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageWrapper from "@/components/layout/PageWrapper"
import { CreatorTag } from "@/components/common/CreatorTag"
import api from "@/lib/api"
import { toast } from "sonner"

interface Poll {
  id: number
  question: string
  options: string[]
  votes: Record<string, number>
  created_by_user_id: number
  is_active: boolean
}

export default function PollsPage() {
  const { tripId } = useParams()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPoll, setNewPoll] = useState({ question: "", options: ["", ""] })

  const { data: polls, isLoading } = useQuery<Poll[]>({
    queryKey: ["polls", tripId],
    queryFn: () => api.get(`/trips/${tripId}/polls`).then((r) => r.data),
  })

  const createPoll = useMutation({
    mutationFn: () =>
      api.post(`/trips/${tripId}/polls`, {
        question: newPoll.question,
        options: newPoll.options.filter((o) => o.trim()),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls", tripId] })
      setShowAddForm(false)
      setNewPoll({ question: "", options: ["", ""] })
      toast.success("Poll created!")
    },
    onError: () => toast.error("Failed to create poll"),
  })

  const votePoll = useMutation({
    mutationFn: ({ pollId, optionIndex }: { pollId: number; optionIndex: number }) =>
      api.post(`/trips/${tripId}/polls/${pollId}/vote`, { option_index: optionIndex }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls", tripId] })
    },
    onError: () => toast.error("Failed to vote"),
  })

  const deletePoll = useMutation({
    mutationFn: (pollId: number) => api.delete(`/trips/${tripId}/polls/${pollId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls", tripId] })
      toast.success("Poll deleted")
    },
    onError: () => toast.error("Failed to delete poll"),
  })

  const closePoll = useMutation({
    mutationFn: (pollId: number) => api.put(`/trips/${tripId}/polls/${pollId}/close`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls", tripId] })
      toast.success("Poll closed")
    },
    onError: () => toast.error("Failed to close poll"),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createPoll.mutate()
  }

  const addOption = () => {
    setNewPoll({ ...newPoll, options: [...newPoll.options, ""] })
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...newPoll.options]
    newOptions[index] = value
    setNewPoll({ ...newPoll, options: newOptions })
  }

  const getTotalVotes = (votes: Record<string, number>) => {
    return Object.values(votes).reduce((sum, v) => sum + v, 0)
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
          <h1 className="text-2xl font-display font-bold gradient-text">Polls</h1>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="mr-2 size-4" />
            Create Poll
          </Button>
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create Poll</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Input
                    id="question"
                    value={newPoll.question}
                    onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                    placeholder="What would you like to ask?"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Options</Label>
                  {newPoll.options.map((option, index) => (
                    <Input
                      key={index}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    Add Option
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createPoll.isPending}>
                    {createPoll.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Create Poll
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {polls && polls.length > 0 ? (
          <div className="space-y-4">
            {polls.map((poll) => {
              const totalVotes = getTotalVotes(poll.votes)

              return (
                <Card key={poll.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{poll.question}</h3>
                        <CreatorTag creatorId={poll.created_by_user_id} />
                      </div>
                      <p className="text-sm text-foreground-muted">{totalVotes} votes</p>
                    </div>
                    <div className="flex gap-2">
                      {poll.is_active ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => closePoll.mutate(poll.id)}
                        >
                          Close
                        </Button>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-gray-100 rounded">Closed</span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePoll.mutate(poll.id)}
                      >
                        <Trash2 className="size-4 text-danger" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {poll.options.map((option, index) => {
                      const votes = poll.votes[String(index)] || 0
                      const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0

                      return (
                        <button
                          key={index}
                          disabled={!poll.is_active}
                          onClick={() => votePoll.mutate({ pollId: poll.id, optionIndex: index })}
                          className="w-full text-left p-3 rounded-lg border border-border hover:bg-surface-raised disabled:opacity-60 transition-colors"
                        >
                          <div className="flex justify-between mb-1">
                            <span>{option}</span>
                            <span className="text-foreground-muted">
                              {votes} ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-foreground-muted">
            <Vote className="mx-auto size-12 mb-4 opacity-50" />
            <p>No polls yet. Create one to get everyone's opinion!</p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
