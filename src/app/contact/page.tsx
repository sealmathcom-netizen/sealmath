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
  
  const canonical = lang === 'en' ? 'https://sealmath.com/contact' : `https://sealmath.com/contact?lang=${lang}`

  return {
    title: t('meta_title_contact'),
    description: t('meta_description_contact'),
    alternates: {
      canonical,
      languages: {
        'he': 'https://sealmath.com/contact?lang=he',
        'en': 'https://sealmath.com/contact',
        'nl': 'https://sealmath.com/contact?lang=nl',
        'x-default': 'https://sealmath.com/contact',
      }
    }
  }
}

export default async function ContactPage({ searchParams }: Props) {
  const sParams = await searchParams
  const langQuery = sParams.lang as string | undefined
  const forceLang = (langQuery === 'he' || langQuery === 'nl' || langQuery === 'en') ? langQuery : undefined
  const { lang, dict, t } = await getTranslations(forceLang as Lang)
  return (
    <ContactClient lang={lang} dict={dict}>
      <h1 style={{ textAlign: 'center', fontSize: '1.8rem', marginTop: 0 }}>{t('nav_contact')}</h1>
      <div className="feedback-intro" style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <p>{t('meta_description_contact')}</p>
      </div>
    </ContactClient>
  )
}
