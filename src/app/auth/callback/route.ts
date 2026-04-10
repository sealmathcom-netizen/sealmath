import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  const cookieStore = await cookies()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    console.log(`[Auth Callback] User already logged in: ${user.email}. Redirecting to ${next}`)
    return NextResponse.redirect(`${origin}${next}`)
  }

  const allCookies = cookieStore.getAll()
  
  console.log(`[Auth Callback] Received request with code: ${code ? 'Yes' : 'No'}, Next: ${next}`)
  
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  if (error || error_description) {
    console.error(`[Auth Callback] URL contains error: ${error} - ${error_description}`)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error_description || error || 'Unknown')}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!exchangeError) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      const normalizedOrigin = origin.replace('127.0.0.1', 'localhost')

      if (isLocalEnv) {
        return NextResponse.redirect(`${normalizedOrigin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${normalizedOrigin}${next}`)
      }
    } else {
      console.error(`[Auth Callback] Exchange error:`, exchangeError.message)
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(exchangeError.message)}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`)
}
