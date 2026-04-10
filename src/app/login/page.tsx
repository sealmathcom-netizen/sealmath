import { getTranslations } from '@/i18n/server'
import LoginClient from '@/components/client/LoginClient'

export default async function LoginPage() {
  const { lang, dict } = await getTranslations()

  return <LoginClient lang={lang} dict={dict} />
}
