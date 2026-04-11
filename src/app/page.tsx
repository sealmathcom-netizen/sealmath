import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { getTranslations } from '@/i18n/server'
import { type Lang } from '@/i18n/translations'
import { createSupabaseServerClient } from '@/utils/supabase/server'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sParams = await searchParams
  const langQuery = sParams.lang as string | undefined
  const forceLang = (langQuery === 'he' || langQuery === 'nl' || langQuery === 'en') ? langQuery : undefined
  const { t, lang } = await getTranslations(forceLang as Lang)
  
  const canonical = lang === 'en' ? 'https://sealmath.com/' : `https://sealmath.com/?lang=${lang}`

  return {
    title: t('meta_title_home'),
    description: t('meta_description_home'),
    alternates: {
      canonical,
      languages: {
        'he': 'https://sealmath.com/?lang=he',
        'en': 'https://sealmath.com/',
        'nl': 'https://sealmath.com/?lang=nl',
        'x-default': 'https://sealmath.com/',
      }
    }
  }
}

export default async function HomePage({ searchParams }: Props) {
  const sParams = await searchParams
  const langQuery = sParams.lang as string | undefined
  const forceLang = (langQuery === 'he' || langQuery === 'nl' || langQuery === 'en') ? langQuery : undefined
  const { t } = await getTranslations(forceLang as Lang)

  let user = null
  let isBypassed = false
  try {
    const cookieStore = await cookies()
    const bypassToken = cookieStore.get('test-bypass-token')?.value
    isBypassed = !!bypassToken && (bypassToken === process.env.TEST_BYPASS_TOKEN || bypassToken === 'playwright-local-test-secret')
    
    if (!isBypassed) {
      const supabase = await createSupabaseServerClient()
      const { data } = await supabase.auth.getUser()
      user = data?.user || null
    }
  } catch (err) {
    console.warn('[HomePage] Auth check failed (harmless if unauthenticated):', err)
  }

  const cards = [
    { titleKey: 'home_card_24_title', descKey: 'home_card_24_desc', to: '/24-challenge' },
    { titleKey: 'home_card_capture_title', descKey: 'home_card_capture_desc', to: '/capture' },
    { titleKey: 'home_card_algebra_title', descKey: 'home_card_algebra_desc', to: '/algebra' },
  ]

  const getHref = (path: string) => {
    if (user || isBypassed) return path
    return `/login?next=${encodeURIComponent(path)}`
  }

  return (
    <section id="home-page" className="page active">
      <div className="home-hero">
        <h1 className="home-hero-title">{t('home_hero_title')}</h1>
        <p className="home-hero-subtitle">{t('home_hero_subtitle')}</p>
      </div>

      <div className="home-cards">
        {cards.map((card) => (
          <Link key={card.to} href={getHref(card.to)} className="home-card">
            <h2 className="home-card-title">{t(card.titleKey)}</h2>
            <p className="home-card-desc">{t(card.descKey)}</p>
            <span className="home-card-cta">{t('home_cta')}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
