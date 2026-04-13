'use client'

import { createSupabaseClient } from '@/utils/supabase/client'
import { useSearchParams } from 'next/navigation'
import React, { useState } from 'react'
import type { Lang } from '@/i18n/translations'

type Props = {
  lang: Lang
  dict: Record<string, string>
}

export default function LoginClient({ lang, dict }: Props) {
  const supabase = createSupabaseClient()
  const searchParams = useSearchParams()
  const next = searchParams?.get('next')

  const t = (key: string) => dict[key] ?? key
  const isRtl = lang === 'he'
  const [authError, setAuthError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleLogin = async () => {
    try {
      setAuthError(null)
      setSuccessMsg(null)
      // Ensure we use localhost instead of 127.0.0.1 for OAuth consistency
      const origin = window.location.origin.replace('127.0.0.1', 'localhost')
      const redirectTo = new URL(`${origin}/auth/callback`)
      if (next) {
        redirectTo.searchParams.set('next', next)
      }

      // ── Network connectivity check ──────────────────────────────────
      // Etrog (and similar filters) can block in two ways:
      //   a) DNS-level block  → fetch throws a TypeError (net::ERR_NAME_NOT_RESOLVED)
      //   b) HTTP proxy block → fetch "succeeds" but returns an HTML block-page
      // We must detect BOTH: catch (a) in the catch block, detect (b) by
      // verifying the response is real Supabase JSON, not an HTML page.
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      if (supabaseUrl) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)
          const probeResp = await fetch(`${supabaseUrl}/auth/v1/health`, {
            method: 'GET',
            signal: controller.signal,
          })
          clearTimeout(timeoutId)

          // Verify the response is actual JSON from Supabase, not an HTML block page
          const contentType = probeResp.headers.get('content-type') || ''
          if (!contentType.includes('application/json')) {
            throw new Error('Response is not JSON — likely intercepted by a network filter')
          }
        } catch (probeError) {
          console.error('Supabase connectivity check failed:', probeError)
          throw new Error("The authentication service is temporarily unavailable. Please try again in a few minutes.")
        }
      } else {
        // No Supabase URL configured at all
        throw new Error("The authentication service is temporarily unavailable. Please try again in a few minutes.")
      }

      // ── OAuth sign-in ───────────────────────────────────────────────
      // Use skipBrowserRedirect so the library does NOT immediately navigate
      // away via window.location.href. Without this, if the redirect target
      // is blocked, the browser shows a raw error page and we lose the
      // ability to display our own friendly error message.
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: true,
          redirectTo: redirectTo.toString(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        },
      })

      if (error) {
        setAuthError(error.message)
        return
      }

      if (data?.url) {
        // Everything checked out — now navigate to the OAuth provider
        window.location.href = data.url
      } else {
        setAuthError("Failed to initialize login. Please try again.")
      }
    } catch (err: any) {
      console.error('Login network error:', err)
      setAuthError(err?.message || "The authentication service is temporarily unavailable. Please try again shortly.")
    }
  }

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setAuthError(null)
      setSuccessMsg(null)
      const formData = new FormData(e.currentTarget)
      const email = formData.get('email') as string
      
      const origin = window.location.origin.replace('127.0.0.1', 'localhost')
      const redirectTo = new URL(`${origin}/auth/callback`)
      if (next) {
        redirectTo.searchParams.set('next', next)
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo.toString(),
        },
      })

      if (error) {
        setAuthError(error.message)
      } else {
        setSuccessMsg(t('login_msg_check_email'))
      }
    } catch (err: any) {
      console.error('Email login network error:', err)
      setAuthError(err?.message || "The authentication service is temporarily unavailable. Please try again shortly.")
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', width: '100%' }}>
      <div className="container" style={{ textAlign: 'center', margin: '0 auto', direction: isRtl ? 'rtl' : 'ltr' }}>
      <h1>{t('login_title')}</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>
        {t('login_subtitle')}
      </p>
      
      <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {authError && (
          <div style={{ backgroundColor: '#ffeaa7', color: '#d63031', padding: '12px', borderRadius: '8px', border: '1px solid #fab1a0', fontWeight: 'bold' }}>
            ⚠️ {authError}
          </div>
        )}
        {successMsg && (
          <div style={{ backgroundColor: '#55efc4', color: '#00b894', padding: '12px', borderRadius: '8px', border: '1px solid #00b894', fontWeight: 'bold' }}>
            ✅ {successMsg}
          </div>
        )}
        <button 
          onClick={handleLogin}
          className="btn-solve shadow"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            padding: '12px 24px',
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

        <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input 
            name="email"
            type="email" 
            placeholder={t('login_email_placeholder')} 
            required 
            style={{ 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid #ddd', 
              fontSize: '1rem',
              textAlign: isRtl ? 'right' : 'left',
              direction: 'ltr' // Email is always LTR
            }}
          />
          <button 
            type="submit" 
            style={{ 
              padding: '12px', 
              borderRadius: '8px', 
              background: '#0f2a2a', 
              color: 'white',
              border: 'none',
              fontWeight: 'bold', 
              cursor: 'pointer',
              fontSize: '1rem' 
            }}
          >
            {t('login_email_btn')}
          </button>
        </form>
      </div>
    </div>
  </div>
)
}
