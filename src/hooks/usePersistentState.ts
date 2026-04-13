'use client'

import { useEffect, useState, useRef } from 'react'
import { createSupabaseClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'

/**
 * A reactive hook that synchronizes a piece of state with Supabase.
 * It does NOT use localStorage, per user request.
 */
export function usePersistentState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(defaultValue)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const isInitialMount = useRef(true)
  const lastSavedValue = useRef<string>(JSON.stringify(defaultValue))

  // 1. Fetch from Supabase on mount or auth change
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const supabase = createSupabaseClient()

    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('user_data')
          .select('value')
          .eq('user_id', user!.id)
          .eq('key', key)
          .single()

        if (data && !error) {
          const val = data.value as T
          setState(val)
          lastSavedValue.current = JSON.stringify(val)
        }
      } catch (err) {
        console.error(`Error fetching persistent state for ${key}:`, err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, key])

  // 2. Save to Supabase when state changes (Debounced)
  useEffect(() => {
    // Skip if not logged in or if it's the initial mount (where we might still be loading)
    if (!user || loading) return

    const currentString = JSON.stringify(state)
    if (currentString === lastSavedValue.current) return

    const timer = setTimeout(async () => {
      const supabase = createSupabaseClient()
      try {
        const { error } = await supabase
          .from('user_data')
          .upsert({
            user_id: user.id,
            key: key,
            value: state,
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'user_id, key' 
          })

        if (!error) {
          lastSavedValue.current = currentString
        }
      } catch (err) {
        console.error(`Error saving persistent state for ${key}:`, err)
      }
    }, 1000) // 1 second debounce

    return () => clearTimeout(timer)
  }, [state, user, key, loading])

  return [state, setState, loading] as const
}
