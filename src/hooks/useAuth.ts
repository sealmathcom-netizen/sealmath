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
      setUser(user)

      // Check Checkly Bypass Cookie
      const isBypassActive = document.cookie.includes('test-bypass-active=true')
      setIsBypassed(isBypassActive)

      setLoading(false)
    }

    initAuth()

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, isBypassed, loading, isAuthorized: !!user || isBypassed }
}
