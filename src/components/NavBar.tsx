'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createSupabaseClient } from '../utils/supabase/client'
import type { Lang } from '../i18n/translations'
import { setLanguage } from '../app/actions'
import type { User } from '@supabase/supabase-js'

type Props = {
  lang: Lang
  dict: Record<string, string>
}

export default function NavBar({ lang, dict }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isBypassed, setIsBypassed] = useState(false)
  // Memoize the client so it is created exactly once, not on every render
  const supabase = useMemo(() => createSupabaseClient(), [])

  const t = (key: string) => dict[key] ?? key

  useEffect(() => {
    // Check for test bypass cookie (unsigned flag set by middleware)
    const hasBypass = document.cookie.includes('test-bypass-active=true')
    setIsBypassed(hasBypass)

    async function getUser() {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) console.warn('Auth error in NavBar:', error.message)
        setUser(data?.user ?? null)
      } catch (err) {
        console.error('Exception fetching user in NavBar:', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  async function onChangeLang(newLang: Lang) {
    await setLanguage(newLang)
    
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    if (newLang === 'en') {
      params.delete('lang')
    } else {
      params.set('lang', newLang)
    }
    const query = params.toString()
    router.replace(`${pathname}${query ? `?${query}` : ''}`)
    router.refresh()
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const getHref = (path: string) => {
    if (path === '/' || user || isBypassed) return path
    return `/login?next=${encodeURIComponent(path)}`
  }

  const isActive = (path: string) => pathname === path

  return (
    <nav>
      <Link href={getHref('/')} className={isActive('/') ? 'active' : ''}>
        {t('nav_home')}
      </Link>

      <Link href={getHref('/24-challenge')} className={isActive('/24-challenge') ? 'active' : ''}>
        {t('nav_game')}
      </Link>

      <Link href={getHref('/capture')} className={isActive('/capture') ? 'active' : ''}>
        {t('nav_fraction_capture')}
      </Link>

      <Link href={getHref('/algebra')} className={isActive('/algebra') ? 'active' : ''}>
        {t('nav_algebra')}
      </Link>

      <Link href={getHref('/contact')} className={isActive('/contact') ? 'active' : ''}>
        {t('nav_contact')}
      </Link>

      {!loading && (
        <>
          {user ? (
            <button 
              onClick={handleSignOut} 
              className="nav-btn-text"
              style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', color: 'inherit' }}
            >
              {t('nav_signout')}
            </button>
          ) : (
            <Link href="/login" className={isActive('/login') ? 'active' : ''}>
              {t('nav_signin')}
            </Link>
          )}
        </>
      )}

      <select
        id="lang-switcher"
        value={lang}
        onChange={(e) => onChangeLang(e.target.value as Lang)}
        style={{
          marginInlineStart: 'auto',
          padding: '4px',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          border: '2px solid var(--dark)',
          background: 'transparent',
        }}
      >
        <option value="en">🇺🇸 EN</option>
        <option value="he">🇮🇱 HE</option>
        <option value="nl">🇳🇱 NL</option>
      </select>
    </nav>
  )
}
