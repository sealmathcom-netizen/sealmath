import { getTranslations } from '@/i18n/server'
import { Lang } from '@/i18n/translations'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang: langParam } = await params
  const { dict, lang } = await getTranslations(langParam as Lang)
  const title = `${dict.nav_terms} | SealMath`
  const description = 'The standard terms of service for using SealMath tools and games.'
  
  const baseUrl = 'https://sealmath.com'
  const path = lang === 'en' ? '/terms' : `/${lang}/terms`
  const absUrl = `${baseUrl}${path}`

  return {
    title,
    description,
    alternates: {
      canonical: absUrl,
      languages: {
        'en': `${baseUrl}/terms`,
        'he': `${baseUrl}/he/terms`,
        'nl': `${baseUrl}/nl/terms`,
        'x-default': `${baseUrl}/terms`,
      }
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: absUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  }
}

export default async function TermsPage({ params }: Props) {
  const { lang: langParam } = await params
  const { dict } = await getTranslations(langParam as Lang)
  const t = (key: string) => dict[key] ?? key

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      <h1>{t('nav_terms')}</h1>
      <p><strong>Last Updated:</strong> April 10, 2026</p>

      <section style={{ marginTop: '30px' }}>
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing <strong>SealMath</strong>, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
      </section>

      <section style={{ marginTop: '20px' }}>
        <h2>2. User Accounts</h2>
        <p>To access certain features, you must log in via Google. You are responsible for maintaining the security of your account and for all activities that occur under your account.</p>
      </section>

      <section style={{ marginTop: '20px' }}>
        <h2>3. Use License</h2>
        <p>Permission is granted to use the materials on SealMath for personal, non-commercial educational purposes only. You may not:</p>
        <ul>
          <li>Attempt to decompile or reverse engineer any software contained on the site.</li>
          <li>Use the site for any unlawful purpose.</li>
        </ul>
      </section>

      <section style={{ marginTop: '20px' }}>
        <h2>4. Limitations of Liability</h2>
        <p>The materials on SealMath are provided "as is." We make no warranties, expressed or implied, and hereby disclaim all other warranties including, without limitation, implied warranties of merchantability or fitness for a particular purpose.</p>
      </section>

      <section style={{ marginTop: '20px' }}>
        <h2>5. Governing Law</h2>
        <p>Any claim relating to SealMath shall be governed by the laws of your jurisdiction without regard to its conflict of law provisions.</p>
      </section>

      <section style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <h2>Contact Information</h2>
        <p>If you have questions about these terms, please contact us at <strong>sealmathcom@gmail.com</strong>.</p>
      </section>
    </div>
  )
}
