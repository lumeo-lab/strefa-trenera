'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AthleteSession } from '@/lib/athlete-auth'
import type { AthleteInjuryItem } from '@/lib/athlete-data'
import { sendAthleteMessage } from '@/lib/actions/messages'
import { AthleteBottomNav } from './AthleteBottomNav'
import { formatDate } from '@/lib/utils'
import { INPUT_STYLE } from '@/lib/styles'

interface Props {
  athlete: AthleteSession
  injuries: AthleteInjuryItem[]
}

export function AthleteInjuriesPage({ athlete, injuries }: Props) {
  const router = useRouter()
  const [reportOpen, setReportOpen] = useState(false)
  const [reportText, setReportText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState(false)

  const active = injuries.filter(i => !i.ended_at)
  const history = injuries.filter(i => i.ended_at)

  async function handleReport() {
    if (!reportText.trim() || sending) return
    setSending(true)
    setSendError(false)
    const message = `🩹 Zgłoszenie problemu zdrowotnego:\n${reportText.trim()}`
    try {
      await sendAthleteMessage(athlete.slug, message)
      setSent(true)
      setReportText('')
      setTimeout(() => { setSent(false); setReportOpen(false) }, 2000)
      router.refresh()
    } catch {
      setSendError(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ color: 'var(--text-primary)', paddingBottom: '90px' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 border-b" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/u/${athlete.slug}/profile`} className="text-sm" style={{ color: 'var(--text-muted)' }}>← Profil</Link>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Kontuzje</h1>
          <button onClick={() => setReportOpen(true)}
            className="text-xs px-3 py-1.5 rounded-lg cursor-pointer font-semibold"
            style={{ background: '#FF5C1B', color: '#fff', border: 'none' }}>
            Zgłoś problem
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {injuries.length === 0 && !reportOpen && (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <div className="text-4xl mb-3">💪</div>
            <div className="font-medium mb-1">Brak kontuzji</div>
            <div className="text-sm">Jeśli pojawi się problem, zgłoś go trenerowi</div>
          </div>
        )}

        {/* Report form */}
        {reportOpen && (
          <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-sm font-semibold mb-2">Zgłoś problem zdrowotny</div>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              Opisz problem — wiadomość zostanie wysłana do trenera przez czat.
            </p>
            <textarea
              value={reportText}
              onChange={e => setReportText(e.target.value)}
              placeholder="np. Ból prawego kolana od wczoraj, nasila się przy bieganiu..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm resize-none mb-3"
              style={INPUT_STYLE}
            />
            {sent && (
              <div className="text-xs mb-3 px-3 py-2 rounded-lg font-medium" style={{ color: '#2ECC71', background: 'rgba(46,204,113,0.08)' }}>
                ✓ Wysłano do trenera
              </div>
            )}
            {sendError && (
              <div className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ color: '#f87171', background: 'rgba(248,113,113,0.08)' }}>
                Nie udało się wysłać. Spróbuj ponownie.
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setReportOpen(false); setReportText('') }}
                className="flex-1 py-2.5 rounded-xl text-sm cursor-pointer"
                style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: 'none' }}>
                Anuluj
              </button>
              <button onClick={handleReport} disabled={!reportText.trim() || sending || sent}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
                style={{ background: '#FF5C1B', color: '#fff', border: 'none' }}>
                {sending ? 'Wysyłanie...' : sent ? '✓ Wysłano' : 'Wyślij do trenera'}
              </button>
            </div>
          </div>
        )}

        {/* Active injuries */}
        {active.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: '#f59e0b' }}>
              Aktywne ({active.length})
            </div>
            <div className="space-y-2">
              {active.map(i => (
                <div key={i.id} className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">🩹</span>
                    <div className="font-semibold text-sm">{i.name}</div>
                  </div>
                  {i.started_at && (
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Od: {formatDate(i.started_at, { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
              Zakończone ({history.length})
            </div>
            <div className="space-y-2">
              {history.map(i => (
                <div key={i.id} className="p-3 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{i.name}</div>
                    <span className="text-xs" style={{ color: '#2ECC71' }}>wyleczona</span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {i.started_at ? formatDate(i.started_at, { day: 'numeric', month: 'short' }) : '?'}
                    {' → '}
                    {i.ended_at ? formatDate(i.ended_at, { day: 'numeric', month: 'short', year: 'numeric' }) : '?'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AthleteBottomNav slug={athlete.slug} athleteName={athlete.name} athleteAvatar={athlete.avatar} />
    </div>
  )
}
