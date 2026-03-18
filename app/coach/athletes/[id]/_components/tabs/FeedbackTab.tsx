'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FeedbackCard } from '@/components/coach/FeedbackCard'
import { markFeedbackRead, replyFeedback } from '@/lib/actions/feedback'
import type { CoachFeedbackRow } from '../types'
import { ProfileEmptyState, ProfileStatusNotice } from '../ProfileStates'

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

  const filterControlStyle = {
    background: 'linear-gradient(180deg, var(--bg-elevated) 0%, rgba(255,92,27,0.04) 100%)',
    color: 'var(--text-primary)',
    border: '1px solid rgba(255,92,27,0.2)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="grid gap-3 md:grid-cols-2 flex-1 min-w-[280px]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5 inline-flex items-center gap-1.5" style={{ color: '#FFB38F' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF5C1B' }} />
              Odpowiedzi i odczyt
            </div>
            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value as typeof readFilter)}
              className="w-full px-3 py-2 rounded-xl text-sm cursor-pointer"
              style={filterControlStyle}
            >
              <option value="all">Wszystkie feedbacki</option>
              <option value="unread">Nieprzeczytane</option>
              <option value="replied">Z odpowiedzią</option>
              <option value="no-reply">Bez odpowiedzi</option>
            </select>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5 inline-flex items-center gap-1.5" style={{ color: '#FFB38F' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF5C1B' }} />
              Sygnał
            </div>
            <select
              value={signalFilter}
              onChange={(e) => setSignalFilter(e.target.value as typeof signalFilter)}
              className="w-full px-3 py-2 rounded-xl text-sm cursor-pointer"
              style={filterControlStyle}
            >
              <option value="all">Wszystkie sygnały</option>
              <option value="red">Czerwone</option>
              <option value="yellow">Żółte</option>
              <option value="green">Zielone</option>
            </select>
          </div>
        </div>
        <div className="text-sm px-3 py-2 rounded-xl" style={{ background: 'rgba(255,92,27,0.06)', color: '#FFB38F', border: '1px solid rgba(255,92,27,0.16)' }}>
          {filteredFeedbacks.length} {filteredFeedbacks.length === 1 ? 'wynik' : filteredFeedbacks.length < 5 ? 'wyniki' : 'wyników'}
        </div>
      </div>

      {statusMessage && (
        <ProfileStatusNotice tone={statusMessage.tone} text={statusMessage.text} />
      )}
      {feedbacks.length === 0 ? (
        <ProfileEmptyState
          icon="💬"
          title="Brak feedbacków od zawodnika"
          description="Gdy zawodnik zacznie zostawiać odczucia do dni lub sesji, cała historia pojawi się właśnie tutaj."
        />
      ) : filteredFeedbacks.length === 0 ? (
        <ProfileEmptyState
          icon="🔎"
          title="Brak feedbacków w tym widoku"
          description="Zmień filtry, aby zobaczyć więcej wpisów albo wróć do pełnej historii feedbacku."
        />
      ) : (
        <div className="space-y-3">
          {filteredFeedbacks.map(fb => (
            <div key={fb.id} className="max-w-4xl">
              <FeedbackCard
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
