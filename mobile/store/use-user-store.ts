import { create } from 'zustand'

export type SubscriptionTier = 'free' | 'premium' | 'pro' | 'ultra'

export interface User {
  id: string
  email: string
  name?: string
  subscription_tier: SubscriptionTier
  is_admin: boolean
  created_at: string
}

interface UserStore {
  user: User | null
  isAdmin: boolean
  setUser: (user: User | null) => void
  clearUser: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isAdmin: false,

  setUser: (user) =>
    set({ user, isAdmin: user?.is_admin ?? false }),

  clearUser: () => set({ user: null, isAdmin: false }),
}))
