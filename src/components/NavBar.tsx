'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Lang } from '../i18n/translations'
import { setLanguage } from '../app/actions'

type Props = {
  lang: Lang
  dict: Record<string, string>
}

export default function NavBar({ lang, dict }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const t = (key: string) => dict[key] ?? key

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

  const isActive = (path: string) => pathname === path

  return (
    <nav>
      <Link href="/" className={isActive('/') ? 'active' : ''}>
        {t('nav_home')}
      </Link>

      <Link href="/24-challenge" className={isActive('/24-challenge') ? 'active' : ''}>
        {t('nav_game')}
      </Link>

      <Link href="/capture" className={isActive('/capture') ? 'active' : ''}>
        {t('nav_fraction_capture')}
      </Link>

      <Link href="/algebra" className={isActive('/algebra') ? 'active' : ''}>
        {t('nav_algebra')}
      </Link>

      <Link href="/contact" className={isActive('/contact') ? 'active' : ''}>
        {t('nav_contact')}
      </Link>

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
