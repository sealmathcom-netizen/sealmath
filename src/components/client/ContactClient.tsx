'use client'

import { useEffect, useState } from 'react'
import type { Lang } from '../../i18n/translations'

type Props = {
  lang: Lang
  dict: Record<string, string>
}

function hasHebrewText(v: string) {
  return /[\u0590-\u05FF]/.test(v)
}

export default function ContactClient({ dict }: Props) {
  const t = (key: string, params: Record<string, string | number> = {}) => {
    let str = dict[key] ?? key
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, String(v))
    }
    return str
  }

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [statusColor, setStatusColor] = useState<string>('var(--dark)')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    const PUBLIC_KEY = '52VtQNv4lmH3Jg7fP'

    // Wait briefly for the CDN to load.
    let attempts = 0
    const interval = window.setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const emailjs = (window as any).emailjs
      if (emailjs?.init) {
        emailjs.init({ publicKey: PUBLIC_KEY })
        window.clearInterval(interval)
      }
      attempts++
      if (attempts > 25) window.clearInterval(interval)
    }, 200)

    return () => window.clearInterval(interval)
  }, [])

  const send = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (isSending) return
    setIsSending(true)
    setStatus(t('msg_sending'))
    setStatusColor('var(--dark)')

    const SERVICE_ID = 'service_lq91rap'
    const TEMPLATE_ID = 'template_n4ns66m'

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const emailjs = (window as any).emailjs
      if (!emailjs || !emailjs.sendForm) {
        throw new Error('emailjs is not available')
      }

      const formEl = e.currentTarget
      await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formEl)

      setStatus(t('msg_sent_success'))
      setStatusColor('var(--success)')
      setName('')
      setEmail('')
      setMessage('')
    } catch {
      setStatus(t('msg_sent_fail'))
      setStatusColor('var(--error)')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section id="contact-page" className="page active" style={{ display: 'block' }}>
        <div className="container" style={{ maxWidth: 500 }}>
          <h1 style={{ textAlign: 'center', fontSize: '1.8rem', marginTop: 0 }}>{t('contact_title')}</h1>

          <div className="feedback-intro">
            <p>{t('feedback_desc')}</p>
          </div>

          <form id="contact-form" onSubmit={send}>
            <label>{t('lbl_name')}</label>
            <input
              type="text"
              name="from_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              dir={hasHebrewText(name) ? 'rtl' : 'ltr'}
              style={{ textAlign: hasHebrewText(name) ? 'right' : 'left' }}
            />

            <label>{t('lbl_email')}</label>
            <input
              type="email"
              name="reply_to"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir={hasHebrewText(email) ? 'rtl' : 'ltr'}
              style={{ textAlign: hasHebrewText(email) ? 'right' : 'left' }}
            />

            <label>{t('lbl_message')}</label>
            <textarea
              name="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              dir={hasHebrewText(message) ? 'rtl' : 'ltr'}
              style={{ textAlign: hasHebrewText(message) ? 'right' : 'left' }}
            />

            <button type="submit" className="btn-submit" disabled={isSending}>
              {isSending ? t('msg_sending') : t('btn_send')}
            </button>
          </form>

          <div id="status" style={{ marginTop: 12, textAlign: 'center', fontWeight: 'bold', color: statusColor }}>
            {status}
          </div>
        </div>
      </section>
  )
}

