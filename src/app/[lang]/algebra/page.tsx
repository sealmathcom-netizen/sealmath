import type { Metadata } from 'next'
import { getTranslations } from '@/i18n/server'
import { type Lang } from '@/i18n/translations'
import AlgebraClient from '@/components/client/AlgebraClient'

interface Props {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang: langParam } = await params
  const { t, lang } = await getTranslations(langParam as Lang)
  
  const title = t('meta_title_algebra')
  const description = t('meta_description_algebra')
  
  const baseUrl = 'https://sealmath.com'
  const path = lang === 'en' ? '/algebra' : `/${lang}/algebra`
  const absUrl = `${baseUrl}${path}`

  return {
    title,
    description,
    alternates: {
      canonical: absUrl,
      languages: {
        'en': `${baseUrl}/algebra`,
        'he': `${baseUrl}/he/algebra`,
        'nl': `${baseUrl}/nl/algebra`,
        'x-default': `${baseUrl}/algebra`,
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

export default async function AlgebraPage({ params }: Props) {
  const { lang: langParam } = await params
  const { lang, dict, t } = await getTranslations(langParam as Lang)

  return (
    <AuthWall lang={lang} dict={dict}>
      <AlgebraClient lang={lang} dict={dict}>
        <h1 style={{ fontSize: '2.2rem', marginTop: 0, marginBottom: '10px', textAlign: 'center' }}>{t('home_card_algebra_title')}</h1>
        <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: '2rem' }}>{t('meta_description_algebra')}</p>
      </AlgebraClient>
    </AuthWall>
  )
}
