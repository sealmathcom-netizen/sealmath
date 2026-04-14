import type { Metadata } from 'next'
import { getTranslations } from '@/i18n/server'
import { type Lang } from '@/i18n/translations'
import CaptureClient from '@/components/client/CaptureClient'

interface Props {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang: langParam } = await params
  const { t, lang } = await getTranslations(langParam as Lang)
  
  const title = t('meta_title_capture')
  const description = t('meta_description_capture')
  
  const baseUrl = 'https://sealmath.com'
  const path = lang === 'en' ? '/capture' : `/${lang}/capture`
  const absUrl = `${baseUrl}${path}`

  return {
    title,
    description,
    alternates: {
      canonical: absUrl,
      languages: {
        'en': `${baseUrl}/capture`,
        'he': `${baseUrl}/he/capture`,
        'nl': `${baseUrl}/nl/capture`,
        'x-default': `${baseUrl}/capture`,
      }
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: absUrl,
      images: ['https://sealmath.com/favicon.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://sealmath.com/favicon.png'],
    }
  }
}

import AuthWall from '@/components/auth/AuthWall'

export default async function CapturePage({ params }: Props) {
  const { lang: langParam } = await params
  const { lang, dict, t } = await getTranslations(langParam as Lang)

  return (
    <section id="capture-page" className="page active">
      <div className="container" style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>{t('home_card_capture_title')}</h1>
        <p style={{ color: '#7f8c8d', margin: '0.5rem 0' }}>{t('meta_description_capture')}</p>
        <AuthWall lang={lang} dict={dict}>
          <CaptureClient lang={lang} dict={dict} />
        </AuthWall>
      </div>
    </section>
  )
}
