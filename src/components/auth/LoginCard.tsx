'use client'

import React, { useState } from 'react'
import { createSupabaseClient } from '@/utils/supabase/client'
import { usePathname } from 'next/navigation'
import type { Lang } from '@/i18n/translations'

type Props = {
  lang: Lang
  dict: Record<string, string>
}

export default function LoginCard({ lang, dict }: Props) {
  const supabase = createSupabaseClient()
  const pathname = usePathname()
  
  const t = (key: string) => dict[key] ?? key
  const isRtl = lang === 'he'
  const [authError, setAuthError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setAuthError(null)
      const origin = window.location.origin.replace('127.0.0.1', 'localhost')
      const redirectTo = new URL(`${origin}/auth/callback`)
      redirectTo.searchParams.set('next', pathname || '/')

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: true,
          redirectTo: redirectTo.toString(),
        },
      })

      if (error) throw error
      if (data?.url) window.location.href = data.url
    } catch (err: any) {
      setAuthError(err?.message || "Login failed")
      setLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      setAuthError(null)
      const formData = new FormData(e.currentTarget)
      const email = formData.get('email') as string
      
      const origin = window.location.origin.replace('127.0.0.1', 'localhost')
      const redirectTo = new URL(`${origin}/auth/callback`)
      redirectTo.searchParams.set('next', pathname || '/')

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo.toString() },
      })

      if (error) throw error
      setSuccessMsg(t('login_msg_check_email'))
    } catch (err: any) {
      setAuthError(err?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-card" style={{ 
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      padding: '40px',
      borderRadius: '24px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
      maxWidth: '450px',
      width: '90%',
      textAlign: 'center',
      border: '1px solid rgba(255,255,255,0.2)',
      direction: isRtl ? 'rtl' : 'ltr'
    }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>{t('login_title')}</h2>
      <p style={{ color: '#636e72', marginBottom: '30px', fontSize: '1.1rem' }}>
        {t('login_subtitle')}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {authError && (
          <div style={{ backgroundColor: '#ffeaa7', color: '#d63031', padding: '12px', borderRadius: '12px', fontSize: '0.9rem' }}>
            {authError}
          </div>
        )}
        {successMsg && (
          <div style={{ backgroundColor: '#55efc4', color: '#00b894', padding: '12px', borderRadius: '12px', fontSize: '0.9rem' }}>
            {successMsg}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="btn-solve shadow"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            width: '100%', padding: '14px', fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
          </svg>
          {t('login_google')}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#57606f' }}>
          <hr style={{ flex: 1, border: '0', borderTop: '1px solid #ced6e0' }} />
          <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: '600' }}>{t('login_or_email')}</span>
          <hr style={{ flex: 1, border: '0', borderTop: '1px solid #ced6e0' }} />
        </div>

        <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input 
            name="email" type="email" placeholder={t('login_email_placeholder')} required disabled={loading}
            style={{ 
              padding: '14px', borderRadius: '12px', border: '2px solid #edf2f7', fontSize: '1rem',
              textAlign: isRtl ? 'right' : 'left', direction: 'ltr'
            }}
          />
          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              padding: '12px', 
              borderRadius: '12px', 
              background: '#0f2a2a', 
              color: 'white',
              border: 'none',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem'
            }}
          >
            {t('login_email_btn')}
          </button>
        </form>
      </div>
    </div>
  )
}
