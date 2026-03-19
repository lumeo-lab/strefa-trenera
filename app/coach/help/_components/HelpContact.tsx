'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { INPUT_STYLE } from '@/lib/styles'
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP } from '@/lib/constants'

export function HelpContact() {
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formSubject, setFormSubject] = useState('')
  const [formMsg, setFormMsg] = useState('')
  const [contactState, setContactState] = useState<'idle' | 'success' | 'error'>('idle')
  const [contactMessage, setContactMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      setEmailCopied(true)
      window.setTimeout(() => setEmailCopied(false), 1800)
    } catch {
      setEmailCopied(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setContactState('idle')
    setContactMessage('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          subject: formSubject,
          message: formMsg,
        }),
      })

      const data = (await res.json().catch(() => null)) as { error?: string } | null

      if (!res.ok) {
        throw new Error(data?.error || 'Nie udało się wysłać wiadomości. Spróbuj ponownie.')
      }

      setContactState('success')
      setContactMessage('Wiadomość została wysłana. Odpowiemy możliwie szybko.')
      setFormName('')
      setFormEmail('')
      setFormSubject('')
      setFormMsg('')
    } catch (error) {
      setContactState('error')
      setContactMessage(
        error instanceof Error ? error.message : 'Nie udało się wysłać wiadomości. Spróbuj ponownie.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="font-bold text-lg">Kontakt</h2>
      <p className="text-sm mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>
        Napisz mailowo, przez WhatsApp albo wypełnij formularz poniżej.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div
          className="flex items-center justify-between gap-3 rounded-xl p-4"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-85"
          >
            <span className="text-2xl">📧</span>
            <div className="min-w-0">
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Email</div>
              <div className="truncate text-sm font-medium">{SUPPORT_EMAIL}</div>
            </div>
          </a>
          <button
            type="button"
            onClick={copyEmail}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg cursor-pointer transition-opacity hover:opacity-85"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            aria-label="Skopiuj adres email"
            title={emailCopied ? 'Skopiowano email' : 'Skopiuj email'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 9.75A2.25 2.25 0 0 1 11.25 7.5h7.5A2.25 2.25 0 0 1 21 9.75v9A2.25 2.25 0 0 1 18.75 21h-7.5A2.25 2.25 0 0 1 9 18.75v-9Z" stroke="currentColor" strokeWidth="1.8" />
              <path d="M15 7.5V5.25A2.25 2.25 0 0 0 12.75 3h-7.5A2.25 2.25 0 0 0 3 5.25v9a2.25 2.25 0 0 0 2.25 2.25H9" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </button>
        </div>
        <a
          href={SUPPORT_WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl p-4 transition-opacity hover:opacity-85"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          <span className="text-2xl">💬</span>
          <div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>WhatsApp / telefon</div>
            <div className="text-sm font-medium">{SUPPORT_PHONE}</div>
          </div>
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
        <span>Odpowiadamy zazwyczaj w ciągu 24 godzin w dni robocze.</span>
        {emailCopied ? <span style={{ color: '#22C55E' }}>Adres email skopiowany.</span> : null}
      </div>

      {/* Contact form */}
      <div style={{ borderTop: '1px solid var(--border)' }} className="pt-5">
        <h3 className="font-semibold text-sm mb-4">Napisz do nas</h3>
        {contactState === 'success' ? (
          <div className="rounded-xl p-4" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.22)' }}>
            <div className="font-medium">Wiadomość została wysłana.</div>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{contactMessage}</p>
            <button
              type="button"
              onClick={() => { setContactState('idle'); setContactMessage('') }}
              className="mt-4 text-sm cursor-pointer"
              style={{ color: '#FF5C1B', background: 'none', border: 'none' }}
            >
              Wyślij kolejną wiadomość
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Imię i nazwisko</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} required
                  placeholder="np. Anna Kowalska" className="w-full rounded-xl px-3 py-2.5 text-sm" style={INPUT_STYLE} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Email</label>
                <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required
                  placeholder="twoj@email.com" className="w-full rounded-xl px-3 py-2.5 text-sm" style={INPUT_STYLE} />
              </div>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Temat</label>
              <input value={formSubject} onChange={(e) => setFormSubject(e.target.value)} required
                placeholder="Krótko opisz, czego dotyczy wiadomość" className="w-full rounded-xl px-3 py-2.5 text-sm" style={INPUT_STYLE} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Wiadomość</label>
              <textarea value={formMsg} onChange={(e) => setFormMsg(e.target.value)} required rows={5}
                placeholder="Opisz swój problem lub pytanie..." className="w-full resize-none rounded-xl px-3 py-2.5 text-sm" style={INPUT_STYLE} />
            </div>
            {contactState === 'error' && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.22)', color: '#DC2626' }}>
                {contactMessage}
              </div>
            )}
            <button type="submit" disabled={isSubmitting}
              className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
              style={{ background: '#FF5C1B', border: 'none' }}>
              {isSubmitting ? 'Wysyłanie...' : 'Wyślij wiadomość'}
            </button>
          </form>
        )}
      </div>
    </Card>
  )
}
