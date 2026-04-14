import type { Metadata } from 'next'
import { getTranslations } from '@/i18n/server'
import { type Lang } from '@/i18n/translations'
import ContactClient from '@/components/client/ContactClient'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sParams = await searchParams
  const langQuery = sParams.lang as string | undefined
  const forceLang = (langQuery === 'he' || langQuery === 'nl' || langQuery === 'en') ? langQuery : undefined
  const { t, lang } = await getTranslations(forceLang as Lang)
  
  const title = t('meta_title_contact')
  const description = t('meta_description_contact')
  
  const path = lang === 'en' ? '/contact' : `/contact?lang=${lang}`
  const absUrl = `https://sealmath.com${path}`

  return {
    title,
    description,
    alternates: {
      canonical: absUrl,
      languages: {
        'en': 'https://sealmath.com/contact',
        'he': 'https://sealmath.com/contact?lang=he',
        'nl': 'https://sealmath.com/contact?lang=nl',
        'x-default': 'https://sealmath.com/contact',
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

export default async function ContactPage({ searchParams }: Props) {
  const sParams = await searchParams
  const langQuery = sParams.lang as string | undefined
  const forceLang = (langQuery === 'he' || langQuery === 'nl' || langQuery === 'en') ? langQuery : undefined
  const { lang, dict, t } = await getTranslations(forceLang as Lang)

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
