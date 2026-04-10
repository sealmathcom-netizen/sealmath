import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: Supabase keys are missing on the client! If you just added them to Vercel, you must do a "Redeploy" with "Clean Build" to refresh the JavaScript bundle.')
    console.log('Client-side Debug:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseAnonKey,
      urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 10) : 'none'
    })
    // Use a placeholder URL to prevent the constructor from throwing "required" error
    return createBrowserClient('https://placeholder.supabase.co', 'placeholder')
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
