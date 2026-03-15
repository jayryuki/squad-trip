import { Badge } from "@/components/ui/badge"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { User } from "@/stores/authStore"

interface CreatorTagProps {
  creatorId: number | null
  className?: string
}

async function getUser(userId: number): Promise<User> {
  const { data } = await api.get(`/users/${userId}/profile`)
  return data
}

export function CreatorTag({ creatorId, className }: CreatorTagProps) {
  const { data: creator } = useQuery({
    queryKey: ["user", creatorId],
    queryFn: () => getUser(creatorId!),
    enabled: !!creatorId,
  })

  if (!creatorId || !creator) return null

  return (
    <Badge variant="secondary" className={`text-[10px] gap-1 ${className}`}>
      <span>by</span>
      {creator.emoji && <span>{creator.emoji}</span>}
      <span className="font-medium">{creator.display_name}</span>
    </Badge>
  )
}
