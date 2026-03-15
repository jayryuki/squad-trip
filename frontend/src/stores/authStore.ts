import { create } from "zustand"
import { persist } from "zustand/middleware"

interface User {
  id: number
  username: string
  display_name: string
  avatar_url: string | null
}

interface AuthState {
  user: User | null
  accessToken: string | null
  setUser: (user: User) => void
  setAccessToken: (token: string) => void
  logout: () => void
}

export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: "squad-trip-auth",
      partialize: (state) => ({ user: state.user }),
    }
  )
)
