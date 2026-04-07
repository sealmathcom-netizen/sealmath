import Link from 'next/link'
import { getTranslations } from '@/i18n/server'

export default async function HomePage() {
  const { t } = await getTranslations()

  const cards = [
    { titleKey: 'home_card_24_title', descKey: 'home_card_24_desc', to: '/24-challenge' },
    { titleKey: 'home_card_capture_title', descKey: 'home_card_capture_desc', to: '/capture' },
    { titleKey: 'home_card_algebra_title', descKey: 'home_card_algebra_desc', to: '/algebra' },
  ]

  return (
    <section id="home-page" className="page active" style={{ display: 'block' }}>
      <div className="home-hero">
        <h1 className="home-hero-title">{t('home_hero_title')}</h1>
        <p className="home-hero-subtitle">{t('home_hero_subtitle')}</p>
      </div>

      <div className="home-cards">
        {cards.map((card) => (
          <Link key={card.to} href={card.to} className="home-card">
            <h2 className="home-card-title">{t(card.titleKey)}</h2>
            <p className="home-card-desc">{t(card.descKey)}</p>
            <span className="home-card-cta">{t('home_cta')}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
