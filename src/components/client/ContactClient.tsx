'use client'

import { useEffect, useState, useRef } from 'react'
import type { Lang } from '../../i18n/translations'

type Props = {
  lang: Lang
  dict: Record<string, string>
  children?: React.ReactNode
}

function hasHebrewText(v: string) {
  return /[\u0590-\u05FF]/.test(v)
}

export default function ContactClient({ dict, children }: Props) {
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
  const fileRef = useRef<HTMLInputElement>(null)

  const send = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (isSending) return
    setIsSending(true)
    setStatus(t('msg_sending'))
    setStatusColor('var(--dark)')

    try {
      const formData = new FormData(e.currentTarget)
      const { sendFeedback } = await import('../../app/actions')
      const result = await sendFeedback(formData)

      if (result.success) {
        setStatus(t('msg_sent_success'))
        setStatusColor('var(--success)')
        setName('')
        setEmail('')
        setMessage('')
        if (fileRef.current) fileRef.current.value = ''
      } else {
        throw new Error(result.error as string)
      }
    } catch (err) {
      console.error('[ContactClient Error]:', err)
      setStatus(t('msg_sent_fail'))
      setStatusColor('var(--error)')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section id="contact-page" className="page active">
        <div className="container" style={{ maxWidth: 500 }}>
          {children}

          <form id="contact-form" onSubmit={send}>
            <label htmlFor="name-input">{t('lbl_name')}</label>
            <input
              id="name-input"
              type="text"
              name="from_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              dir={hasHebrewText(name) ? 'rtl' : 'ltr'}
              style={{ textAlign: hasHebrewText(name) ? 'right' : 'left' }}
            />

            <label htmlFor="email-input">{t('lbl_email')}</label>
            <input
              id="email-input"
              type="email"
              name="reply_to"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir={hasHebrewText(email) ? 'rtl' : 'ltr'}
              style={{ textAlign: hasHebrewText(email) ? 'right' : 'left' }}
            />

            <label htmlFor="message-input">{t('lbl_message')}</label>
            <textarea
              id="message-input"
              name="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              dir={hasHebrewText(message) ? 'rtl' : 'ltr'}
              style={{ textAlign: hasHebrewText(message) ? 'right' : 'left' }}
            />

            <label htmlFor="attachment-input">{t('lbl_attachment')}</label>
            <input
              id="attachment-input"
              type="file"
              name="attachment"
              ref={fileRef}
              accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.svg,.txt"
              style={{ 
                padding: '10px', 
                border: '2px dashed #ccc', 
                borderRadius: '8px',
                background: '#f9f9f9',
                cursor: 'pointer'
              }}
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

