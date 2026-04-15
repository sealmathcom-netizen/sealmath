'use server'

import { cookies } from 'next/headers'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function setLanguage(lang: string) {
  const cookieStore = await cookies()
  cookieStore.set('preferredLang', lang, { path: '/' })
}

export async function sendFeedback(formData: FormData) {
  const name = formData.get('from_name') as string
  const email = formData.get('reply_to') as string
  const message = formData.get('message') as string
  const file = formData.get('attachment') as File | null

  try {
    const attachments: any[] = []

    if (file && file.size > 0) {
      // 5MB Limit
      if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: 'File size too large (max 5MB)' }
      }

      const buffer = Buffer.from(await file.arrayBuffer())
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
      console.error('[Resend Error]:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('[Resend Exception]:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}
