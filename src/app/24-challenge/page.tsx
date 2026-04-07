import type { Metadata } from 'next'
import { getTranslations } from '@/i18n/server'
import GameClient from '@/components/client/GameClient'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations()
  return {
    title: t('meta_title_game'),
    description: t('meta_description_game'),
    alternates: {
      canonical: 'https://sealmath.com/24-challenge',
      languages: {
        'he': 'https://sealmath.com/24-challenge?lang=he',
        'en': 'https://sealmath.com/24-challenge',
        'nl': 'https://sealmath.com/24-challenge?lang=nl',
        'x-default': 'https://sealmath.com/24-challenge',
      }
    }
  }
}

export default async function Challenge24Page() {
  const { lang, dict } = await getTranslations()
  return <GameClient lang={lang} dict={dict} />
}
