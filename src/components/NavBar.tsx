'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState, useRef } from 'react'
import { createSupabaseClient } from '../utils/supabase/client'
import type { Lang } from '../i18n/translations'
import { setLanguage } from '../app/actions'
import type { User } from '@supabase/supabase-js'
import SealIcon from './auth/SealIcon'

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
  const [showDropdown, setShowDropdown] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
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

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  async function onChangeLang(newLang: Lang) {
    await setLanguage(newLang)
    const currentPath = pathname ?? '/'
    // Split the pathname to check for existing locale
    const segments = currentPath.split('/')
    // Current supported locales are 'he' and 'nl'. 'en' is the default.
    const isCurrentLocalePath = segments[1] === 'he' || segments[1] === 'nl'
    
    let newPathname = currentPath
    if (newLang === 'en') {
      if (isCurrentLocalePath) {
        // Remove the locale segment: /he/algebra -> /algebra
        newPathname = '/' + segments.slice(2).join('/')
      }
    } else {
      if (isCurrentLocalePath) {
        // Replace the locale segment: /he/algebra -> /nl/algebra
        segments[1] = newLang
        newPathname = segments.join('/')
      } else {
        // Add the locale segment: /algebra -> /he/algebra
        newPathname = `/${newLang}${currentPath === '/' ? '' : currentPath}`
      }
    }

    // Preserve search params
    const query = searchParams?.toString()
    router.replace(`${newPathname}${query ? `?${query}` : ''}`)
    router.refresh()
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setShowDropdown(false)
    router.refresh()
  }

  const getHref = (path: string) => {
    if (lang === 'en') return path
    return `/${lang}${path === '/' ? '' : path}`
  }

  const isActive = (path: string) => {
    const localizedPath = getHref(path)
    return pathname === localizedPath
  }

  const userAvatar = user?.user_metadata?.avatar_url
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || t('nav_user_generic')
  const userEmail = user?.email || ''

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 2000 }}>
      <Link href={getHref('/')} className={isActive('/') ? 'active' : ''} data-testid="nav-link-home">
        {t('nav_home')}
      </Link>

      <Link href={getHref('/24-challenge')} className={isActive('/24-challenge') ? 'active' : ''} data-testid="nav-link-24-challenge">
        {t('nav_game')}
      </Link>

      <Link href={getHref('/capture')} className={isActive('/capture') ? 'active' : ''} data-testid="nav-link-capture">
        {t('nav_fraction_capture')}
      </Link>

      <Link href={getHref('/algebra')} className={isActive('/algebra') ? 'active' : ''} data-testid="nav-link-algebra">
        {t('nav_algebra')}
      </Link>

      <Link href={getHref('/contact')} className={isActive('/contact') ? 'active' : ''} data-testid="nav-link-contact">
        {t('nav_contact')}
      </Link>

      {!loading && (
        <div style={{ position: 'relative' }} ref={menuRef}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)} 
                className="nav-profile-btn"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  padding: '4px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '50%',
                  transition: 'background 0.2s'
                }}
              >
                {userAvatar ? (
                  <img src={userAvatar} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--accent)' }} />
                ) : (
                  <SealIcon size={32} />
                )}
              </button>

              {showDropdown && (
                <div className="nav-dropdown" style={{
                  position: 'absolute',
                  top: '100%',
                  right: lang === 'he' ? 'auto' : 0,
                  left: lang === 'he' ? 0 : 'auto',
                  marginTop: '10px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  padding: '15px',
                  minWidth: '220px',
                  zIndex: 9999, // Maximize z-index to be on top of everything
                  animation: 'slideDown 0.2s ease-out'
                }}>
                  <div style={{ marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--dark)', fontSize: '0.95rem' }}>{userName}</p>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</p>
                  </div>
                  
                  <button 
                    onClick={handleSignOut}
                    style={{
                      width: '100%',
                      textAlign: 'start',
                      background: 'none',
                      border: 'none',
                      padding: '8px 0',
                      color: '#e74c3c',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>🚪</span> {t('nav_signout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href={getHref('/login')} className={isActive('/login') ? 'active' : ''} data-testid="nav-link-login">
              {t('nav_signin')}
            </Link>
          )}
        </div>
      )}

      <style jsx>{`
        .nav-profile-btn:hover {
          background: rgba(0,0,0,0.05) !important;
        }
        .nav-dropdown {
          transform-origin: top right;
        }
      `}</style>

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
