import { useParams, useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { Loader2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import api from "@/lib/api"

export default function JoinTripPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  
  const joinTrip = useMutation({
    mutationFn: () => api.post(`/trips/join/${code}`),
    onSuccess: () => {
      toast.success("Joined trip!")
      navigate("/")
    },
    onError: () => toast.error("Invalid invite code"),
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
            <Users className="size-8 text-brand" />
          </div>
          <CardTitle className="text-xl">Join Trip</CardTitle>
          <CardDescription>
            You've been invited to join a trip!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => joinTrip.mutate()} 
            className="w-full"
            disabled={joinTrip.isPending}
          >
            {joinTrip.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Accept Invite
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
