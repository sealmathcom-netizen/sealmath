import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from '@/i18n/server'
import NavBar from '@/components/NavBar'
import { type Lang } from '@/i18n/translations'
import { AxiomWebVitals } from '@/components/AxiomWebVitals'
import 'mathlive/fonts.css'
import '../style.css'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: langParam } = await params
  const { dict, lang } = await getTranslations(langParam as Lang)
  const title = dict.meta_title_home
  const description = dict.meta_description_home

  const baseUrl = 'https://sealmath.com'
  const canonical = lang === 'en' ? baseUrl : `${baseUrl}/${lang}`

  return {
    manifest: '/manifest.json',
    icons: {
      icon: '/favicon.png',
      apple: '/favicon.png',
    },
    title: {
      default: title,
      template: `%s | SealMath`,
    },
    description: description,
    keywords: dict.meta_keywords ? dict.meta_keywords.split(',').map(s => s.trim()) : [],
    alternates: {
      canonical,
      languages: {
        'en': baseUrl,
        'he': `${baseUrl}/he`,
        'nl': `${baseUrl}/nl`,
        'x-default': baseUrl,
      }
    },
    openGraph: {
      type: 'website',
      siteName: 'SealMath',
      title: title,
      description: description,
      url: canonical,
      images: [
        {
          url: `${baseUrl}/favicon.png`,
          width: 512,
          height: 512,
          alt: 'SealMath Logo',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [`${baseUrl}/favicon.png`],
    },
  }
}

export default async function RootLayout({
  children,
  params,
}: Props) {
  const { lang: langParam } = await params
  const { lang, dict } = await getTranslations(langParam as Lang)

  return (
    <html lang={lang} dir={lang === 'he' ? 'rtl' : 'ltr'} suppressHydrationWarning={true}>
      <body>
        <AxiomWebVitals />
        <div id="root">
          <NavBar lang={lang} dict={dict} />
          <main>{children}</main>
          <footer style={{ marginTop: '50px', padding: '30px 20px', borderTop: '1px solid #eee', textAlign: 'center', fontSize: '0.9rem', color: '#7f8c8d' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '10px' }}>
              <Link href={lang === 'en' ? '/privacy' : `/${lang}/privacy`} style={{ color: 'inherit', textDecoration: 'none' }}>{dict.nav_privacy}</Link>
              <Link href={lang === 'en' ? '/terms' : `/${lang}/terms`} style={{ color: 'inherit', textDecoration: 'none' }}>{dict.nav_terms}</Link>
            </div>
            <p>&copy; {new Date().getFullYear()} SealMath. {dict.footer_rights}</p>
          </footer>
        </div>
      </body>
    </html>
  )
}
