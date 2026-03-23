import { useEffect, useMemo, useState } from 'react'
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

export function useI18n() {
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
      // The original legacy app used &larr; &rarr; inside strings.
      // We keep them as-is and let React render them as HTML via dangerouslySetInnerHTML when needed.
      return str
    }
  }, [lang])

  return { lang, setLang, t }
}

