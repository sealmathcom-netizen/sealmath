'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isBypassed, setIsBypassed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createSupabaseClient()

    // 1. Initial check
    async function initAuth() {
      // Check Supabase
      const { data: { user } } = await supabase.auth.getUser()
      
      // Check Checkly Bypass Cookies (Sync with middleware)
      const isBypassActive = document.cookie.includes('test-bypass-active=true') || 
                             document.cookie.includes('test-bypass-token=')
                             
      if (isBypassActive && !user) {
        // Provide a deterministic mock user for E2E tests
        setUser({
          id: '00000000-0000-0000-0000-000000000000',
          email: 'test@example.com',
          role: 'authenticated',
          aud: 'authenticated',
        } as User)
        setIsBypassed(true)
      } else {
        setUser(user)
        setIsBypassed(isBypassActive)
      }

      setLoading(false)
    }

    initAuth()

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, isBypassed, loading, isAuthorized: !!user || isBypassed }
}
