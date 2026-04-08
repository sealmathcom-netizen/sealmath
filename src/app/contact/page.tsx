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
  
  const canonical = lang === 'en' ? '/contact' : `/contact?lang=${lang}`

  return {
    title: t('meta_title_contact'),
    description: t('meta_description_contact'),
    alternates: {
      canonical,
      languages: {
        'he': '/contact?lang=he',
        'en': '/contact',
        'nl': '/contact?lang=nl',
        'x-default': '/contact',
      }
    }
  }
}

export default async function ContactPage() {
  const { lang, dict } = await getTranslations()
  return <ContactClient lang={lang} dict={dict} />
}
