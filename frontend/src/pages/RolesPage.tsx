import { useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2, User, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageWrapper from "@/components/layout/PageWrapper"
import api from "@/lib/api"
import { toast } from "sonner"

interface Role {
  id: number
  name: string
  description: string | null
  assigned_user_id: number | null
  is_filled: boolean
}

interface Member {
  id: number
  display_name: string
  avatar_url: string | null
}

export default function RolesPage() {
  const { tripId } = useParams()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newRole, setNewRole] = useState({ name: "", description: "" })

  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["roles", tripId],
    queryFn: () => api.get(`/trips/${tripId}/roles`).then((r) => r.data),
  })

  const { data: members } = useQuery<Member[]>({
    queryKey: ["tripMembers", tripId],
    queryFn: () => api.get(`/trips/${tripId}/members`).then((r) => r.data),
  })

  const createRole = useMutation({
    mutationFn: () =>
      api.post(`/trips/${tripId}/roles`, {
        name: newRole.name,
        description: newRole.description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", tripId] })
      setShowAddForm(false)
      setNewRole({ name: "", description: "" })
      toast.success("Role added!")
    },
    onError: () => toast.error("Failed to add role"),
  })

  const deleteRole = useMutation({
    mutationFn: (roleId: number) => api.delete(`/trips/${tripId}/roles/${roleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", tripId] })
      toast.success("Role deleted")
    },
    onError: () => toast.error("Failed to delete role"),
  })

  const assignRole = useMutation({
    mutationFn: ({ roleId, userId }: { roleId: number; userId: number | null }) =>
      api.put(`/trips/${tripId}/roles/${roleId}`, {
        assigned_user_id: userId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", tripId] })
      toast.success("Role assigned!")
    },
    onError: () => toast.error("Failed to assign role"),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createRole.mutate()
  }

  if (rolesLoading) {
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
          <h1 className="text-2xl font-display font-bold gradient-text">Roles</h1>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="mr-2 size-4" />
            Add Role
          </Button>
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add Role</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    placeholder="e.g., Driver, Cook, Navigator"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    placeholder="Description"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createRole.isPending}>
                    {createRole.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Add Role
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {roles && roles.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {roles.map((role) => (
              <Card key={role.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{role.name}</h3>
                      {role.is_filled && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                          Filled
                        </span>
                      )}
                      {!role.is_filled && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          Open
                        </span>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-sm text-foreground-muted">{role.description}</p>
                    )}
                    <div className="pt-2">
                      <Label className="text-xs text-foreground-muted">Assign to:</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {members?.map((member) => (
                          <Button
                            key={member.id}
                            variant={role.assigned_user_id === member.id ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                              assignRole.mutate({
                                roleId: role.id,
                                userId: role.assigned_user_id === member.id ? null : member.id,
                              })
                            }
                          >
                            {role.assigned_user_id === member.id && <Check className="mr-1 size-3" />}
                            {member.display_name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteRole.mutate(role.id)}>
                    <Trash2 className="size-4 text-danger" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-foreground-muted">
            <User className="mx-auto size-12 mb-4 opacity-50" />
            <p>No roles yet. Add roles like Driver, Cook, or Navigator!</p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
