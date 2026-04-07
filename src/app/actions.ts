'use server'

import { cookies } from 'next/headers'

export async function setLanguage(lang: string) {
  const cookieStore = await cookies()
  cookieStore.set('preferredLang', lang, { path: '/' })
}
