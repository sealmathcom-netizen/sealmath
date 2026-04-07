import type { Metadata } from 'next'
import { getTranslations } from '@/i18n/server'
import AlgebraClient from '@/components/client/AlgebraClient'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations()
  return {
    title: t('meta_title_algebra'),
    description: t('meta_description_algebra'),
    alternates: {
      canonical: '/algebra',
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
