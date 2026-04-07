import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get('lang')
  
  if (lang === 'en' || lang === 'nl' || lang === 'he') {
    const response = NextResponse.next()
    response.cookies.set('preferredLang', lang, { path: '/' })
    return response
  }
}
