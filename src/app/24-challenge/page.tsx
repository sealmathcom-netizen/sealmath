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
  
  const canonical = lang === 'en' ? '/24-challenge' : `/24-challenge?lang=${lang}`

  return {
    title: t('meta_title_game'),
    description: t('meta_description_game'),
    alternates: {
      canonical,
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
