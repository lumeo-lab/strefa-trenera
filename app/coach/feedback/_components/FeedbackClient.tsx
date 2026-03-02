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

type Filter = 'all' | 'today' | 'unread' | 'alert'

const sourceIcon: Record<string, string> = { voice: '🎤', text: '✏️', auto: '⌚' }
const sourceLabel: Record<string, string> = { voice: 'Głosówka', text: 'Tekst', auto: 'Auto (zegarek)' }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FeedbackClient({ feedbacks: initialFeedbacks }: { feedbacks: any[] }) {
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

      <div className="p-6">
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
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Brak feedbacków w tej kategorii</div>
          )}
          {filtered.map(fb => {
            const athlete = fb.athletes
            const session = fb.training_sessions
            const isExpanded = expandedId === fb.id
            const isReplying = replyingId === fb.id

            return (
              <Card key={fb.id} className={`overflow-hidden border-l-4 ${signalColor(fb.signal)} ${!fb.read ? 'ring-1 ring-white/5' : ''}`}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar initials={athlete?.avatar || '?'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm">{athlete?.name}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{sourceIcon[fb.source]} {sourceLabel[fb.source]}</span>
                        {!fb.read && <Badge variant="orange">Nowy</Badge>}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${signalBg(fb.signal)}`}>
                          {fb.signal === 'green' ? '🟢' : fb.signal === 'yellow' ? '🟡' : '🔴'} {fb.ai_summary}
                        </span>
                      </div>
                      {session && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{session.title} · {formatDate(fb.date, { day: 'numeric', month: 'short' })}</div>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleExpand(fb.id, fb.read)}>
                      {isExpanded ? '▲ Zwiń' : '▼ Rozwiń'}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3">
                      <div className="p-3 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
                        <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Transkrypcja zawodnika</div>
                        <p className="text-sm italic">"{fb.transcript}"</p>
                      </div>
                      {fb.ai_analysis && (
                        <div className="p-3 rounded-xl" style={{ background: 'rgba(255,92,27,0.06)', border: '1px solid rgba(255,92,27,0.15)' }}>
                          <div className="text-xs font-semibold mb-2" style={{ color: '#FF5C1B' }}>🤖 Analiza AI</div>
                          <p className="text-sm">{fb.ai_analysis}</p>
                        </div>
                      )}
                      {fb.watch_data && (
                        <div className="p-3 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
                          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>⌚ Dane z zegarka</div>
                          <div className="grid grid-cols-3 gap-2">
                            {([
                              fb.watch_data.avgHR ? ['Tętno śr.', `${fb.watch_data.avgHR} bpm`] : null,
                              fb.watch_data.maxHR ? ['Tętno max', `${fb.watch_data.maxHR} bpm`] : null,
                              fb.watch_data.distance ? ['Dystans', `${fb.watch_data.distance} km`] : null,
                            ] as Array<[string, string] | null>).filter((x): x is [string, string] => x !== null).map(([k, v]) => (
                              <div key={k} className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
                                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{k}</div>
                                <div className="text-sm font-semibold">{v}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {fb.coach_reply && (
                        <div className="p-3 rounded-xl" style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.2)' }}>
                          <div className="text-xs font-semibold mb-2" style={{ color: '#2ECC71' }}>Twoja odpowiedź</div>
                          <p className="text-sm">{fb.coach_reply}</p>
                        </div>
                      )}
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
                        <Button variant="secondary" size="sm" onClick={() => setReplyingId(fb.id)}>
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
