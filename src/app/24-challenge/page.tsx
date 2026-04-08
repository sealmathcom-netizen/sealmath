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
  
  const canonical = lang === 'en' ? 'https://sealmath.com/24-challenge' : `https://sealmath.com/24-challenge?lang=${lang}`

  return {
    title: t('meta_title_game'),
    description: t('meta_description_game'),
    alternates: {
      canonical,
      languages: {
        'he': 'https://sealmath.com/24-challenge?lang=he',
        'en': 'https://sealmath.com/24-challenge',
        'nl': 'https://sealmath.com/24-challenge?lang=nl',
        'x-default': 'https://sealmath.com/24-challenge',
      }
    }
  }
}

export default async function Challenge24Page({ searchParams }: Props) {
  const sParams = await searchParams
  const langQuery = sParams.lang as string | undefined
  const forceLang = (langQuery === 'he' || langQuery === 'nl' || langQuery === 'en') ? langQuery : undefined
  const { lang, dict, t } = await getTranslations(forceLang as Lang)
  return (
    <GameClient lang={lang} dict={dict}>
      <h1 style={{ margin: 0, fontSize: '1.8rem' }}>{t('game_title')}</h1>
      <p style={{ color: '#7f8c8d', margin: '0.5rem 0' }}>{t('meta_description_game')}</p>
    </GameClient>
  )
}
