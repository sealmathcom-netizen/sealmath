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
  
  const canonical = lang === 'en' ? 'https://sealmath.com/capture' : `https://sealmath.com/capture?lang=${lang}`

  return {
    title: t('meta_title_capture'),
    description: t('meta_description_capture'),
    alternates: {
      canonical,
      languages: {
        'he': 'https://sealmath.com/capture?lang=he',
        'en': 'https://sealmath.com/capture',
        'nl': 'https://sealmath.com/capture?lang=nl',
        'x-default': 'https://sealmath.com/capture',
      }
    }
  }
}

import AuthWall from '@/components/auth/AuthWall'

export default async function CapturePage({ searchParams }: Props) {
  const sParams = await searchParams
  const langQuery = sParams.lang as string | undefined
  const forceLang = (langQuery === 'he' || langQuery === 'nl' || langQuery === 'en') ? langQuery : undefined
  const { lang, dict, t } = await getTranslations(forceLang as Lang)

  return (
    <AuthWall lang={lang} dict={dict}>
      <CaptureClient lang={lang} dict={dict}>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>{t('home_card_capture_title')}</h1>
        <p style={{ color: '#7f8c8d', margin: '0.5rem 0' }}>{t('meta_description_capture')}</p>
      </CaptureClient>
    </AuthWall>
  )
}
