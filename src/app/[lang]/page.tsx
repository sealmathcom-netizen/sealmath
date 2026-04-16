import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { getTranslations } from '@/i18n/server'
import { type Lang } from '@/i18n/translations'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { verifyBypassToken, BYPASS_COOKIES } from '@/utils/test-bypass'

interface Props {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang: langParam } = await params
  const { t, lang } = await getTranslations(langParam as Lang)
  
  const title = t('meta_title_home')
  const description = t('meta_description_home')
  
  const baseUrl = 'https://sealmath.com'
  const path = lang === 'en' ? '' : `/${lang}`
  const absUrl = `${baseUrl}${path}`

  return {
    title,
    description,
    alternates: {
      canonical: absUrl,
      languages: {
        'en': baseUrl,
        'he': `${baseUrl}/he`,
        'nl': `${baseUrl}/nl`,
        'x-default': baseUrl,
      }
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: absUrl,
      images: ['https://sealmath.com/favicon.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://sealmath.com/favicon.png'],
    }
  }
}

export default async function HomePage({ params }: Props) {
  const { lang: langParam } = await params
  const { t, lang } = await getTranslations(langParam as Lang)

  let user = null
  let isBypassed = false
  try {
    const cookieStore = await cookies()
    const bypassToken = cookieStore.get(BYPASS_COOKIES.TOKEN)?.value
    isBypassed = await verifyBypassToken(bypassToken)
    
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

  const getHref = (path: string) => lang === 'en' ? path : `/${lang}${path}`

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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'EducationalOrganization',
            name: 'SealMath',
            url: 'https://sealmath.com',
            logo: 'https://sealmath.com/favicon.png',
            description: t('meta_description_home'),
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
            },
          }),
        }}
      />
    </section>
  )
}
