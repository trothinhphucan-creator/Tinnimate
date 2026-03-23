import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

export type Lang = 'vi' | 'en'

interface LangStore {
  lang: Lang
  setLang: (lang: Lang) => void
}

export const useLangStore = create<LangStore>((set) => ({
  lang: 'vi',
  setLang: async (lang) => {
    set({ lang })
    if (Platform.OS !== 'web') {
      await AsyncStorage.setItem('lang', lang)
    }
  },
}))

// Load language preference from storage on app start (skip on web)
if (Platform.OS !== 'web') {
  AsyncStorage.getItem('lang').then((lang) => {
    if (lang === 'vi' || lang === 'en') {
      useLangStore.setState({ lang })
    }
  })
}
