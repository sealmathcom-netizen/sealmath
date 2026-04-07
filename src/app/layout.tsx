import type { Metadata } from 'next'
import { getTranslations } from '@/i18n/server'
import NavBar from '@/components/NavBar'
import GlobalStorageControls from '@/components/GlobalStorageControls'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations()
  
  return {
    title: t('meta_title_home'),
    description: t('meta_description_home'),
    metadataBase: new URL('https://sealmath.com'),
    manifest: '/manifest.json',
    alternates: {
      canonical: '/',
      languages: {
        'he': '/?lang=he',
        'en': '/',
        'nl': '/?lang=nl',
        'x-default': '/',
      }
    }
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { lang, dict } = await getTranslations()

  return (
    <html lang={lang} dir={lang === 'he' ? 'rtl' : 'ltr'}>
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="stylesheet" href="/style.css" />
        <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js" async defer></script>
      </head>
      <body>
        <div id="root">
          <NavBar lang={lang} dict={dict} />
          <GlobalStorageControls dict={dict} />
          {children}
        </div>
      </body>
    </html>
  )
}
