import { getTranslations } from '@/i18n/server'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getTranslations()
  const title = `${dict.nav_privacy} | SealMath`
  const description = 'Learn how SealMath handles your personal data and protects your privacy when using our math tools.'
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: 'https://sealmath.com/privacy',
    }
  }
}

export default async function PrivacyPage() {
  const { dict } = await getTranslations()
  const t = (key: string) => dict[key] ?? key

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      <h1>{t('nav_privacy')}</h1>
      <p><strong>Last Updated:</strong> April 10, 2026</p>

      <section style={{ marginTop: '30px' }}>
        <h2>Introduction</h2>
        <p>Welcome to <strong>SealMath</strong>. We respect your privacy and are committed to protecting your personal data. This policy explains how we handle information when you use our services and sign in via Google.</p>
      </section>

      <section style={{ marginTop: '20px' }}>
        <h2>Data We Collect</h2>
        <p>When you log in using Google Authentication, we collect:</p>
        <ul>
          <li><strong>Name:</strong> To personalize your experience.</li>
          <li><strong>Email Address:</strong> To identify your account and send service-related communications.</li>
          <li><strong>Profile Picture:</strong> (Optional) As provided by your Google profile.</li>
        </ul>
      </section>

      <section style={{ marginTop: '20px' }}>
        <h2>How We Use Your Data</h2>
        <p>We use this information strictly to:</p>
        <ul>
          <li>Create and manage your user account.</li>
          <li>Provide our mathematical tools and services.</li>
          <li>Maintain the security of our platform.</li>
        </ul>
      </section>

      <section style={{ marginTop: '20px' }}>
        <h2>Data Storage and Security</h2>
        <p>Your data is securely stored using <strong>Supabase</strong> (our database provider) and protected by industry-standard encryption. We do not sell your personal data to third parties.</p>
      </section>

      <section style={{ marginTop: '20px' }}>
        <h2>Your Rights</h2>
        <p>You may request to view, update, or delete your personal data at any time by contacting us at <strong>sealmathcom@gmail.com</strong>.</p>
      </section>
    </div>
  )
}
