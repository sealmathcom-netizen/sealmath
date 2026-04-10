import { createBrowserClient } from '@supabase/ssr'

// These are NEXT_PUBLIC_ keys — they are intentionally public and safe to hardcode.
// They serve as a guaranteed fallback when Next.js fails to inject them at build time.
const FALLBACK_SUPABASE_URL = 'https://aklaifdmrdloycebatrd.supabase.co'
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrbGFpZmRtcmRsb3ljZWJhdHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzgxOTMsImV4cCI6MjA5MTI1NDE5M30.2kAu8T0LujyOgeC0bfanizS4Mj2-tuQ_M24tGOpqZu4'

export function createSupabaseClient() {
  const supabaseUrl = FALLBACK_SUPABASE_URL
  // const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL
  const supabaseAnonKey = FALLBACK_SUPABASE_ANON_KEY
  // const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true
      }
    }
  )
}
