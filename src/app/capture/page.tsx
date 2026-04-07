import type { Metadata } from 'next'
import { getTranslations } from '@/i18n/server'
import CaptureClient from '@/components/client/CaptureClient'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations()
  return {
    title: t('meta_title_capture'),
    description: t('meta_description_capture'),
    alternates: {
      canonical: 'https://sealmath.com/capture',
      languages: {
        'he': 'https://sealmath.com/capture?lang=he',
        'en': 'https://sealmath.com/capture',
        'nl': 'https://sealmath.com/capture?lang=nl',
        'x-default': 'https://sealmath.com/capture',
      }
    }
  }
}

export default async function CapturePage() {
  const { lang, dict } = await getTranslations()
  return <CaptureClient lang={lang} dict={dict} />
}
