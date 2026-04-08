import { cookies } from 'next/headers'
import type { Lang } from './translations'
import { translations } from './translations'

export async function getLanguage(): Promise<Lang> {
  const cookieStore = await cookies()
  const lang = cookieStore.get('preferredLang')?.value
  
  if (lang === 'en' || lang === 'he' || lang === 'nl') {
    return lang
  }
  
  return 'en'
}

export async function getTranslations(forcedLang?: Lang) {
  const lang = forcedLang || await getLanguage()
  
  const dict = translations[lang]
  const t = (key: string, params: Record<string, string | number> = {}) => {
    let str = dict[key] ?? key
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, String(v))
    }
    return str
  }

  return { lang, t, dict }
}
