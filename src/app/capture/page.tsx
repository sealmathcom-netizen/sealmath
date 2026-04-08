import type { Metadata } from 'next'
import { getTranslations } from '@/i18n/server'
import { type Lang } from '@/i18n/translations'
import CaptureClient from '@/components/client/CaptureClient'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sParams = await searchParams
  const langQuery = sParams.lang as string | undefined
  const forceLang = (langQuery === 'he' || langQuery === 'nl' || langQuery === 'en') ? langQuery : undefined
  const { t, lang } = await getTranslations(forceLang as Lang)
  
  const canonical = lang === 'en' ? '/capture' : `/capture?lang=${lang}`

  return {
    title: t('meta_title_capture'),
    description: t('meta_description_capture'),
    alternates: {
      canonical,
      languages: {
        'he': '/capture?lang=he',
        'en': '/capture',
        'nl': '/capture?lang=nl',
        'x-default': '/capture',
      }
    }
  }
}

export default async function CapturePage() {
  const { lang, dict } = await getTranslations()
  return <CaptureClient lang={lang} dict={dict} />
}
