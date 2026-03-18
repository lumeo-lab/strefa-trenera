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

    return true
  })

  return (
    <div className="space-y-3">
      <div className="rounded-2xl p-3 md:p-4" style={{ background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-elevated) 100%)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div>
            <div className="text-sm font-semibold">Filtry feedbacku</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Zawęź widok do rzeczy, które wymagają reakcji lub przeglądu.
            </div>
          </div>
          <div className="text-sm px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            {filteredFeedbacks.length} {filteredFeedbacks.length === 1 ? 'wynik' : filteredFeedbacks.length < 5 ? 'wyniki' : 'wyników'}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Odpowiedzi i odczyt
            </div>
            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value as typeof readFilter)}
              className="w-full px-3 py-2 rounded-xl text-sm cursor-pointer"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <option value="all">Wszystkie feedbacki</option>
              <option value="unread">Nieprzeczytane</option>
              <option value="replied">Z odpowiedzią</option>
              <option value="no-reply">Bez odpowiedzi</option>
            </select>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Sygnał
            </div>
            <select
              value={signalFilter}
              onChange={(e) => setSignalFilter(e.target.value as typeof signalFilter)}
              className="w-full px-3 py-2 rounded-xl text-sm cursor-pointer"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <option value="all">Wszystkie sygnały</option>
              <option value="red">Czerwone</option>
              <option value="yellow">Żółte</option>
              <option value="green">Zielone</option>
            </select>
          </div>
        </div>
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
