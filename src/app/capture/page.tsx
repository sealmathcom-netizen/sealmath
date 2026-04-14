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
  
  const title = t('meta_title_capture')
  const description = t('meta_description_capture')
  
  const path = lang === 'en' ? '/capture' : `/capture?lang=${lang}`
  const absUrl = `https://sealmath.com${path}`

  return {
    title,
    description,
    alternates: {
      canonical: absUrl,
      languages: {
        'en': 'https://sealmath.com/capture',
        'he': 'https://sealmath.com/capture?lang=he',
        'nl': 'https://sealmath.com/capture?lang=nl',
        'x-default': 'https://sealmath.com/capture',
      }
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: absUrl,
      images: [
        {
          url: 'https://sealmath.com/favicon.png',
          width: 512,
          height: 512,
          alt: 'SealMath Logo',
        },
      ],
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

export default async function CapturePage({ searchParams }: Props) {
  const sParams = await searchParams
  const langQuery = sParams.lang as string | undefined
  const forceLang = (langQuery === 'he' || langQuery === 'nl' || langQuery === 'en') ? langQuery : undefined
  const { lang, dict, t } = await getTranslations(forceLang as Lang)

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
