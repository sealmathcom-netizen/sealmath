'use server'

import { cookies } from 'next/headers'
import { Resend } from 'resend'
import { verifyBypassToken, BYPASS_COOKIES } from '../utils/test-bypass'
import { MAX_ATTACHMENT_SIZE_MB } from '../utils/shared-config'
import { createSupabaseServerClient } from '../utils/supabase/server'
import { logToAxiom } from '../utils/logger'

export async function setLanguage(lang: string) {
  const cookieStore = await cookies()
  cookieStore.set('preferredLang', lang, { path: '/' })
}

export async function sendFeedback(formData: FormData) {
  const name = formData.get('from_name') as string
  const email = formData.get('reply_to') as string
  const message = formData.get('message') as string
  const file = formData.get('attachment') as File | null

  // Check for E2E Test Bypass early
  const cookieStore = await cookies()
  const bypassToken = cookieStore.get(BYPASS_COOKIES.TOKEN)?.value
  const isBypassed = await verifyBypassToken(bypassToken)
  const country = cookieStore.get('userCountry')?.value || 'unknown'

  console.log(`[Contact Action] New message from ${name} (${email})`)

  let userId = 'anonymous'
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.auth.getUser()
    userId = data.user?.id || 'anonymous'
  } catch (e) {
    // Ignore auth errors for logging
  }

  if (!isBypassed) {
    await logToAxiom({
      level: 'info',
      message: '[Contact Action] New feedback submission',
      name,
      email,
      userId,
      country,
      source: 'server-action'
    })
  }

  try {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error('[Contact Action] RESEND_API_KEY is missing!')
      if (!isBypassed) {
        await logToAxiom({ level: 'error', message: 'RESEND_API_KEY missing', country, source: 'server-action' })
      }
      return { success: false, error: 'Server configuration error' }
    }

    const resend = new Resend(resendApiKey)

    if (isBypassed) {
      console.log('[Resend Mock]: Test bypass detected. Skipping real email send.')
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, mock: true }
    }

    const attachments: any[] = []

    if (file && file.size > 0 && file.name !== 'undefined') {
      console.log(`[Contact Action] Processing attachment: ${file.name} (${file.size} bytes)`)
      if (file.size > MAX_ATTACHMENT_SIZE_MB * 1024 * 1024) {
        return { success: false, error: `File size too large (max ${MAX_ATTACHMENT_SIZE_MB}MB)` }
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      attachments.push({
        filename: file.name,
        content: buffer,
        contentType: file.type,
      })
    }

    const { data, error } = await resend.emails.send({
      from: 'Feedback Form <noreply@sealmath.com>',
      to: ['sealmathcom@gmail.com'],
      subject: `New Feedback from ${name}`,
      replyTo: email || '',
      text: `Message: ${message}\n\nFrom: ${name} (${email})`,
      attachments,
    })

    if (error) {
      console.error('[Contact Action] Resend API Error:', error)
      if (!isBypassed) {
        await logToAxiom({ level: 'error', message: '[Contact Action] Resend API Error', error, userId, country, source: 'server-action' })
      }
      return { success: false, error: error.message }
    }

    console.log('[Contact Action] Email sent successfully:', data?.id)
    if (!isBypassed) {
      await logToAxiom({ level: 'info', message: '[Contact Action] Email sent successfully', dataId: data?.id, userId, country, source: 'server-action' })
    }
    return { success: true, data }
  } catch (error: any) {
    console.error('[Contact Action] Exception:', error)
    if (!isBypassed) {
      await logToAxiom({ level: 'error', message: '[Contact Action] Exception', error: error.message || error, userId, country, source: 'server-action' })
    }
    return { success: false, error: error.message || 'Unknown error' }
  }
}
