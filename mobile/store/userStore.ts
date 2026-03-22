import { create } from 'zustand'
import { Session, User } from '@supabase/supabase-js'

interface UserState {
  session: Session | null
  user: User | null
  setSession: (session: Session | null) => void
}

export const useUserStore = create<UserState>((set) => ({
  session: null,
  user: null,
  setSession: (session) => set({ session, user: session?.user || null }),
}))
