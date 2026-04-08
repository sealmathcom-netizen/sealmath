import type { Metadata } from 'next'
import { getTranslations } from '@/i18n/server'
import { type Lang } from '@/i18n/translations'
import AlgebraClient from '@/components/client/AlgebraClient'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sParams = await searchParams
  const langQuery = sParams.lang as string | undefined
  const forceLang = (langQuery === 'he' || langQuery === 'nl' || langQuery === 'en') ? langQuery : undefined
  const { t, lang } = await getTranslations(forceLang as Lang)
  
  const canonical = lang === 'en' ? '/algebra' : `/algebra?lang=${lang}`

  return {
    title: t('meta_title_algebra'),
    description: t('meta_description_algebra'),
    alternates: {
      canonical,
      languages: {
        'he': '/algebra?lang=he',
        'en': '/algebra',
        'nl': '/algebra?lang=nl',
        'x-default': '/algebra',
      }
    }
  }
}

export default async function AlgebraPage() {
  const { lang, dict } = await getTranslations()
  return <AlgebraClient lang={lang} dict={dict} />
}
