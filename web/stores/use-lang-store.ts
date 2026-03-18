'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Lang = 'vi' | 'en'

interface LangStore {
  lang: Lang
  setLang: (lang: Lang) => void
  toggle: () => void
}

export const useLangStore = create<LangStore>()(
  persist(
    (set) => ({
      lang: 'vi',
      setLang: (lang) => set({ lang }),
      toggle: () => set((s) => ({ lang: s.lang === 'vi' ? 'en' : 'vi' })),
    }),
    { name: 'tinnimate-lang' }
  )
)
