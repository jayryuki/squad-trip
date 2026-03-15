import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Database, Server, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import api from "@/lib/api"

const pgSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().default(5432),
  database: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
})

type PgForm = z.infer<typeof pgSchema>

export default function SetupPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<"choose" | "sqlite" | "postgres">("choose")
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle")

  const { register, handleSubmit, getValues } = useForm<PgForm>({
    resolver: zodResolver(pgSchema),
  })

  const chooseSQLite = async () => {
    try {
      await api.post("/setup/complete", { db: "sqlite" })
      navigate("/register?admin=true")
    } catch {
      toast.error("Setup failed")
    }
  }

  const testConnection = async () => {
    setTestStatus("testing")
    try {
      await api.post("/setup/test-connection", getValues())
      setTestStatus("ok")
    } catch {
      setTestStatus("fail")
      toast.error("Connection failed. Check your credentials.")
    }
  }

  const onSubmit = async (data: PgForm) => {
    try {
      await api.post("/setup/complete", { db: "postgres", ...data })
      navigate("/register?admin=true")
    } catch {
      toast.error("Setup failed")
    }
  }

  if (mode === "choose") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl gradient-text">Welcome to Squad Trip</CardTitle>
            <CardDescription>Choose your database to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setMode("sqlite")} 
              className="w-full h-16 text-lg"
            >
              <Database className="mr-3 size-5" />
              SQLite (Quick Start)
            </Button>
            <Button 
              onClick={() => setMode("postgres")} 
              variant="outline" 
              className="w-full h-16 text-lg"
            >
              <Server className="mr-3 size-5" />
              PostgreSQL (Production)
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (mode === "sqlite") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">SQLite Setup</CardTitle>
            <CardDescription>Starting with local database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <Loader2 className="size-8 animate-spin text-brand" />
            </div>
            <Button onClick={chooseSQLite} className="w-full">
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">PostgreSQL Setup</CardTitle>
          <CardDescription>Connect to your database</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="host">Host</Label>
              <Input id="host" {...register("host")} placeholder="localhost" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input id="port" type="number" {...register("port")} defaultValue={5432} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="database">Database</Label>
              <Input id="database" {...register("database")} placeholder="squadtrip" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" {...register("username")} placeholder="postgres" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={testConnection} className="flex-1">
                {testStatus === "testing" && <Loader2 className="mr-2 size-4 animate-spin" />}
                {testStatus === "ok" && <CheckCircle className="mr-2 size-4 text-success" />}
                Test Connection
              </Button>
              <Button type="submit" className="flex-1">Save & Continue</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
