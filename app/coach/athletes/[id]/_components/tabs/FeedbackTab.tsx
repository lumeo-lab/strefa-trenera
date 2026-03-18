'use client'

import { startTransition, useState } from 'react'
import { useStatusMessage } from '@/lib/hooks/useStatusMessage'
import { useRouter } from 'next/navigation'
import { FeedbackCard } from '@/components/coach/FeedbackCard'
import { SelectField } from '@/components/ui/SelectField'
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
  const { statusMessage, showStatus, clearStatus } = useStatusMessage()
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'replied' | 'no-reply'>('all')
  const [signalFilter, setSignalFilter] = useState<'all' | 'red' | 'yellow' | 'green'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all')
  const [search, setSearch] = useState('')

  async function handleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  async function handleMarkRead(id: string) {
    if (markingReadId) return
    setMarkingReadId(id)
    clearStatus()
    try {
      const result = await markFeedbackRead(id, athleteId)
      if (result && 'error' in result) {
        showStatus('error', `Nie udało się oznaczyć feedbacku jako przeczytany: ${result.error}`)
        return
      }
      showStatus('success', 'Feedback został oznaczony jako przeczytany.')
      startTransition(() => router.refresh())
    } finally {
      setMarkingReadId(null)
    }
  }

  async function handleReply(id: string) {
    if (!replyText.trim() || submitting) return
    setSubmitting(true)
    clearStatus()
    const fd = new FormData()
    fd.set('id', id)
    fd.set('athlete_id', athleteId)
    fd.set('reply', replyText)
    try {
      const result = await replyFeedback(null, fd)
      if (result && 'error' in result) {
        showStatus('error', `Nie udało się zapisać odpowiedzi: ${result.error}`)
        return
      }
      setReplyingId(null)
      setReplyText('')
      showStatus('success', 'Odpowiedź została zapisana.')
      startTransition(() => router.refresh())
    } finally {
      setSubmitting(false)
    }
  }

  const filteredFeedbacks = feedbacks.filter((fb) => {
    const query = search.trim().toLowerCase()
    if (query) {
      const haystack = [fb.transcript, fb.coach_reply, fb.ai_summary, fb.ai_analysis].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(query)) return false
    }

    if (readFilter === 'unread' && fb.read) return false
    if (readFilter === 'replied' && !fb.coach_reply) return false
    if (readFilter === 'no-reply' && fb.coach_reply) return false

    if (signalFilter !== 'all' && fb.signal !== signalFilter) return false

    const todayDate = new Date()
    const feedbackDate = new Date(`${fb.date}T12:00:00`)
    const diffDays = Math.floor((todayDate.getTime() - feedbackDate.getTime()) / 86400000)
    if (dateFilter === 'today' && diffDays !== 0) return false
    if (dateFilter === '7days' && (diffDays < 0 || diffDays > 6)) return false
    if (dateFilter === '30days' && (diffDays < 0 || diffDays > 29)) return false

    return true
  })

  return (
    <div className="space-y-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="rounded-3xl p-4 md:p-5" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))', border: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <div className="text-sm font-semibold">Filtry feedbacku</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Zawęź listę po statusie odpowiedzi i poziomie sygnału.
              </div>
            </div>
            <div className="text-sm px-3 py-2 rounded-xl shrink-0" style={{ background: 'rgba(255,92,27,0.08)', color: '#FFD2BD', border: '1px solid rgba(255,92,27,0.16)' }}>
              {filteredFeedbacks.length} {filteredFeedbacks.length === 1 ? 'wynik' : filteredFeedbacks.length < 5 ? 'wyniki' : 'wyników'}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl p-3 md:col-span-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--text-muted)' }}>
                Szukaj w feedbacku
              </div>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Szukaj po treści feedbacku lub odpowiedzi trenera"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              />
            </div>
            <div className="rounded-2xl p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--text-muted)' }}>
                Odpowiedzi i odczyt
              </div>
              <SelectField value={readFilter} onChange={(value) => setReadFilter(value as typeof readFilter)}>
                <option value="all">Wszystkie feedbacki</option>
                <option value="unread">Nieprzeczytane</option>
                <option value="replied">Z odpowiedzią</option>
                <option value="no-reply">Bez odpowiedzi</option>
              </SelectField>
            </div>
            <div className="rounded-2xl p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--text-muted)' }}>
                Sygnał
              </div>
              <SelectField value={signalFilter} onChange={(value) => setSignalFilter(value as typeof signalFilter)}>
                <option value="all">Wszystkie sygnały</option>
                <option value="red">Czerwone</option>
                <option value="yellow">Żółte</option>
                <option value="green">Zielone</option>
              </SelectField>
            </div>
            <div className="rounded-2xl p-3 md:col-span-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--text-muted)' }}>
                Zakres dat
              </div>
              <SelectField value={dateFilter} onChange={(value) => setDateFilter(value as typeof dateFilter)}>
                <option value="all">Cały okres</option>
                <option value="today">Tylko dziś</option>
                <option value="7days">Ostatnie 7 dni</option>
                <option value="30days">Ostatnie 30 dni</option>
              </SelectField>
            </div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
