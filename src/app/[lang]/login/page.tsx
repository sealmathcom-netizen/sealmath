import { getTranslations } from '@/i18n/server'
import { Lang } from '@/i18n/translations'
import LoginClient from '@/components/client/LoginClient'

interface Props {
  params: Promise<{ lang: string }>
}

export default async function LoginPage({ params }: Props) {
  const { lang: langParam } = await params
  const { lang, dict } = await getTranslations(langParam as Lang)

  return <LoginClient lang={lang} dict={dict} />
}
