'use server'

import { cookies } from 'next/headers'
import { Resend } from 'resend'
import { verifyBypassToken, BYPASS_COOKIES } from '../utils/test-bypass'

export async function setLanguage(lang: string) {
  const cookieStore = await cookies()
  cookieStore.set('preferredLang', lang, { path: '/' })
}

export async function sendFeedback(formData: FormData) {
  const name = formData.get('from_name') as string
  const email = formData.get('reply_to') as string
  const message = formData.get('message') as string
  const file = formData.get('attachment') as File | null

  console.log(`[Contact Action] New message from ${name} (${email})`)

  try {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error('[Contact Action] RESEND_API_KEY is missing!')
      return { success: false, error: 'Server configuration error' }
    }

    const resend = new Resend(resendApiKey)

    // Check for E2E Test Bypass
    const cookieStore = await cookies()
    const bypassToken = cookieStore.get(BYPASS_COOKIES.TOKEN)?.value
    const isBypassed = await verifyBypassToken(bypassToken)

    if (isBypassed) {
      console.log('[Resend Mock]: Test bypass detected. Skipping real email send.')
      // Simulate slight delay for realism
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, mock: true }
    }

    const attachments: any[] = []

    if (file && file.size > 0 && file.name !== 'undefined') {
      console.log(`[Contact Action] Processing attachment: ${file.name} (${file.size} bytes)`)
      // 5MB Limit
      if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: 'File size too large (max 5MB)' }
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      attachments.push({
        filename: file.name,
        content: buffer,
      })
    }

    const { data, error } = await resend.emails.send({
      from: 'SealMath <noreply@sealmath.com>',
      to: ['sealmathcom@gmail.com'],
      subject: `New Feedback from ${name}`,
      replyTo: email || '',
      text: `Message: ${message}\n\nFrom: ${name} (${email})`,
      attachments,
    })

    if (error) {
      console.error('[Contact Action] Resend API Error:', error)
      return { success: false, error: error.message }
    }

    console.log('[Contact Action] Email sent successfully:', data?.id)
    return { success: true, data }
  } catch (error: any) {
    console.error('[Contact Action] Exception:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}
