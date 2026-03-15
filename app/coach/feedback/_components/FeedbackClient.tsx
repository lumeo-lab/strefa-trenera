'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate, signalColor, signalBg } from '@/lib/utils'
import { replyFeedback, markFeedbackRead } from '@/lib/actions/feedback'
import type { FeedbackRow } from '@/lib/supabase/database.types'
import type { FeedbackSignal } from '@/lib/types'

type FeedbackWithJoins = FeedbackRow & {
  athletes: { id: string; name: string; avatar: string } | null
  training_sessions: { id: string; title: string } | null
}

type Filter = 'all' | 'today' | 'unread' | 'alert'

import { FEELING_LABELS as FEELING_LABEL } from '@/lib/constants'

function parseTranscript(transcript: string) {
  const result: Record<string, string> = {}
  for (const part of (transcript ?? '').split(' | ')) {
    if (part.startsWith('Samopoczucie: ')) result.feeling = part.slice(14)
    else if (part.startsWith('Typ: ')) result.trainingType = part.slice(5)
    else if (part.startsWith('Dystans: ')) result.distance = part.slice(9)
    else if (part.startsWith('Czas: ')) result.duration = part.slice(6)
    else if (part.startsWith('Intensywność: ')) result.intensity = part.slice(14)
    else if (part.startsWith('Notatka: ')) result.notes = part.slice(9)
  }
  return result
}

