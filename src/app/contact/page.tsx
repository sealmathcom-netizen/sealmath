import type { Metadata } from 'next'
import { getTranslations } from '@/i18n/server'
import ContactClient from '@/components/client/ContactClient'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations()
  return {
    title: t('meta_title_contact'),
    description: t('meta_description_contact'),
    alternates: {
      canonical: 'https://sealmath.com/contact',
      languages: {
        'he': 'https://sealmath.com/contact?lang=he',
        'en': 'https://sealmath.com/contact',
        'nl': 'https://sealmath.com/contact?lang=nl',
        'x-default': 'https://sealmath.com/contact',
      }
    }
  }
}

export default async function ContactPage() {
  const { lang, dict } = await getTranslations()
  return <ContactClient lang={lang} dict={dict} />
}
