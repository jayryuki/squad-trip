import { useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BadgeCard } from "@/components/common/BadgeCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { authStore } from "@/stores/authStore"
import api from "@/lib/api"
import { MapPin, Calendar, Package, DollarSign, BarChart, Users, Pencil, Save, X } from "lucide-react"

interface UserProfile {
  id: number
  username: string
  display_name: string
  email: string
  avatar_url: string | null
  emoji: string | null
  created_at: string | null
  badges: Array<{
    id: number
    name: string
    description: string | null
    icon: string | null
    earned_at: string | null
  }>
  stats: {
    trips_count: number
    admin_count: number
    stops_count: number
    itinerary_count: number
    packing_count: number
    expenses_count: number
    polls_count: number
  }
}

interface ProfileResponse {
  id: number
  username: string
  display_name: string
  email: string
  avatar_url: string | null
  emoji: string | null
}

async function getUserProfile(userId: number): Promise<UserProfile> {
  const { data } = await api.get(`/users/${userId}/profile`)
  return data
}

async function getMyProfile(): Promise<ProfileResponse> {
  const { data } = await api.get("/users/me")
  return data
}

const EMOJI_OPTIONS = ["😀", "😎", "🤠", "🧑‍🎤", "🧑‍🚀", "🧑‍🔬", "🦸", "🧙", "🦊", "🐱", "🐶", "🦁", "🐼", "🐨", "🦋", "🌟", "🔥", "💎", "🎸", "🎯"]

export function UserProfile() {
  const { userId } = useParams<{ userId: string }>()
  const queryClient = useQueryClient()
  const currentUser = authStore((s) => s.user)
  const setUser = authStore((s) => s.setUser)
  const isOwnProfile = !userId || Number(userId) === currentUser?.id

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    username: "",
    display_name: "",
    email: "",
    emoji: "",
    current_password: "",
    new_password: "",
  })

  const profileUserId = userId || currentUser?.id

  const { data: profile, isLoading } = useQuery({
    queryKey: ["userProfile", profileUserId],
    queryFn: () => getUserProfile(Number(profileUserId)),
    enabled: !!profileUserId,
  })

  const { data: myProfile } = useQuery({
    queryKey: ["myProfile"],
    queryFn: getMyProfile,
    enabled: isOwnProfile,
  })

  const updateMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      const payload: Record<string, string> = {}
      if (data.username) payload.username = data.username
      if (data.display_name) payload.display_name = data.display_name
      if (data.email) payload.email = data.email
      if (data.emoji) payload.emoji = data.emoji
      if (data.current_password && data.new_password) {
        payload.current_password = data.current_password
        payload.new_password = data.new_password
      }
      const { data: res } = await api.patch("/users/me", payload)
      return res
    },
    onSuccess: (data) => {
      setUser({
        ...currentUser!,
        username: data.username,
        display_name: data.display_name,
        avatar_url: data.avatar_url,
        emoji: data.emoji,
      })
      queryClient.invalidateQueries({ queryKey: ["myProfile"] })
      queryClient.invalidateQueries({ queryKey: ["userProfile"] })
      toast.success("Profile updated!")
      setIsEditing(false)
      setEditForm({
        username: "",
        display_name: "",
        email: "",
        emoji: "",
        current_password: "",
        new_password: "",
      })
    },
    onError: () => {
      toast.error("Failed to update profile")
    },
  })

  const handleEdit = () => {
    if (myProfile) {
      setEditForm({
        username: myProfile.username,
        display_name: myProfile.display_name,
        email: myProfile.email,
        emoji: myProfile.emoji || "",
        current_password: "",
        new_password: "",
      })
    }
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditForm({
      username: "",
      display_name: "",
      email: "",
      emoji: "",
      current_password: "",
      new_password: "",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(editForm)
  }

  const displayProfile = isOwnProfile ? myProfile : profile

  if (isLoading || !displayProfile) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profile</CardTitle>
          {isOwnProfile && !isEditing && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center gap-4 mb-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={displayProfile.avatar_url ?? undefined} />
                  <AvatarFallback className="text-2xl">
                    {(editForm.display_name || displayProfile.display_name).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-2xl font-display font-bold">{displayProfile.display_name}</h2>
                  <p className="text-foreground-muted">@{displayProfile.username}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emoji">Emoji</Label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, emoji })}
                      className={`text-2xl p-2 rounded-lg border-2 transition-colors ${
                        editForm.emoji === emoji ? "border-brand bg-brand/10" : "border-transparent hover:bg-surface-raised"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={editForm.display_name}
                    onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Change Password</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input
                      id="current_password"
                      type="password"
                      value={editForm.current_password}
                      onChange={(e) => setEditForm({ ...editForm, current_password: e.target.value })}
                      placeholder="Required to change password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={editForm.new_password}
                      onChange={(e) => setEditForm({ ...editForm, new_password: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={displayProfile.avatar_url ?? undefined} />
                  <AvatarFallback className="text-2xl">
                    {displayProfile.emoji || displayProfile.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {displayProfile.emoji && (
                  <span className="absolute -bottom-1 -right-1 text-2xl bg-background rounded-full p-0.5">
                    {displayProfile.emoji}
                  </span>
                )}
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-2xl font-display font-bold">{displayProfile.display_name}</h2>
                  {displayProfile.emoji && <span className="text-2xl">{displayProfile.emoji}</span>}
                </div>
                <p className="text-foreground-muted">@{displayProfile.username}</p>
                <p className="text-sm text-foreground-muted mt-1">{displayProfile.email}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!isEditing && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Users} label="Trips" value={profile?.stats.trips_count ?? 0} />
            <StatCard icon={MapPin} label="Stops" value={profile?.stats.stops_count ?? 0} />
            <StatCard icon={Calendar} label="Itinerary" value={profile?.stats.itinerary_count ?? 0} />
            <StatCard icon={Package} label="Packing" value={profile?.stats.packing_count ?? 0} />
            <StatCard icon={DollarSign} label="Expenses" value={profile?.stats.expenses_count ?? 0} />
            <StatCard icon={BarChart} label="Polls" value={profile?.stats.polls_count ?? 0} />
          </div>

          {profile?.badges && profile.badges.length > 0 && (
            <div>
              <h3 className="font-display text-lg font-semibold mb-3">Badges</h3>
              <div className="space-y-2">
                {profile.badges.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    name={badge.name}
                    description={badge.description ?? undefined}
                    icon={badge.icon ?? undefined}
                    earnedAt={badge.earned_at}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-lg bg-surface-raised">
      <Icon className="h-5 w-5 text-brand mb-1" />
      <span className="text-xl font-bold">{value}</span>
      <span className="text-xs text-foreground-muted">{label}</span>
    </div>
  )
}
