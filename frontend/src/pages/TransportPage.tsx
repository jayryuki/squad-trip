import { useState, useMemo } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core"
import { Loader2, Plus, Car as CarIcon, User, Users, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageWrapper from "@/components/layout/PageWrapper"
import { EditCarDialog } from "@/components/common/EditCarDialog"
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

function CarGraphic({ color, className }: { color: string; className?: string }) {
  const colorHex = CAR_COLORS.find(c => c.name === color)?.hex || CAR_COLORS[0].hex
  const isLight = color === "white" || color === "yellow" || color === "silver"
  
  return (
    <svg viewBox="0 0 200 80" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="carBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colorHex} />
          <stop offset="100%" stopColor={colorHex} stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="window" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1f2937" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
      </defs>
      
      <path
        d="M20 55 L30 30 L60 25 L100 20 L140 25 L170 30 L185 50 L180 60 L20 60 Z"
        fill="url(#carBody)"
        stroke={isLight ? "#d1d5db" : "#374151"}
        strokeWidth="1"
      />
      
      <path
        d="M55 32 L65 28 L95 26 L95 38 L60 40 Z"
        fill="url(#window)"
      />
      <path
        d="M105 26 L115 28 L140 32 L140 40 L105 38 Z"
        fill="url(#window)"
      />
      
      <circle cx="45" cy="60" r="12" fill="#1f2937" stroke={isLight ? "#d1d5db" : "#4b5563"} strokeWidth="2" />
      <circle cx="45" cy="60" r="6" fill={isLight ? "#d1d5db" : "#6b7280"} />
      
      <circle cx="155" cy="60" r="12" fill="#1f2937" stroke={isLight ? "#d1d5db" : "#4b5563"} strokeWidth="2" />
      <circle cx="155" cy="60" r="6" fill={isLight ? "#d1d5db" : "#6b7280"} />
      
      <ellipse cx="25" cy="52" rx="8" ry="4" fill={colorHex} stroke={isLight ? "#d1d5db" : "#374151"} strokeWidth="1" />
      <ellipse cx="180" cy="52" rx="8" ry="4" fill={colorHex} stroke={isLight ? "#d1d5db" : "#374151"} strokeWidth="1" />
    </svg>
  )
}

function WaitingArea({
  members,
  cars,
}: {
  members: TripMember[]
  cars: Car[]
}) {
  const assignedUserIds = useMemo(() => {
    const ids = new Set<number>()
    cars.forEach(car => {
      ids.add(car.driver_user_id)
      car.passenger_ids.forEach(id => ids.add(id))
    })
    return ids
  }, [cars])

  const waitingMembers = members.filter(m => !assignedUserIds.has(m.id))

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="size-5" />
          Waiting Area
          <span className="text-sm font-normal text-foreground-muted">
            ({waitingMembers.length} {waitingMembers.length === 1 ? "person" : "people"} not assigned)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {waitingMembers.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {waitingMembers.map(member => (
              <DraggableMember
                key={member.id}
                member={member}
                source="waiting"
              />
            ))}
          </div>
        ) : (
          <p className="text-foreground-muted text-sm">All trip members are assigned to a car!</p>
        )}
      </CardContent>
    </Card>
  )
}

function DraggableMember({
  member,
  source,
  carId,
}: {
  member: TripMember
  source: "waiting" | "car"
  carId?: number
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `member-${member.id}`,
    data: { member, source, carId },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border cursor-grab transition-all",
        isDragging && "opacity-50"
      )}
    >
      <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-sm">
        {member.emoji || member.display_name[0].toUpperCase()}
      </div>
      <span className="text-sm font-medium">{member.display_name}</span>
    </div>
  )
}

function DraggablePassenger({
  passenger,
  carId,
}: {
  passenger: UserSummary
  carId: number
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `passenger-${passenger.id}-car-${carId}`,
    data: { passenger, source: "car", carId },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-lg bg-surface-raised border border-border cursor-grab text-sm",
        isDragging && "opacity-50"
      )}
      title={passenger.display_name}
    >
      <div className="w-6 h-6 rounded-full bg-surface-raised flex items-center justify-center text-xs">
        {passenger.emoji || passenger.display_name[0].toUpperCase()}
      </div>
      <span className="truncate max-w-[80px]">{passenger.display_name}</span>
    </div>
  )
}

