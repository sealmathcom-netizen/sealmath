import type { Metadata } from 'next'
import { getTranslations } from '@/i18n/server'
import GameClient from '@/components/client/GameClient'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations()
  return {
    title: t('meta_title_game'),
    description: t('meta_description_game'),
    alternates: {
      canonical: '/24-challenge',
      languages: {
        'he': '/24-challenge?lang=he',
        'en': '/24-challenge',
        'nl': '/24-challenge?lang=nl',
        'x-default': '/24-challenge',
      }
    }
  }
}

export default async function Challenge24Page() {
  const { lang, dict } = await getTranslations()
  return <GameClient lang={lang} dict={dict} />
}
