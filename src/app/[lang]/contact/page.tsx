import type { Metadata } from 'next'
import { getTranslations } from '@/i18n/server'
import { type Lang } from '@/i18n/translations'
import ContactClient from '@/components/client/ContactClient'

interface Props {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang: langParam } = await params
  const { t, lang } = await getTranslations(langParam as Lang)
  
  const title = t('meta_title_contact')
  const description = t('meta_description_contact')
  
  const baseUrl = 'https://sealmath.com'
  const path = lang === 'en' ? '/contact' : `/${lang}/contact`
  const absUrl = `${baseUrl}${path}`

  return {
    title,
    description,
    alternates: {
      canonical: absUrl,
      languages: {
        'en': `${baseUrl}/contact`,
        'he': `${baseUrl}/he/contact`,
        'nl': `${baseUrl}/nl/contact`,
        'x-default': `${baseUrl}/contact`,
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

export default async function ContactPage({ params }: Props) {
  const { lang: langParam } = await params
  const { lang, dict, t } = await getTranslations(langParam as Lang)

  return (
    <AuthWall lang={lang} dict={dict}>
      <ContactClient lang={lang} dict={dict}>
        <h1 style={{ textAlign: 'center', fontSize: '1.8rem', marginTop: 0 }}>{t('nav_contact')}</h1>
        <div className="feedback-intro" style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <p>{t('meta_description_contact')}</p>
        </div>
      </ContactClient>
    </AuthWall>
  )
}
