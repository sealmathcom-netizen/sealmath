import { NavLink } from 'react-router-dom'
import type { Lang } from '../i18n/translations'

type Props = {
  lang: Lang
  onChangeLang: (lang: Lang) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export default function NavBar({ lang, onChangeLang, t }: Props) {
  return (
    <nav>
      <NavLink
        to="/"
        className={({ isActive }) => (isActive ? 'active' : '')}
        data-i18n="nav_game"
      >
        {t('nav_game')}
      </NavLink>

      <NavLink
        to="/capture"
        className={({ isActive }) => (isActive ? 'active' : '')}
        data-i18n="nav_fraction_capture"
      >
        {t('nav_fraction_capture')}
      </NavLink>

      <NavLink
        to="/algebra"
        className={({ isActive }) => (isActive ? 'active' : '')}
      >
        Algebra Basics
      </NavLink>

      <NavLink
        to="/contact"
        className={({ isActive }) => (isActive ? 'active' : '')}
        data-i18n="nav_contact"
      >
        {t('nav_contact')}
      </NavLink>

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

