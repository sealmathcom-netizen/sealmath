import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { verifyBypassToken, BYPASS_COOKIES } from './utils/test-bypass'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const host = request.headers.get('host')
  
  // 0. Domain Normalization (Enforce localhost over 127.0.0.1)
  if (host?.includes('127.0.0.1')) {
    const url = request.nextUrl.clone()
    url.host = host.replace('127.0.0.1', 'localhost')
    return NextResponse.redirect(url)
  }

  console.log(`[Middleware] Processing request: ${path}`)

  // 1. Prepare response and Supabase client
  let response = NextResponse.next({
    request,
  })

  // Language Handling (Early so it persists in the response)
  const lang = request.nextUrl.searchParams.get('lang')
  if (lang === 'en' || lang === 'nl' || lang === 'he') {
    response.cookies.set('preferredLang', lang, { path: '/' })
    console.log(`[Middleware] Language set to: ${lang}`)
  }

  // 0.1 Test Bypass (Secure JWT based)
  const bypassToken = request.cookies.get(BYPASS_COOKIES.TOKEN)?.value
  const isBypassed = await verifyBypassToken(bypassToken)
  
  if (isBypassed) {
    console.log(`[Middleware] SECURE TEST BYPASS ACTIVE for ${path}`)
    // Set a client-readable cookie so components like NavBar know we are bypassed
    response.cookies.set(BYPASS_COOKIES.ACTIVE, 'true', { path: '/', maxAge: 300 }) // 5 min matches JWT
    return response 
  }
  
  // Ensure the active flag is cleared if we are NOT bypassed
  if (request.cookies.has(BYPASS_COOKIES.ACTIVE)) {
    response.cookies.delete(BYPASS_COOKIES.ACTIVE)
  }

  // 2. Define Public Routes
  const isAuthRoute = path.startsWith('/auth')
  const isPublicPage = path === '/' || path === '/terms' || path === '/privacy'
  const isLoginPage = path === '/login'
  const isApiRoute = path.startsWith('/api')
  const isStaticFile = path.match(/\.(png|jpg|ico|svg|css|js|json|webmanifest|txt)$/) || path.startsWith('/_next')

  // Early exit for auth routes and static files to avoid unnecessary work
  if (isAuthRoute || isStaticFile) {
    return response
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  let user = null

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Middleware] MISSING SUPABASE ENVS - Failing auth gracefully')
  } else {
    try {
      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => {
                request.cookies.set(name, value)
              })
              response = NextResponse.next({
                request,
              })
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options)
              })
            },
          },
        }
      )

      const { data, error } = await supabase.auth.getUser()
      user = data?.user || null
      if (error) {
        console.warn(`[Middleware] Auth check returned error:`, error.message)
      }
    } catch (err) {
      console.error(`[Middleware] Exception during auth check (network error?):`, err)
    }
  }

  // 3. Protection Logic - REMOVED for SEO. Auth is handled by the AuthWall component.
  // We no longer redirect to /login here.

  // If user is logged in and tries to go to login page, send to home
  if (user && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