export default function TransportPage() {
  const { tripId } = useParams()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCar, setEditingCar] = useState<Car | null>(null)
  const [newCar, setNewCar] = useState({
    color: "blue",
    make: "",
    model: "",
    total_seats: 4,
  })
  const [isCustomMake, setIsCustomMake] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const { data: cars, isLoading } = useQuery<Car[]>({
    queryKey: ["cars", tripId],
    queryFn: () => api.get(`/trips/${tripId}/cars`).then((r) => r.data),
  })

  const { data: tripMembers } = useQuery<TripMember[]>({
    queryKey: ["tripMembers", tripId],
    queryFn: () => api.get(`/trips/${tripId}/members`).then((r) => r.data),
  })

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => api.get("/users/me").then((r) => r.data),
  })

  const selectedMake = CAR_MAKES.find(m => m.make === newCar.make)
  const availableModels = selectedMake?.models || []

  const createCar = useMutation({
    mutationFn: () =>
      api.post(`/trips/${tripId}/cars`, {
        color: newCar.color,
        make: isCustomMake ? newCar.make : (newCar.make === "Other" ? "Other" : newCar.make),
        model: newCar.model || null,
        total_seats: newCar.total_seats,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars", tripId] })
      setShowAddForm(false)
      setNewCar({ color: "blue", make: "", model: "", total_seats: 4 })
      setIsCustomMake(false)
      toast.success("Car added!")
    },
    onError: () => toast.error("Failed to add car"),
  })

  const removePassenger = useMutation({
    mutationFn: ({ carId, userId }: { carId: number; userId: number }) =>
      api.delete(`/trips/${tripId}/cars/${carId}/passengers/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars", tripId] })
      toast.success("Passenger removed")
    },
    onError: () => toast.error("Failed to remove passenger"),
  })

  const addPassenger = useMutation({
    mutationFn: ({ carId, userId }: { carId: number; userId: number }) =>
      api.post(`/trips/${tripId}/cars/${carId}/passengers`, { user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars", tripId] })
      toast.success("Passenger added!")
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to add passenger"
      toast.error(msg)
    },
  })

  const joinCar = useMutation({
    mutationFn: (carId: number) => api.post(`/trips/${tripId}/cars/${carId}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars", tripId] })
      toast.success("Joined car!")
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to join car"
      toast.error(msg)
    },
  })

  const leaveCar = useMutation({
    mutationFn: (carId: number) => api.post(`/trips/${tripId}/cars/${carId}/leave`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars", tripId] })
      toast.success("Left car")
    },
    onError: () => toast.error("Failed to leave car"),
  })

  const handleMakeChange = (make: string) => {
    setNewCar({ ...newCar, make, model: "" })
    setIsCustomMake(make === "Other")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCar.make) {
      toast.error("Please select a make")
      return
    }
    createCar.mutate()
  }

  const isUserInCar = (car: Car) => {
    if (!currentUser) return false
    return car.driver_user_id === currentUser.id || car.passenger_ids.includes(currentUser.id)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeData = active.data.current as { member?: TripMember; passenger?: UserSummary; source: string; carId?: number }
    const overId = over.id as string

    if (overId.startsWith("car-")) {
      const targetCarId = parseInt(overId.replace("car-", ""))
      
      if (activeData.source === "waiting" && activeData.member) {
        addPassenger.mutate({ carId: targetCarId, userId: activeData.member.id })
      } else if (activeData.source === "car" && activeData.passenger && activeData.carId !== targetCarId) {
        removePassenger.mutate({ carId: activeData.carId!, userId: activeData.passenger.id })
        addPassenger.mutate({ carId: targetCarId, userId: activeData.passenger.id })
      }
    } else if (overId === "waiting-area") {
      if (activeData.source === "car" && activeData.passenger && activeData.carId) {
        removePassenger.mutate({ carId: activeData.carId, userId: activeData.passenger.id })
      }
    }
  }

  const activeMember = useMemo(() => {
    if (!activeId) return null
    if (activeId.startsWith("member-")) {
      const memberId = parseInt(activeId.replace("member-", ""))
      return tripMembers?.find(m => m.id === memberId)
    }
    if (activeId.startsWith("passenger-")) {
      const match = activeId.match(/passenger-(\d+)-car-(\d+)/)
      if (match) {
        const passengerId = parseInt(match[1])
        const carId = parseInt(match[2])
        const car = cars?.find(c => c.id === carId)
        return car?.passengers.find(p => p.id === passengerId)
      }
    }
    return null
  }, [activeId, tripMembers, cars])

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-display font-bold gradient-text">Transport</h1>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="mr-2 size-4" />
              Add Car
            </Button>
          </div>

          {tripMembers && (
            <WaitingArea
              members={tripMembers}
              cars={cars || []}
            />
          )}

          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add Your Car</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {CAR_COLORS.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setNewCar({ ...newCar, color: c.name })}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            newCar.color === c.name ? "border-brand scale-110" : "border-transparent"
                          )}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="make">Make</Label>
                    <select
                      id="make"
                      value={newCar.make}
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
                      <Label htmlFor="customMake">Custom Make</Label>
                      <Input
                        id="customMake"
                        value={newCar.make === "Other" ? "" : newCar.make}
                        onChange={(e) => setNewCar({ ...newCar, make: e.target.value })}
                        placeholder="Enter make"
                      />
                    </div>
                  )}

                  {newCar.make && !isCustomMake && newCar.make !== "Other" && availableModels.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <select
                        id="model"
                        value={newCar.model}
                        onChange={(e) => setNewCar({ ...newCar, model: e.target.value })}
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
                      <Label htmlFor="customModel">Model</Label>
                      <Input
                        id="customModel"
                        value={newCar.model}
                        onChange={(e) => setNewCar({ ...newCar, model: e.target.value })}
                        placeholder="Enter model"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="seats">Total Seats</Label>
                    <Input
                      id="seats"
                      type="number"
                      min={2}
                      max={15}
                      value={newCar.total_seats}
                      onChange={(e) => setNewCar({ ...newCar, total_seats: parseInt(e.target.value) || 4 })}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={createCar.isPending}>
                      {createCar.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                      Add Car
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {cars && cars.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {cars.map((car) => {
                const filledSeats = car.passengers.length + 1
                const emptySeats = car.total_seats - filledSeats
                const userInCar = isUserInCar(car)
                const isDriver = currentUser?.id === car.driver_user_id

                return (
                  <Card key={car.id} className="overflow-hidden">
                    <div 
                      className="h-24 flex items-end justify-center pb-2"
                      style={{ 
                        background: `linear-gradient(180deg, hsl(var(--surface-overlay)) 0%, hsl(var(--surface)) 100%)` 
                      }}
                    >
                      <CarGraphic color={car.color} className="w-48 h-16" />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-lg">
                            {car.make} {car.model}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-foreground-muted">
                            <User className="size-3" />
                            <span>Driver: {car.driver?.display_name || "Unknown"}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {isDriver && (
                            <Button variant="ghost" size="sm" onClick={() => setEditingCar(car)}>
                              <Pencil className="size-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {car.driver && (
                              <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-xs border-2 border-surface">
                                {car.driver.emoji || car.driver.display_name[0].toUpperCase()}
                              </div>
                            )}
                            {car.passengers.map((p) => (
                              <div 
                                key={p.id}
                                className="w-7 h-7 rounded-full bg-surface-raised flex items-center justify-center text-xs border-2 border-surface"
                                title={p.display_name}
                              >
                                {p.emoji || p.display_name[0].toUpperCase()}
                              </div>
                            ))}
                          </div>
                          <span className="text-sm text-foreground-muted">
                            {filledSeats}/{car.total_seats} seats filled
                          </span>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs text-foreground-muted">Driver seat</p>
                          <div className="flex items-center gap-1">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 bg-brand border-brand text-white"
                              title={`Driver: ${car.driver?.display_name}`}
                            >
                              <CarIcon className="size-4" />
                            </div>
                          </div>
                        </div>

                        {car.passengers.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-foreground-muted">Passengers (drag to move)</p>
                            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-lg border-2 border-dashed border-border">
                              {car.passengers.map((passenger) => (
                                <DraggablePassenger
                                  key={passenger.id}
                                  passenger={passenger}
                                  carId={car.id}
                                />
                              ))}
                              {car.passengers.length === 0 && emptySeats > 0 && (
                                <span className="text-sm text-foreground-muted">Drop passengers here</span>
                              )}
                            </div>
                          </div>
                        )}

                        {emptySeats > 0 && (
                          <DroppableArea carId={car.id} emptySeats={emptySeats} />
                        )}

                        {!userInCar && emptySeats > 0 && (
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => joinCar.mutate(car.id)}
                            disabled={joinCar.isPending}
                          >
                            <Users className="mr-2 size-4" />
                            Join as Passenger
                          </Button>
                        )}
                        {userInCar && !isDriver && (
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => leaveCar.mutate(car.id)}
                            disabled={leaveCar.isPending}
                          >
                            Leave Car
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-foreground-muted">
              <CarIcon className="mx-auto size-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">No cars yet</p>
              <p className="text-sm mt-1">Add your car to organize transport for the trip!</p>
            </div>
          )}
        </div>

        <DragOverlay>
          {activeMember && "display_name" in activeMember && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border shadow-lg">
              <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-sm">
                {activeMember.emoji || activeMember.display_name[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium">{activeMember.display_name}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {editingCar && tripMembers && (
        <EditCarDialog
          car={editingCar}
          tripId={tripId!}
          tripMembers={tripMembers}
          open={!!editingCar}
          onOpenChange={(open) => !open && setEditingCar(null)}
        />
      )}
    </PageWrapper>
  )
}

function DroppableArea({ carId, emptySeats }: { carId: number; emptySeats: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `car-${carId}`,
    data: { carId },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "space-y-2 min-h-[60px] p-2 rounded-lg border-2 border-dashed transition-all",
        isOver ? "border-brand bg-brand/10" : "border-border"
      )}
    >
      <p className="text-xs text-foreground-muted">
        Drop here ({emptySeats} {emptySeats === 1 ? "seat" : "seats"} available)
      </p>
    </div>
  )
}
