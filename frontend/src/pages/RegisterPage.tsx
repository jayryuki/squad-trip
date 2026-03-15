import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { authStore } from "@/stores/authStore"
import api from "@/lib/api"

const registerSchema = z.object({
  username: z.string().min(3),
  display_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isAdmin = searchParams.get("admin") === "true"
  const [loading, setLoading] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    try {
      const { data: authData } = await api.post("/auth/register", data)
      authStore.getState().setUser(authData.user)
      authStore.getState().setAccessToken(authData.access_token)
      toast.success("Account created!")
      navigate("/")
    } catch {
      toast.error("Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl gradient-text">
            {isAdmin ? "Create Admin Account" : "Join Squad Trip"}
          </CardTitle>
          <CardDescription>
            {isAdmin ? "Set up your account to get started" : "Create an account to start planning"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" {...register("username")} placeholder="johndoe" />
              {errors.username && <p className="text-sm text-danger">{String(errors.username.message)}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input id="display_name" {...register("display_name")} placeholder="John Doe" />
              {errors.display_name && <p className="text-sm text-danger">{String(errors.display_name.message)}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} placeholder="you@example.com" />
              {errors.email && <p className="text-sm text-danger">{String(errors.email.message)}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-sm text-danger">{String(errors.password.message)}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-foreground-muted">
            Already have an account? <Link to="/login" className="text-brand hover:underline">Sign in</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
