import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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

  // 0.1 Test Bypass (For E2E Tests only)
  const bypassToken = request.cookies.get('test-bypass-token')?.value
  const isBypassed = bypassToken && (bypassToken === process.env.TEST_BYPASS_TOKEN || bypassToken === 'playwright-local-test-secret')
  if (isBypassed) {
    console.log(`[Middleware] TEST BYPASS ACTIVE for ${path}`)
    return response // Return the response object we just prepared!
  }

  // 2. Define Public Routes
  const isAuthRoute = path.startsWith('/auth')
  const isPublicPage = path === '/'
  const isLoginPage = path === '/login'
  const isApiRoute = path.startsWith('/api')
  const isStaticFile = path.match(/\.(png|jpg|ico|svg|css|js|json|webmanifest|txt)$/) || path.startsWith('/_next')

  // Early exit for auth routes and static files to avoid unnecessary work
  if (isAuthRoute || isStaticFile) {
    return response
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Middleware] MISSING SUPABASE ENVS - Auth protected routes will fail')
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
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

  // This will also refresh the session if needed
  const { data: { user } } = await supabase.auth.getUser()

  console.log(`[Middleware] Auth check - User: ${user ? user.email : 'None'}, Path: ${path}`)

  // 3. Protection Logic
  if (!user && !isPublicPage && !isLoginPage && !isAuthRoute && !isStaticFile && !isApiRoute) {
    console.log(`[Middleware] Unauthenticated access to ${path}. Redirecting to /login`)
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path) // Store the intended destination
    return NextResponse.redirect(url)
  }

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
