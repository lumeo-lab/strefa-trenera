'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FeedbackCard } from '@/components/coach/FeedbackCard'
import { Card } from '@/components/ui/Card'
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

  async function handleExpand(id: string, isRead: boolean) {
    setExpandedId(prev => prev === id ? null : id)
    if (!isRead) {
      await markFeedbackRead(id, athleteId)
      startTransition(() => router.refresh())
    }
  }

  async function handleReply(id: string) {
    if (!replyText.trim() || submitting) return
    setSubmitting(true)
    const fd = new FormData()
    fd.set('id', id)
    fd.set('athlete_id', athleteId)
    fd.set('reply', replyText)
    await replyFeedback(null, fd)
    setReplyingId(null)
    setReplyText('')
    setSubmitting(false)
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-3">
      {feedbacks.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-3">💬</div>
          <div className="text-sm font-medium mb-1">Brak feedbacków od zawodnika</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Feedbacki będą się tu pojawiać gdy zawodnik wypełni formularz po treningu</div>
        </Card>
      ) : (
        feedbacks.map(fb => (
          <FeedbackCard
            key={fb.id}
            fb={fb}
            isExpanded={expandedId === fb.id}
            isReplying={replyingId === fb.id}
            replyText={replyingId === fb.id ? replyText : ''}
            submitting={submitting}
            showAthleteName={false}
            onExpand={() => handleExpand(fb.id, fb.read)}
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
