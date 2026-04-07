import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'

export default function HomePage() {
  const { lang, t } = useI18n()

  const cards = [
    { titleKey: 'home_card_24_title', descKey: 'home_card_24_desc', to: '/24-challenge' },
    { titleKey: 'home_card_capture_title', descKey: 'home_card_capture_desc', to: '/capture' },
    { titleKey: 'home_card_algebra_title', descKey: 'home_card_algebra_desc', to: '/algebra' },
  ]

  return (
    <>
      <Helmet>
        <html lang={lang} dir={lang === 'he' ? 'rtl' : 'ltr'} />
        <title>{t('meta_title_home')}</title>
        <link rel="canonical" href="https://sealmath.com/" />
        <link rel="alternate" hrefLang="he" href="https://sealmath.com/?lang=he" />
        <link rel="alternate" hrefLang="en" href="https://sealmath.com/" />
        <link rel="alternate" hrefLang="nl" href="https://sealmath.com/?lang=nl" />
        <link rel="alternate" hrefLang="x-default" href="https://sealmath.com/" />
        <meta name="description" content={t('meta_description_home')} />
      </Helmet>

      <section id="home-page" className="page active">
        <div className="home-hero">
          <h1 className="home-hero-title">{t('home_hero_title')}</h1>
          <p className="home-hero-subtitle">{t('home_hero_subtitle')}</p>
        </div>

        <div className="home-cards">
          {cards.map((card) => (
            <Link key={card.to} to={card.to} className="home-card">
              <h2 className="home-card-title">{t(card.titleKey)}</h2>
              <p className="home-card-desc">{t(card.descKey)}</p>
              <span className="home-card-cta">{t('home_cta')}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
