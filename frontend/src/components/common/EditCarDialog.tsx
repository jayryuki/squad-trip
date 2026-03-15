import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import api from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const CAR_MAKES = [
  { make: "Toyota", models: ["Camry", "Corolla", "RAV4", "Highlander", "4Runner", "Tacoma", "Prius", "Supra"] },
  { make: "Honda", models: ["Civic", "Accord", "CR-V", "Pilot", "Odyssey", "HR-V", "Passport"] },
  { make: "Ford", models: ["F-150", "Mustang", "Explorer", "Escape", "Bronco", "Ranger", "Edge"] },
  { make: "Chevrolet", models: ["Silverado", "Equinox", "Tahoe", "Camaro", "Corvette", "Traverse"] },
  { make: "Nissan", models: ["Altima", "Rogue", "Sentra", "Maxima", "Pathfinder", "Frontier", "Z"] },
  { make: "BMW", models: ["3 Series", "5 Series", "X3", "X5", "X1", "M3", "M5"] },
  { make: "Mercedes-Benz", models: ["C-Class", "E-Class", "GLC", "GLE", "A-Class", "S-Class"] },
  { make: "Audi", models: ["A4", "A6", "Q5", "Q7", "A3", "e-tron"] },
  { make: "Tesla", models: ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck"] },
  { make: "Hyundai", models: ["Elantra", "Sonata", "Tucson", "Santa Fe", "Palisade", "Kona"] },
  { make: "Kia", models: ["Forte", "K5", "Sportage", "Telluride", "Seltos", "EV6"] },
  { make: "Subaru", models: ["Outback", "Forester", "Crosstrek", "Impreza", "Legacy", "Ascent"] },
  { make: "Mazda", models: ["Mazda3", "Mazda6", "CX-5", "CX-9", "CX-50", "MX-5"] },
  { make: "Volkswagen", models: ["Jetta", "Passat", "Tiguan", "Atlas", "Golf", "ID.4"] },
  { make: "Jeep", models: ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Renegade", "Gladiator"] },
  { make: "Other", models: [] },
]

const CAR_COLORS = [
  { name: "red", hex: "#ef4444" },
  { name: "blue", hex: "#3b82f6" },
  { name: "black", hex: "#1f2937" },
  { name: "white", hex: "#f3f4f6" },
  { name: "silver", hex: "#9ca3af" },
  { name: "gray", hex: "#6b7280" },
  { name: "green", hex: "#22c55e" },
  { name: "yellow", hex: "#eab308" },
  { name: "orange", hex: "#f97316" },
  { name: "purple", hex: "#a855f7" },
  { name: "pink", hex: "#ec4899" },
  { name: "brown", hex: "#92400e" },
]

interface UserSummary {
  id: number
  display_name: string
  avatar_url: string | null
  emoji: string | null
}

interface TripMember {
  id: number
  display_name: string
  avatar_url: string | null
  emoji: string | null
  role: string
}

interface Car {
  id: number
  trip_id: number
  driver_user_id: number
  driver: UserSummary | null
  color: string
  make: string
  model: string | null
  total_seats: number
  passenger_ids: number[]
  passengers: UserSummary[]
}

interface EditCarDialogProps {
  car: Car
  tripId: string | number
  tripMembers: TripMember[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditCarDialog({ car, tripId, tripMembers, open, onOpenChange }: EditCarDialogProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    color: car.color,
    make: car.make,
    model: car.model || "",
    total_seats: car.total_seats,
    driver_user_id: car.driver_user_id,
  })
  const [isCustomMake, setIsCustomMake] = useState(car.make && !CAR_MAKES.some(m => m.make === car.make))
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)

  useEffect(() => {
    setFormData({
      color: car.color,
      make: car.make,
      model: car.model || "",
      total_seats: car.total_seats,
      driver_user_id: car.driver_user_id,
    })
    setIsCustomMake(car.make && !CAR_MAKES.some(m => m.make === car.make))
  }, [car])

  const selectedMake = CAR_MAKES.find(m => m.make === formData.make)
  const availableModels = selectedMake?.models || []

  const updateCar = useMutation({
    mutationFn: () =>
      api.put(`/trips/${tripId}/cars/${car.id}`, {
        color: formData.color,
        make: isCustomMake ? formData.make : (formData.make === "Other" ? "Other" : formData.make),
        model: formData.model || null,
        total_seats: formData.total_seats,
        driver_user_id: formData.driver_user_id !== car.driver_user_id ? formData.driver_user_id : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars", tripId] })
      onOpenChange(false)
      toast.success("Car updated!")
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to update car"
      toast.error(msg)
    },
  })

  const deleteCar = useMutation({
    mutationFn: () => api.delete(`/trips/${tripId}/cars/${car.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars", tripId] })
      onOpenChange(false)
      toast.success("Car deleted")
    },
    onError: () => toast.error("Failed to delete car"),
  })

  const handleMakeChange = (make: string) => {
    setFormData({ ...formData, make, model: "" })
    setIsCustomMake(make === "Other")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.make) {
      toast.error("Please select a make")
      return
    }
    updateCar.mutate()
  }

  const potentialDrivers = tripMembers.filter(
    (m) => m.id === car.driver_user_id || car.passenger_ids.includes(m.id)
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Car</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {CAR_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c.name })}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      formData.color === c.name ? "border-brand scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-make">Make</Label>
              <select
                id="edit-make"
                value={formData.make}
                onChange={(e) => handleMakeChange(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-foreground"
                required
              >
                <option value="">Select make...</option>
                {CAR_MAKES.map((m) => (
                  <option key={m.make} value={m.make}>
                    {m.make}
                  </option>
                ))}
              </select>
            </div>

            {isCustomMake && (
              <div className="space-y-2">
                <Label htmlFor="edit-customMake">Custom Make</Label>
                <Input
                  id="edit-customMake"
                  value={formData.make === "Other" ? "" : formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="Enter make"
                />
              </div>
            )}

            {formData.make && !isCustomMake && formData.make !== "Other" && availableModels.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="edit-model">Model</Label>
                <select
                  id="edit-model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-foreground"
                >
                  <option value="">Any</option>
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isCustomMake && (
              <div className="space-y-2">
                <Label htmlFor="edit-customModel">Model</Label>
                <Input
                  id="edit-customModel"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Enter model"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-seats">Total Seats</Label>
              <Input
                id="edit-seats"
                type="number"
                min={2}
                max={15}
                value={formData.total_seats}
                onChange={(e) => setFormData({ ...formData, total_seats: parseInt(e.target.value) || 4 })}
              />
              {formData.total_seats < car.passengers.length + 1 && (
                <p className="text-sm text-danger">
                  Must be at least {car.passengers.length + 1} (current passengers + driver)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-driver">Driver</Label>
              <select
                id="edit-driver"
                value={formData.driver_user_id}
                onChange={(e) => setFormData({ ...formData, driver_user_id: parseInt(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-foreground"
              >
                {potentialDrivers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.emoji || ""} {member.display_name} {member.id === car.driver_user_id ? "(current driver)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-sm text-foreground-muted">
                Select from current passengers to transfer driver role
              </p>
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteAlert(true)}
              >
                Delete Car
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCar.isPending}>
                  {updateCar.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Car?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the car and send all passengers ({car.passengers.length}) to the waiting area.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCar.mutate()}
              className="bg-danger text-white hover:bg-danger/90"
            >
              {deleteCar.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
