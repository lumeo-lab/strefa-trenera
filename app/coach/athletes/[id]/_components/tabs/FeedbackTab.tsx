'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { DbRow } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { markFeedbackRead, replyFeedback } from '@/lib/actions/feedback'
import { FEELING_LABELS } from '@/lib/constants'

function parseFeedback(fb: DbRow) {
  const textSummary = fb.source !== 'voice' ? (fb.transcript ?? '') : ''
  const voice = fb.ai_analysis || (fb.source === 'voice' ? fb.transcript : '') || ''
  let feeling = '', trainingType = '', distanceKm = '', durationMin = '', intensity = '', notes = ''
  for (const part of textSummary.split(' | ')) {
    if (part.startsWith('Samopoczucie: ')) feeling = part.slice(14)
    else if (part.startsWith('Typ: ')) trainingType = part.slice(5)
    else if (part.startsWith('Dystans: ')) distanceKm = part.slice(9).replace(' km', '')
    else if (part.startsWith('Czas: ')) durationMin = part.slice(6).replace(' min', '')
    else if (part.startsWith('Intensywność: ')) intensity = part.slice(14)
    else if (part.startsWith('Notatka: ')) notes = part.slice(9)
  }
  return { feeling, trainingType, distanceKm, durationMin, intensity, notes, voice }
}

export function FeedbackDetail({ fb }: { fb: DbRow }) {
  const d = parseFeedback(fb)
  const hasText = !!(d.feeling || d.trainingType || d.distanceKm || d.durationMin || d.intensity || d.notes)
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span>{fb.signal === 'green' ? '🟢' : fb.signal === 'yellow' ? '🟡' : '🔴'}</span>
        <span className="text-sm font-semibold">{fb.ai_summary}</span>
        {fb.coach_reply && <span className="text-xs text-green-400 ml-1">✓ Odpowiedziano</span>}
      </div>
      {hasText && (
        <div className="space-y-1.5 text-sm">
          {d.feeling && (
            <div className="flex items-center gap-2">
              <span>{d.feeling}</span>
              <span style={{ color: 'var(--text-muted)' }}>{FEELING_LABELS[d.feeling]}</span>
              {d.intensity && <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>{d.intensity}</span>}
            </div>
          )}
          {(d.trainingType || d.distanceKm || d.durationMin) && (
            <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              {d.trainingType && <span>🏃 {d.trainingType}</span>}
              {d.distanceKm && <span>📏 {d.distanceKm} km</span>}
              {d.durationMin && <span>⏱ {d.durationMin} min</span>}
            </div>
          )}
          {d.notes && <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>"{d.notes}"</p>}
        </div>
      )}
      {d.voice && (
        <p className="text-sm italic"
          style={{ color: 'var(--text-muted)', borderTop: hasText ? '1px solid var(--border)' : 'none', paddingTop: hasText ? '10px' : '0', marginTop: hasText ? '4px' : '0' }}>
          🎤 {d.voice}
        </p>
      )}
      {fb.coach_reply && (
        <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.2)' }}>
          <div className="text-xs font-semibold mb-1" style={{ color: '#2ECC71' }}>💬 Twoja odpowiedź</div>
          <p>{fb.coach_reply}</p>
        </div>
      )}
    </div>
  )
}

interface FeedbackTabProps {
  athleteId: string
  feedbacks: DbRow[]
}

export function FeedbackTab({ athleteId, feedbacks }: FeedbackTabProps) {
  const router = useRouter()
  const [expandedFeedbacks, setExpandedFeedbacks] = useState<Set<string>>(new Set())
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})
  const [replyingSaving, setReplyingSaving] = useState<string | null>(null)

  async function toggleFeedback(fbId: string, read: boolean) {
    setExpandedFeedbacks(prev => {
      const next = new Set(prev)
      next.has(fbId) ? next.delete(fbId) : next.add(fbId)
      return next
    })
    if (!read) {
      await markFeedbackRead(fbId, athleteId)
      startTransition(() => router.refresh())
    }
  }

  async function sendReply(fbId: string) {
    const reply = replyTexts[fbId]?.trim()
    if (!reply || replyingSaving) return
    setReplyingSaving(fbId)
    try {
      const fd = new FormData()
      fd.set('id', fbId)
      fd.set('reply', reply)
      fd.set('athlete_id', athleteId)
      await replyFeedback(null, fd)
      setReplyTexts(prev => ({ ...prev, [fbId]: '' }))
      startTransition(() => router.refresh())
    } finally {
      setReplyingSaving(null)
    }
  }

  return (
    <div className="space-y-2">
      {feedbacks.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-3">💬</div>
          <div className="text-sm font-medium mb-1">Brak feedbacków od zawodnika</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Feedbacki będą się tu pojawiać gdy zawodnik wypełni formularz po treningu</div>
        </Card>
      ) : (
        feedbacks.map(fb => {
          const isExpanded = expandedFeedbacks.has(fb.id)
          const signalDot = fb.signal === 'green' ? '#2ECC71' : fb.signal === 'yellow' ? '#F1C40F' : '#E74C3C'
          return (
            <div key={fb.id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <button
                onClick={() => toggleFeedback(fb.id, fb.read)}
                className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-left"
                style={{ background: 'transparent' }}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: signalDot }} />
                <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {formatDate(fb.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="text-sm font-medium flex-1">{fb.ai_summary || '—'}</span>
                {!fb.read && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(255,92,27,0.15)', color: '#FF5C1B' }}>NOWE</span>
                )}
                <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{isExpanded ? '▲' : '▼'}</span>
              </button>
              {isExpanded && (
                <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="pt-3">
                    <FeedbackDetail fb={fb} />
                  </div>
                  {!fb.coach_reply && (
                    <div className="mt-4 space-y-2">
                      <textarea
                        value={replyTexts[fb.id] ?? ''}
                        onChange={e => setReplyTexts(prev => ({ ...prev, [fb.id]: e.target.value }))}
                        placeholder="Napisz odpowiedź dla zawodnika..."
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
                      />
                      <button
                        onClick={() => sendReply(fb.id)}
                        disabled={!replyTexts[fb.id]?.trim() || replyingSaving === fb.id}
                        className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                        style={{ background: '#FF5C1B', color: 'white', opacity: !replyTexts[fb.id]?.trim() ? 0.5 : 1 }}
                      >
                        {replyingSaving === fb.id ? 'Wysyłanie...' : 'Wyślij odpowiedź'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