export function FeedbackClient({ feedbacks: initialFeedbacks }: { feedbacks: FeedbackWithJoins[] }) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]
  const [filter, setFilter] = useState<Filter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const filtered = initialFeedbacks.filter(f => {
    if (filter === 'today') return f.date === today
    if (filter === 'unread') return !f.read
    if (filter === 'alert') return f.signal === 'red' || f.signal === 'yellow'
    return true
  })

  const unreadCount = initialFeedbacks.filter(f => !f.read).length

  async function handleExpand(id: string, isRead: boolean) {
    setExpandedId(prev => prev === id ? null : id)
    if (!isRead) {
      await markFeedbackRead(id)
      startTransition(() => router.refresh())
    }
  }

  async function handleReply(id: string) {
    if (!replyText.trim() || submitting) return
    setSubmitting(true)
    const fd = new FormData()
    fd.set('id', id)
    fd.set('reply', replyText)
    await replyFeedback(null, fd)
    setReplyingId(null)
    setReplyText('')
    setSubmitting(false)
    startTransition(() => router.refresh())
  }

  const filters: { id: Filter; label: string; count?: number }[] = [
    { id: 'all', label: 'Wszystkie', count: initialFeedbacks.length },
    { id: 'today', label: 'Dziś', count: initialFeedbacks.filter(f => f.date === today).length },
    { id: 'unread', label: 'Nieprzeczytane', count: unreadCount },
    { id: 'alert', label: 'Alert', count: initialFeedbacks.filter(f => f.signal !== 'green').length },
  ]

  return (
    <div>
      <CoachTopbar title="Feedback" subtitle={`${unreadCount} nieprzeczytanych`} />

      <div className="p-6 max-w-4xl mx-auto">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
              style={{
                background: filter === f.id ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)',
                color: filter === f.id ? '#FF5C1B' : 'var(--text-muted)',
                border: filter === f.id ? '1px solid rgba(255,92,27,0.3)' : '1px solid var(--border)',
              }}>
              {f.label}
              {f.count !== undefined && <span className="ml-2 text-xs opacity-70">{f.count}</span>}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
              Brak feedbacków w tej kategorii
            </div>
          )}

          {filtered.map(fb => {
            const athlete = fb.athletes
            const session = fb.training_sessions
            const isExpanded = expandedId === fb.id
            const isReplying = replyingId === fb.id
            const isVoice = fb.source === 'voice'
            const parsed = !isVoice ? parseTranscript(fb.transcript ?? '') : {}
            const hasContent = isVoice
              ? !!fb.ai_analysis
              : !!(parsed.feeling || parsed.trainingType || parsed.distance || parsed.duration || parsed.intensity || parsed.notes)

            return (
              <Card key={fb.id} className={`overflow-hidden border-l-4 ${signalColor(fb.signal as FeedbackSignal)} ${!fb.read ? 'ring-1 ring-white/5' : ''}`}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar initials={athlete?.avatar || '?'} size="sm" />

                    <div className="flex-1 min-w-0">
                      {/* Name row */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-semibold text-sm">{athlete?.name}</span>
                        {!fb.read && <Badge variant="orange">Nowy</Badge>}
                        {fb.ai_summary && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${signalBg(fb.signal as FeedbackSignal)}`}>
                            {fb.signal === 'green' ? '🟢' : fb.signal === 'yellow' ? '🟡' : '🔴'} {fb.ai_summary}
                          </span>
                        )}
                        {fb.coach_reply && (
                          <span className="text-xs" style={{ color: '#2ECC71' }}>✓ Odpowiedziano</span>
                        )}
                      </div>
                      {/* Meta row */}
                      <div className="flex items-center gap-1.5 text-xs flex-wrap" style={{ color: 'var(--text-muted)' }}>
                        <span>{isVoice ? '🎤 Głosowy' : fb.source === 'auto' ? '⌚ Zegarek' : '✏️ Tekstowy'}</span>
                        {session && <><span>·</span><span>{session.title}</span></>}
                        <span>·</span>
                        <span>{formatDate(fb.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" onClick={() => handleExpand(fb.id, fb.read)}>
                      {isExpanded ? '▲ Zwiń' : '▼ Rozwiń'}
                    </Button>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="mt-4 space-y-4 pl-11">

                      {/* Text feedback — parsed fields */}
                      {!isVoice && hasContent && (
                        <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-subtle)' }}>
                          {parsed.feeling && (
                            <Row label="Samopoczucie">
                              <span>{parsed.feeling}</span>
                              <span className="ml-1" style={{ color: 'var(--text-muted)' }}>{FEELING_LABEL[parsed.feeling] ?? ''}</span>
                            </Row>
                          )}
                          {parsed.trainingType && <Row label="Typ treningu">{parsed.trainingType}</Row>}
                          {parsed.distance && <Row label="Dystans">{parsed.distance}</Row>}
                          {parsed.duration && <Row label="Czas">{parsed.duration}</Row>}
                          {parsed.intensity && <Row label="Intensywność">{parsed.intensity}</Row>}
                          {parsed.notes && (
                            <div className="pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                              <p className="text-sm italic" style={{ color: 'var(--text-primary)' }}>"{parsed.notes}"</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Voice transcript */}
                      {isVoice && fb.ai_analysis && (
                        <div className="rounded-xl p-3" style={{ background: 'var(--bg-subtle)' }}>
                          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>🎤 Nagranie głosowe</div>
                          <p className="text-sm italic">"{fb.ai_analysis}"</p>
                        </div>
                      )}

                      {/* Watch link */}
                      {fb.watch_link && (
                        <a
                          href={fb.watch_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl transition-opacity hover:opacity-80"
                          style={{ background: 'rgba(255,92,27,0.08)', color: '#FF5C1B', border: '1px solid rgba(255,92,27,0.2)' }}
                        >
                          ⌚ <span className="underline truncate">{fb.watch_link}</span>
                          <span className="shrink-0 ml-auto text-xs opacity-70">↗</span>
                        </a>
                      )}

                      {/* Watch sensor data */}
                      {fb.watch_data && !!(fb.watch_data.avgHR || fb.watch_data.maxHR || fb.watch_data.distance) && (
                        <div className="grid grid-cols-3 gap-2">
                          {([
                            fb.watch_data.avgHR ? ['Tętno śr.', `${fb.watch_data.avgHR} bpm`] : null,
                            fb.watch_data.maxHR ? ['Tętno max', `${fb.watch_data.maxHR} bpm`] : null,
                            fb.watch_data.distance ? ['Dystans', `${fb.watch_data.distance} km`] : null,
                          ] as Array<[string, string] | null>)
                            .filter((x): x is [string, string] => x !== null)
                            .map(([k, v]) => (
                              <div key={k} className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
                                <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{k}</div>
                                <div className="text-sm font-semibold">{v}</div>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Coach reply (read-only) */}
                      {fb.coach_reply && !isReplying && (
                        <div className="rounded-xl p-3" style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.2)' }}>
                          <div className="text-xs font-semibold mb-1.5" style={{ color: '#2ECC71' }}>Twoja odpowiedź</div>
                          <p className="text-sm">{fb.coach_reply}</p>
                        </div>
                      )}

                      {/* Reply form */}
                      {isReplying ? (
                        <div className="space-y-2">
                          <textarea
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder="Napisz odpowiedź do zawodnika..."
                            rows={3}
                            className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleReply(fb.id)} disabled={!replyText || submitting}>
                              {submitting ? 'Wysyłanie...' : 'Wyślij'}
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => setReplyingId(null)}>Anuluj</Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => { setReplyingId(fb.id); setReplyText(fb.coach_reply ?? '') }}>
                          {fb.coach_reply ? '✏️ Edytuj odpowiedź' : '💬 Odpowiedz'}
                        </Button>
                      )}

                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <span className="w-28 shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span>{children}</span>
    </div>
  )
}
