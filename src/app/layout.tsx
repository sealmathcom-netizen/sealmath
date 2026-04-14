import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from '@/i18n/server'
import NavBar from '@/components/NavBar'
import 'mathlive/fonts.css'

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL('https://sealmath.com'),
    manifest: '/manifest.json',
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { lang, dict } = await getTranslations()

  return (
    <html lang={lang} dir={lang === 'he' ? 'rtl' : 'ltr'} suppressHydrationWarning={true}>
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="stylesheet" href="/style.css" />
        <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js" async defer></script>
      </head>
      <body>
        <div id="root">
          <NavBar lang={lang} dict={dict} />
          <main>{children}</main>
          <footer style={{ marginTop: '50px', padding: '30px 20px', borderTop: '1px solid #eee', textAlign: 'center', fontSize: '0.9rem', color: '#7f8c8d' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '10px' }}>
              <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>{dict.nav_privacy}</Link>
              <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>{dict.nav_terms}</Link>
            </div>
            <p>&copy; {new Date().getFullYear()} SealMath. All rights reserved.</p>
          </footer>
        </div>
      </body>
    </html>
  )
}
