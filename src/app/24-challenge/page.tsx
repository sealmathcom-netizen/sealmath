import type { Metadata } from 'next'
import { getTranslations } from '@/i18n/server'
import { type Lang } from '@/i18n/translations'
import GameClient from '@/components/client/GameClient'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sParams = await searchParams
  const langQuery = sParams.lang as string | undefined
  const forceLang = (langQuery === 'he' || langQuery === 'nl' || langQuery === 'en') ? langQuery : undefined
  const { t, lang } = await getTranslations(forceLang as Lang)
  
  const title = t('meta_title_game')
  const description = t('meta_description_game')
  
  const path = lang === 'en' ? '/24-challenge' : `/24-challenge?lang=${lang}`
  const absUrl = `https://sealmath.com${path}`

  return {
    title,
    description,
    alternates: {
      canonical: absUrl,
      languages: {
        'en': 'https://sealmath.com/24-challenge',
        'he': 'https://sealmath.com/24-challenge?lang=he',
        'nl': 'https://sealmath.com/24-challenge?lang=nl',
        'x-default': 'https://sealmath.com/24-challenge',
      }
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: absUrl,
      images: [
        {
          url: 'https://sealmath.com/favicon.png',
          width: 512,
          height: 512,
          alt: 'SealMath Logo',
        },
      ],
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

export default async function Challenge24Page({ searchParams }: Props) {
  const sParams = await searchParams
  const langQuery = sParams.lang as string | undefined
  const forceLang = (langQuery === 'he' || langQuery === 'nl' || langQuery === 'en') ? langQuery : undefined
  const { lang, dict, t } = await getTranslations(forceLang as Lang)

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
