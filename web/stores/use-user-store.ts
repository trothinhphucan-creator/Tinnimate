'use client'
import { create } from 'zustand'
import { User } from '@/types'

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
