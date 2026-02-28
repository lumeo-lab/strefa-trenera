'use client'
import { useState } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { feedbacks as initialFeedbacks, athletes, sessions } from '@/lib/data'
import { Feedback } from '@/lib/types'
import { formatDate, signalColor, signalBg } from '@/lib/utils'

type Filter = 'all' | 'today' | 'unread' | 'alert'

const sourceIcon: Record<string, string> = { voice: '🎤', text: '✏️', auto: '⌚' }
const sourceLabel: Record<string, string> = { voice: 'Głosówka', text: 'Tekst', auto: 'Auto (zegarek)' }

export default function FeedbackPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const today = '2026-02-28'

  const filtered = feedbacks.filter(f => {
    if (filter === 'today') return f.date === today
    if (filter === 'unread') return !f.read
    if (filter === 'alert') return f.signal === 'red' || f.signal === 'yellow'
    return true
  }).sort((a, b) => b.date.localeCompare(a.date))

  function markRead(id: string) {
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, read: true } : f))
  }

  function handleReply(id: string) {
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, coachReply: replyText, read: true } : f))
    setReplyingId(null)
    setReplyText('')
  }

  const filters: { id: Filter; label: string; count?: number }[] = [
    { id: 'all', label: 'Wszystkie', count: feedbacks.length },
    { id: 'today', label: 'Dziś', count: feedbacks.filter(f => f.date === today).length },
    { id: 'unread', label: 'Nieprzeczytane', count: feedbacks.filter(f => !f.read).length },
    { id: 'alert', label: 'Alert', count: feedbacks.filter(f => f.signal !== 'green').length },
  ]

  return (
    <div>
      <CoachTopbar title="Feedback" subtitle={`${feedbacks.filter(f => !f.read).length} nieprzeczytanych`} />

      <div className="p-6">
        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-6">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${filter === f.id ? 'text-white' : 'hover:text-white'}`}
              style={{
                background: filter === f.id ? 'rgba(255,92,27,0.15)' : 'rgba(255,255,255,0.05)',
                color: filter === f.id ? '#FF5C1B' : '#8A92A8',
                border: filter === f.id ? '1px solid rgba(255,92,27,0.3)' : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {f.label}
              {f.count !== undefined && <span className="ml-2 text-xs opacity-70">{f.count}</span>}
            </button>
          ))}
        </div>

        {/* Feedback list */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12" style={{ color: '#8A92A8' }}>Brak feedbacków w tej kategorii</div>
          )}
          {filtered.map(fb => {
            const athlete = athletes.find(a => a.id === fb.athleteId)
            const session = sessions.find(s => s.id === fb.sessionId)
            const isExpanded = expandedId === fb.id
            const isReplying = replyingId === fb.id

            return (
              <Card key={fb.id} className={`overflow-hidden border-l-4 ${signalColor(fb.signal)} ${!fb.read ? 'ring-1 ring-white/5' : ''}`}>
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <Avatar initials={athlete?.avatar || '?'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm">{athlete?.name}</span>
                        <span className="text-xs" style={{ color: '#8A92A8' }}>{sourceIcon[fb.source]} {sourceLabel[fb.source]}</span>
                        {!fb.read && <Badge variant="orange">Nowy</Badge>}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${signalBg(fb.signal)}`}>
                          {fb.signal === 'green' ? '🟢' : fb.signal === 'yellow' ? '🟡' : '🔴'} {fb.aiSummary}
                        </span>
                      </div>
                      {session && <div className="text-xs" style={{ color: '#8A92A8' }}>{session.title} · {formatDate(fb.date, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' } as any)}</div>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setExpandedId(isExpanded ? null : fb.id)
                          if (!fb.read) markRead(fb.id)
                        }}
                      >
                        {isExpanded ? '▲ Zwiń' : '▼ Rozwiń'}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="mt-4 space-y-3">
                      {/* Transcript */}
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="text-xs font-semibold mb-2" style={{ color: '#8A92A8' }}>Transkrypcja zawodnika</div>
                        <p className="text-sm italic" style={{ color: '#E8EAF0' }}>"{fb.transcript}"</p>
                      </div>

                      {/* AI Analysis */}
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(255,92,27,0.06)', border: '1px solid rgba(255,92,27,0.15)' }}>
                        <div className="text-xs font-semibold mb-2" style={{ color: '#FF5C1B' }}>🤖 Analiza AI</div>
                        <p className="text-sm" style={{ color: '#E8EAF0' }}>{fb.aiAnalysis}</p>
                      </div>

                      {/* Watch data */}
                      {fb.watchData && (
                        <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <div className="text-xs font-semibold mb-2" style={{ color: '#8A92A8' }}>⌚ Dane z zegarka</div>
                          <div className="grid grid-cols-3 gap-2">
                            {([
                              fb.watchData.avgHR ? [`Tętno śr.`, `${fb.watchData.avgHR} bpm`] : null,
                              fb.watchData.maxHR ? [`Tętno max`, `${fb.watchData.maxHR} bpm`] : null,
                              fb.watchData.distance ? [`Dystans`, `${fb.watchData.distance} km`] : null,
                              fb.watchData.pace ? [`Tempo`, `${fb.watchData.pace}/km`] : null,
                              fb.watchData.cadence ? [`Kadencja`, `${fb.watchData.cadence} spm`] : null,
                              fb.watchData.hrv ? [`HRV`, `${fb.watchData.hrv} ms`] : null,
                            ] as Array<[string, string] | null>).filter((x): x is [string, string] => x !== null).map(([k, v]) => (
                              <div key={k} className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <div className="text-xs" style={{ color: '#8A92A8' }}>{k}</div>
                                <div className="text-sm font-semibold">{v}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Coach reply */}
                      {fb.coachReply && (
                        <div className="p-3 rounded-xl" style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.2)' }}>
                          <div className="text-xs font-semibold mb-2" style={{ color: '#2ECC71' }}>Twoja odpowiedź</div>
                          <p className="text-sm">{fb.coachReply}</p>
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
                            style={{ background: '#1E2330', border: '1px solid rgba(255,255,255,0.1)', color: '#E8EAF0' }}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleReply(fb.id)} disabled={!replyText}>Wyślij</Button>
                            <Button variant="secondary" size="sm" onClick={() => setReplyingId(null)}>Anuluj</Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => setReplyingId(fb.id)}>
                          {fb.coachReply ? '✏️ Edytuj odpowiedź' : '💬 Odpowiedz'}
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
