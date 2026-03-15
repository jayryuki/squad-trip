import { create } from "zustand"

interface Trip {
  id: number
  name: string
  type: string
  start_date: string
  end_date: string | null
  currency: string
  cover_image_url: string | null
}

interface TripState {
  activeTrip: Trip | null
  setActiveTrip: (trip: Trip | null) => void
}

export const tripStore = create<TripState>()((set) => ({
  activeTrip: null,
  setActiveTrip: (trip) => set({ activeTrip: trip }),
}))
