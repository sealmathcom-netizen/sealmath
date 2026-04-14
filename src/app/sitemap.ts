import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://sealmath.com'
  const currentDate = new Date().toISOString().split('T')[0]
  
  const locales = ['', '/he', '/nl']
  const pages = ['', '/24-challenge', '/capture', '/algebra', '/contact', '/privacy', '/terms']

  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    for (const page of pages) {
      const isHome = page === ''
      const priority = isHome ? 1.0 : (page === '/contact' || page === '/privacy' || page === '/terms' ? 0.5 : 0.9)
      
      entries.push({
        url: `${baseUrl}${locale}${page}`,
        lastModified: currentDate,
        changeFrequency: isHome ? 'weekly' : 'monthly',
        priority,
      })
    }
  }

  return entries
}
