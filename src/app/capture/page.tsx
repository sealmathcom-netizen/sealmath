import type { Metadata } from 'next'
import { getTranslations } from '@/i18n/server'
import CaptureClient from '@/components/client/CaptureClient'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations()
  return {
    title: t('meta_title_capture'),
    description: t('meta_description_capture'),
    alternates: {
      canonical: '/capture',
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
