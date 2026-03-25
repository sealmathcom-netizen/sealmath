import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
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
  const [lang, setLang] = useState<Lang>(() => detectDefaultLanguage())

  useEffect(() => {
    localStorage.setItem('preferredLang', lang)
    applyDir(lang)
  }, [lang])

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
    <I18nContext.Provider value={{ lang, setLang, t }}>
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

