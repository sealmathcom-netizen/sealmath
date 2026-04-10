import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: Supabase keys are missing on the client! If you just added them to Vercel, you must do a "Redeploy" with "Clean Build" to refresh the JavaScript bundle.')
    console.log('Client-side Debug:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseAnonKey,
      urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 10) : 'none'
    })
    // Fallback to empty strings to prevent the underlying SDK from throwing a generic crash
    return createBrowserClient('', '')
  }

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
