import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Lang } from './translations'
import { translations } from './translations'

function detectDefaultLanguage(): Lang {
  const saved = localStorage.getItem('preferredLang')
  if (saved === 'en' || saved === 'he' || saved === 'nl') return saved

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  const locale = navigator.language || ''

  if (tz.includes('Jerusalem') || locale.startsWith('he') || locale.includes('IL')) return 'he'
  if (tz.includes('Amsterdam') || locale.startsWith('nl')) return 'nl'
  return 'en'
}

function applyDir(lang: Lang) {
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr'
}

interface I18nContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlLang = searchParams.get('lang') as Lang | null

  const [lang, setLangInternal] = useState<Lang>(() => {
    if (urlLang === 'en' || urlLang === 'he' || urlLang === 'nl') return urlLang
    return detectDefaultLanguage()
  })

  // Sync state changes to localStorage and URL
  useEffect(() => {
    localStorage.setItem('preferredLang', lang)
    applyDir(lang)

    const currentUrlLang = searchParams.get('lang')
    if (currentUrlLang !== lang) {
      const newParams = new URLSearchParams(searchParams)
      if (lang === 'en') {
        newParams.delete('lang')
      } else {
        newParams.set('lang', lang)
      }
      setSearchParams(newParams, { replace: true })
    }
  }, [lang, setSearchParams, searchParams])

  // Sync URL changes back to state (e.g. browser back button or manual URL edit)
  useEffect(() => {
    if (urlLang && (urlLang === 'en' || urlLang === 'he' || urlLang === 'nl') && urlLang !== lang) {
      setLangInternal(urlLang)
    } else if (!urlLang && lang !== 'en' && !localStorage.getItem('preferredLang')) {
      // If no URL param and no saved preference, could fallback to English or detected
      // For now, we stay with current state or detection
    }
  }, [urlLang])

  const t = useMemo(() => {
    return (key: string, params: Record<string, string | number> = {}) => {
      const dict = translations[lang]
      let str = dict[key] ?? key
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(`{${k}}`, String(v))
      }
      return str
    }
  }, [lang])

  return (
    <I18nContext.Provider value={{ lang, setLang: setLangInternal, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return ctx
}

