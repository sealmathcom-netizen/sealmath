import type { Metadata } from 'next'
import { getTranslations } from '@/i18n/server'
import { type Lang } from '@/i18n/translations'
import GameClient from '@/components/client/GameClient'

interface Props {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang: langParam } = await params
  const { t, lang } = await getTranslations(langParam as Lang)
  
  const title = t('meta_title_game')
  const description = t('meta_description_game')
  
  const baseUrl = 'https://sealmath.com'
  const path = lang === 'en' ? '/24-challenge' : `/${lang}/24-challenge`
  const absUrl = `${baseUrl}${path}`

  return {
    title,
    description,
    alternates: {
      canonical: absUrl,
      languages: {
        'en': `${baseUrl}/24-challenge`,
        'he': `${baseUrl}/he/24-challenge`,
        'nl': `${baseUrl}/nl/24-challenge`,
        'x-default': `${baseUrl}/24-challenge`,
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

import AuthWall from '@/components/auth/AuthWall'

export default async function Challenge24Page({ params }: Props) {
  const { lang: langParam } = await params
  const { lang, dict, t } = await getTranslations(langParam as Lang)

  return (
    <section id="game-page" className="page active">
      <div className="container" style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>{t('game_title')}</h1>
        <p style={{ color: '#7f8c8d', margin: '0.5rem 0' }}>{t('meta_description_game')}</p>
        <AuthWall lang={lang} dict={dict}>
          <GameClient lang={lang} dict={dict} />
        </AuthWall>
      </div>
    </section>
  )
}
