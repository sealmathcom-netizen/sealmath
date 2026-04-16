import { getTranslations } from '@/i18n/server'
import { Lang } from '@/i18n/translations'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang: langParam } = await params
  const { dict, lang } = await getTranslations(langParam as Lang)
  const title = `${dict.nav_privacy} | SealMath`
  const description = 'Learn how SealMath handles your personal data and protects your privacy when using our math tools.'
  
  const baseUrl = 'https://sealmath.com'
  const path = lang === 'en' ? '/privacy' : `/${lang}/privacy`
  const absUrl = `${baseUrl}${path}`

  return {
    title,
    description,
    alternates: {
      canonical: absUrl,
      languages: {
        'en': `${baseUrl}/privacy`,
        'he': `${baseUrl}/he/privacy`,
        'nl': `${baseUrl}/nl/privacy`,
        'x-default': `${baseUrl}/privacy`,
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

export default async function PrivacyPage({ params }: Props) {
  const { lang: langParam } = await params
  const { dict } = await getTranslations(langParam as Lang)
  const t = (key: string) => dict[key] ?? key

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      <h1>{t('nav_privacy')}</h1>
      <p><strong>Last Updated:</strong> April 16, 2026</p>

      <section style={{ marginTop: '30px' }}>
        <h2>Introduction</h2>
        <p>Welcome to <strong>SealMath</strong>. We respect your privacy and are committed to protecting your personal data. This policy explains how we handle information when you use our services and tools.</p>
      </section>

      <section style={{ marginTop: '20px' }}>
        <h2>Data We Collect</h2>
        <p>We collect information you provide directly and information collected automatically:</p>
        <ul>
          <li><strong>Account Data:</strong> When you log in via Google, we receive your name, email address, and profile picture.</li>
          <li><strong>Technical Data:</strong> We automatically collect your browser type, device info, and IP address.</li>
          <li><strong>General Location:</strong> We extract your country from your IP address to provide localized experiences and analyze global usage.</li>
        </ul>
      </section>

      <section style={{ marginTop: '20px' }}>
        <h2>How We Use Your Data</h2>
        <p>We use this information strictly to:</p>
        <ul>
          <li>Create and manage your user account.</li>
          <li>Provide and personalize our mathematical tools.</li>
          <li>Monitor site performance and improve user experience.</li>
          <li>Maintain the security of our platform.</li>
        </ul>
      </section>

      <section style={{ marginTop: '20px' }}>
        <h2>Data Storage and Security</h2>
        <p>Your data is securely stored and processed using <strong>Supabase</strong> (database) and <strong>Axiom</strong> (logging), protected by industry-standard encryption. We do not sell your personal data to third parties.</p>
      </section>

      <section style={{ marginTop: '20px' }}>
        <h2>Your Rights</h2>
        <p>You may request to view, update, or delete your personal data at any time by contacting us at <strong>sealmathcom@gmail.com</strong>.</p>
      </section>
    </div>
  )
}
