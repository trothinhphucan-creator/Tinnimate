'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Handles Capacitor deep link OAuth callback.
 * When app is opened via tinnimate://auth/callback?code=xxx,
 * this hook captures the code and exchanges it for a Supabase session.
 */
export function useCapacitorAuth(onSuccess?: () => void) {
  const handleUrl = useCallback(async (url: string) => {
    try {
      const urlObj = new URL(url)
      const code = urlObj.searchParams.get('code')
      const error = urlObj.searchParams.get('error')

      if (error) {
        console.error('OAuth error from deep link:', error)
        return
      }

      if (!code) return

      const supabase = createClient()
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!exchangeError && data.session) {
        onSuccess?.()
        window.location.href = '/chat'
      }
    } catch (e) {
      console.error('Deep link handling error:', e)
    }
  }, [onSuccess])

  useEffect(() => {
    // Listen for Capacitor deep link (appUrlOpen)
    const setupCapacitorListener = async () => {
      try {
        const { App } = await import('@capacitor/app')
        const { remove } = await App.addListener('appUrlOpen', async ({ url }) => {
          if (url.includes('auth/callback') || url.startsWith('tinnimate://')) {
            await handleUrl(url)
          }
        })
        return remove
      } catch {
        // Not in Capacitor environment — skip
        return undefined
      }
    }

    let removeListener: (() => void) | undefined
    setupCapacitorListener().then(fn => { removeListener = fn })

    return () => {
      removeListener?.()
    }
  }, [handleUrl])
}
