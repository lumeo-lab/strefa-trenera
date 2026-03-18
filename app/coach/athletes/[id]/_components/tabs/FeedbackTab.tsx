'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FeedbackCard } from '@/components/coach/FeedbackCard'
import { markFeedbackRead, replyFeedback } from '@/lib/actions/feedback'
import type { CoachFeedbackRow } from '../types'

interface FeedbackTabProps {
  athleteId: string
  feedbacks: CoachFeedbackRow[]
}

export function FeedbackTab({ athleteId, feedbacks }: FeedbackTabProps) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [markingReadId, setMarkingReadId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'replied' | 'no-reply'>('all')
  const [signalFilter, setSignalFilter] = useState<'all' | 'red' | 'yellow' | 'green'>('all')
  const [kindFilter, setKindFilter] = useState<'all' | 'session' | 'daily' | 'voice'>('all')

  async function handleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  async function handleMarkRead(id: string) {
    if (markingReadId) return
    setMarkingReadId(id)
    setStatusMessage(null)
    try {
      const result = await markFeedbackRead(id, athleteId)
      if (result && 'error' in result) {
        setStatusMessage({ tone: 'error', text: `Nie udało się oznaczyć feedbacku jako przeczytany: ${result.error}` })
        return
      }
      setStatusMessage({ tone: 'success', text: 'Feedback został oznaczony jako przeczytany.' })
      startTransition(() => router.refresh())
    } finally {
      setMarkingReadId(null)
    }
  }

  async function handleReply(id: string) {
    if (!replyText.trim() || submitting) return
    setSubmitting(true)
    setStatusMessage(null)
    const fd = new FormData()
    fd.set('id', id)
    fd.set('athlete_id', athleteId)
    fd.set('reply', replyText)
    try {
      const result = await replyFeedback(null, fd)
      if (result && 'error' in result) {
        setStatusMessage({ tone: 'error', text: `Nie udało się zapisać odpowiedzi: ${result.error}` })
        return
      }
      setReplyingId(null)
      setReplyText('')
      setStatusMessage({ tone: 'success', text: 'Odpowiedź została zapisana.' })
      startTransition(() => router.refresh())
    } finally {
      setSubmitting(false)
    }
  }

  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (readFilter === 'unread' && fb.read) return false
    if (readFilter === 'replied' && !fb.coach_reply) return false
    if (readFilter === 'no-reply' && fb.coach_reply) return false

    if (signalFilter !== 'all' && fb.signal !== signalFilter) return false

    if (kindFilter === 'session' && !fb.session_id) return false
    if (kindFilter === 'daily' && fb.session_id) return false
    if (kindFilter === 'voice' && !(fb.transcript ?? '').includes('[voice]')) return false

    return true
  })

  const unreadCount = feedbacks.filter((fb) => !fb.read).length
  const withoutReplyCount = feedbacks.filter((fb) => !fb.coach_reply).length
  const redCount = feedbacks.filter((fb) => fb.signal === 'red').length
  const lastReplyAt = feedbacks
    .filter((fb) => fb.coach_reply)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.created_at ?? null

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Nieprzeczytane', value: unreadCount },
          { label: 'Bez odpowiedzi', value: withoutReplyCount },
          { label: 'Czerwone sygnały', value: redCount },
          { label: 'Ostatnia odpowiedź', value: lastReplyAt ? new Date(lastReplyAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }) : '—' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-lg font-bold">{stat.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {([
          ['all', 'Wszystkie'],
          ['unread', 'Nieprzeczytane'],
          ['replied', 'Z odpowiedzią'],
          ['no-reply', 'Bez odpowiedzi'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setReadFilter(value)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
            style={{ background: readFilter === value ? '#FF5C1B' : 'var(--bg-elevated)', color: readFilter === value ? 'white' : 'var(--text-primary)' }}
          >
            {label}
          </button>
        ))}
        {([
          ['all', 'Wszystkie sygnały'],
          ['red', 'Red'],
          ['yellow', 'Yellow'],
          ['green', 'Green'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setSignalFilter(value)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
            style={{ background: signalFilter === value ? '#FF5C1B' : 'var(--bg-elevated)', color: signalFilter === value ? 'white' : 'var(--text-primary)' }}
          >
            {label}
          </button>
        ))}
        {([
          ['all', 'Wszystkie typy'],
          ['session', 'Do sesji'],
          ['daily', 'Dzienne'],
          ['voice', 'Głosowe'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setKindFilter(value)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
            style={{ background: kindFilter === value ? '#FF5C1B' : 'var(--bg-elevated)', color: kindFilter === value ? 'white' : 'var(--text-primary)' }}
          >
            {label}
          </button>
        ))}
      </div>

      {statusMessage && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: statusMessage.tone === 'success' ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)',
            border: `1px solid ${statusMessage.tone === 'success' ? 'rgba(46,204,113,0.25)' : 'rgba(231,76,60,0.25)'}`,
            color: statusMessage.tone === 'success' ? '#2ECC71' : '#E74C3C',
          }}
        >
          {statusMessage.text}
        </div>
      )}
      {feedbacks.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          Brak feedbacków od zawodnika
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          Brak feedbacków pasujących do wybranych filtrów
        </div>
      ) : (
        filteredFeedbacks.map(fb => (
          <FeedbackCard
            key={fb.id}
            fb={fb}
            isExpanded={expandedId === fb.id}
            isReplying={replyingId === fb.id}
            replyText={replyingId === fb.id ? replyText : ''}
            submitting={submitting}
            markingRead={markingReadId === fb.id}
            showAthleteName={false}
            onExpand={() => handleExpand(fb.id)}
            onMarkRead={() => handleMarkRead(fb.id)}
            onReplyStart={() => { setReplyingId(fb.id); setReplyText(fb.coach_reply ?? '') }}
            onReplyChange={setReplyText}
            onReplySubmit={() => handleReply(fb.id)}
            onReplyCancel={() => setReplyingId(null)}
          />
        ))
      )}
    </div>
  )
}
