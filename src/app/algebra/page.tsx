import type { Metadata } from 'next'
import { getTranslations } from '@/i18n/server'
import { type Lang } from '@/i18n/translations'
import AlgebraClient from '@/components/client/AlgebraClient'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sParams = await searchParams
  const langQuery = sParams.lang as string | undefined
  const forceLang = (langQuery === 'he' || langQuery === 'nl' || langQuery === 'en') ? langQuery : undefined
  const { t, lang } = await getTranslations(forceLang as Lang)
  
  const canonical = lang === 'en' ? 'https://sealmath.com/algebra' : `https://sealmath.com/algebra?lang=${lang}`

  return {
    title: t('meta_title_algebra'),
    description: t('meta_description_algebra'),
    alternates: {
      canonical,
      languages: {
        'he': 'https://sealmath.com/algebra?lang=he',
        'en': 'https://sealmath.com/algebra',
        'nl': 'https://sealmath.com/algebra?lang=nl',
        'x-default': 'https://sealmath.com/algebra',
      }
    }
  }
}

export default async function AlgebraPage({ searchParams }: Props) {
  const sParams = await searchParams
  const langQuery = sParams.lang as string | undefined
  const forceLang = (langQuery === 'he' || langQuery === 'nl' || langQuery === 'en') ? langQuery : undefined
  const { lang, dict, t } = await getTranslations(forceLang as Lang)
  return (
    <AlgebraClient lang={lang} dict={dict}>
      <h1 style={{ fontSize: '2.2rem', marginTop: 0, marginBottom: '10px', textAlign: 'center' }}>{t('home_card_algebra_title')}</h1>
      <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: '2rem' }}>{t('meta_description_algebra')}</p>
    </AlgebraClient>
  )
}
