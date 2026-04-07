import type { Metadata } from 'next'
import { getTranslations } from '@/i18n/server'
import ContactClient from '@/components/client/ContactClient'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations()
  return {
    title: t('meta_title_contact'),
    description: t('meta_description_contact'),
    alternates: {
      canonical: '/contact',
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
