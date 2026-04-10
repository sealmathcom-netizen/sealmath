import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    'https://aklaifdmrdloycebatrd.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrbGFpZmRtcmRsb3ljZWJhdHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzgxOTMsImV4cCI6MjA5MTI1NDE5M30.2kAu8T0LujyOgeC0bfanizS4Mj2-tuQ_M24tGOpqZu4',
    // process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // refreshing the auth token
  await supabase.auth.getUser()

  return supabaseResponse
}
