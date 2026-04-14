import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { verifyBypassToken, BYPASS_COOKIES } from './utils/test-bypass'

const LANGUAGES = ['he', 'nl']
const DEFAULT_LANGUAGE = 'en'

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const host = request.headers.get('host')
  
  // 0. Domain Normalization (Enforce localhost over 127.0.0.1)
  if (host?.includes('127.0.0.1')) {
    const url = request.nextUrl.clone()
    url.host = host.replace('127.0.0.1', 'localhost')
    return NextResponse.redirect(url)
  }

  // 1. Handle Locale Sub-paths
  // Check if pathname already starts with a supported language
  const pathnameHasLocale = LANGUAGES.some(
    (lang) => pathname.startsWith(`/${lang}/`) || pathname === `/${lang}`
  )

  // Redirect old ?lang= query param to sub-path
  const langQuery = searchParams.get('lang')
  if (langQuery && LANGUAGES.includes(langQuery)) {
    const url = request.nextUrl.clone()
    url.pathname = `/${langQuery}${pathname === '/' ? '' : pathname}`
    url.searchParams.delete('lang')
    return NextResponse.redirect(url)
  }

  // If no locale in path and not a static/api route, rewrite to default lang
  const isApiRoute = pathname.startsWith('/api')
  const isAuthRoute = pathname.startsWith('/auth')
  const isStaticFile = pathname.match(/\.(png|jpg|ico|svg|css|js|json|webmanifest|txt)$/) || pathname.startsWith('/_next')

  if (!pathnameHasLocale && !isApiRoute && !isAuthRoute && !isStaticFile) {
    // We rewrite / to /en internally so app/[lang]/page.tsx handles it
    const url = request.nextUrl.clone()
    url.pathname = `/${DEFAULT_LANGUAGE}${pathname}`
    return NextResponse.rewrite(url)
  }

  // 2. Prepare response and Supabase client
  let response = NextResponse.next({
    request,
  })

  // Language Cookie (Sync with sub-path)
  if (pathnameHasLocale) {
    const locale = LANGUAGES.find(lang => pathname.startsWith(`/${lang}/`) || pathname === `/${lang}`)
    if (locale) response.cookies.set('preferredLang', locale, { path: '/' })
  } else if (pathname === '/' || pathname.startsWith(`/${DEFAULT_LANGUAGE}`)) {
     response.cookies.set('preferredLang', DEFAULT_LANGUAGE, { path: '/' })
  }

  // 3. Test Bypass (Secure JWT based)
  const bypassToken = request.cookies.get(BYPASS_COOKIES.TOKEN)?.value
  const isBypassed = await verifyBypassToken(bypassToken)
  
  if (isBypassed) {
    response.cookies.set(BYPASS_COOKIES.ACTIVE, 'true', { path: '/', maxAge: 300 })
    return response 
  }
  
  if (request.cookies.has(BYPASS_COOKIES.ACTIVE)) {
    response.cookies.delete(BYPASS_COOKIES.ACTIVE)
  }

  // 4. Define Route Metadata for remaining logic
  const isLoginPage = pathname.endsWith('/login')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  let user = null

  if (supabaseUrl && supabaseAnonKey && !isStaticFile) {
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

      const { data } = await supabase.auth.getUser()
      user = data?.user || null
    } catch (err) {
      console.error(`[Middleware] Exception during auth check:`, err)
    }
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
