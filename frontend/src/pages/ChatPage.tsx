import { useState, useRef, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Send, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import PageWrapper from "@/components/layout/PageWrapper"
import api from "@/lib/api"
import { authStore } from "@/stores/authStore"
import { toast } from "sonner"

interface Message {
  id: number
  user_id: number
  content: string
  is_announcement: boolean
  created_at: string
}

interface Member {
  id: number
  display_name: string
  avatar_url: string | null
}

export default function ChatPage() {
  const { tripId } = useParams()
  const queryClient = useQueryClient()
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentUser = authStore((s) => s.user)

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["messages", tripId],
    queryFn: () => api.get(`/trips/${tripId}/messages`).then((r) => r.data),
  })

  const { data: members } = useQuery<Member[]>({
    queryKey: ["tripMembers", tripId],
    queryFn: () => api.get(`/trips/${tripId}/members`).then((r) => r.data),
  })

  const sendMessage = useMutation({
    mutationFn: () =>
      api.post(`/trips/${tripId}/messages`, {
        content: newMessage,
        is_announcement: false,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", tripId] })
      setNewMessage("")
    },
    onError: () => toast.error("Failed to send message"),
  })

  const getMember = (userId: number) => {
    return members?.find((m) => m.id === userId)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      sendMessage.mutate()
    }
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
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <h1 className="text-2xl font-display font-bold gradient-text mb-4">Chat</h1>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages && messages.length > 0 ? (
            messages.map((message) => {
              const member = getMember(message.user_id)
              const isCurrentUser = currentUser?.id === message.user_id

              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.is_announcement
                        ? "bg-yellow-100 text-yellow-800 w-full text-center"
                        : isCurrentUser
                        ? "bg-brand text-white"
                        : "bg-surface-raised"
                    }`}
                  >
                    {!isCurrentUser && !message.is_announcement && (
                      <p className="text-xs font-semibold mb-1 opacity-70">
                        {member?.display_name || "Unknown"}
                      </p>
                    )}
                    <p>{message.content}</p>
                    <p className={`text-xs mt-1 ${isCurrentUser ? "opacity-70" : "opacity-50"}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-foreground-muted">
              <MessageSquare className="mx-auto size-12 mb-4 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" disabled={sendMessage.isPending || !newMessage.trim()}>
            {sendMessage.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </form>
      </div>
    </PageWrapper>
  )
}
