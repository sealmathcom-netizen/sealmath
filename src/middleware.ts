import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { verifyBypassToken, BYPASS_COOKIES } from './utils/test-bypass'
import { logToAxiom } from './utils/logger'

const LANGUAGES = ['he', 'nl']
const DEFAULT_LANGUAGE = 'en'

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const host = request.headers.get('host')
  
  // 0. Domain Normalization
  if (host?.includes('127.0.0.1')) {
    const url = request.nextUrl.clone()
    url.host = host.replace('127.0.0.1', 'localhost')
    return NextResponse.redirect(url)
  }

  // 1. Handle Locale Sub-paths
  const pathnameHasLocale = LANGUAGES.some(
    (lang) => pathname.startsWith(`/${lang}/`) || pathname === `/${lang}`
  )

  const langQuery = searchParams.get('lang')
  if (langQuery && LANGUAGES.includes(langQuery)) {
    const url = request.nextUrl.clone()
    url.pathname = `/${langQuery}${pathname === '/' ? '' : pathname}`
    url.searchParams.delete('lang')
    return NextResponse.redirect(url)
  }

  const isApiRoute = pathname.startsWith('/api')
  const isAuthRoute = pathname.startsWith('/auth')
  const isAxiomRoute = pathname.startsWith('/_axiom')
  const isStaticFile = pathname.match(/\.(png|jpg|ico|svg|css|js|json|webmanifest|txt)$/) || pathname.startsWith('/_next')

  if (!pathnameHasLocale && !isApiRoute && !isAuthRoute && !isAxiomRoute && !isStaticFile) {
    const url = request.nextUrl.clone()
    url.pathname = `/${DEFAULT_LANGUAGE}${pathname}`
    return NextResponse.rewrite(url)
  }

  let response = NextResponse.next({ request })

  // Language Cookie
  if (pathnameHasLocale) {
    const locale = LANGUAGES.find(lang => pathname.startsWith(`/${lang}/`) || pathname === `/${lang}`)
    if (locale) response.cookies.set('preferredLang', locale, { path: '/' })
  } else if (pathname === '/' || pathname.startsWith(`/${DEFAULT_LANGUAGE}`)) {
     response.cookies.set('preferredLang', DEFAULT_LANGUAGE, { path: '/' })
  }

  // 3. Test Bypass
  const bypassToken = request.cookies.get(BYPASS_COOKIES.TOKEN)?.value
  const isBypassed = await verifyBypassToken(bypassToken)
  
  if (isBypassed) {
    response.cookies.set(BYPASS_COOKIES.ACTIVE, 'true', { path: '/', maxAge: 300 })
    return response 
  }
  
  if (request.cookies.has(BYPASS_COOKIES.ACTIVE)) {
    response.cookies.delete(BYPASS_COOKIES.ACTIVE)
  }

  // 4. Supabase Auth & Logging
  const isLoginPage = pathname.endsWith('/login')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (supabaseUrl && supabaseAnonKey && !isStaticFile) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          },
        },
      })

      const { data } = await supabase.auth.getUser()
      const user = data?.user || null
      
      // SUCCESS LOG
      logToAxiom({
        level: 'info',
        message: 'Middleware path access',
        pathname,
        method: request.method,
        userId: user?.id || 'anonymous',
        source: 'middleware'
      });

      if (user && isLoginPage) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    } catch (err) {
      // ERROR LOG
      logToAxiom({
        level: 'error',
        message: 'Middleware exception',
        pathname,
        error: err instanceof Error ? err.message : String(err),
        source: 'middleware'
      });
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
