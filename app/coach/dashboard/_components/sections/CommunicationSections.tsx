'use client'

import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { feedbackLabel } from '@/components/coach/FeedbackCard'
import { parseFeedbackTranscript, timeAgo } from '@/lib/utils'
import Link from 'next/link'
import type { DashboardFeedbackRow, DashboardMessageRow } from '../types'

const SIGNAL_COLOR: Record<string, string> = { green: '#2ECC71', yellow: '#F1C40F', red: '#E74C3C' }

// ── MessagesSection ──────────────────────────────────────────────────────────

export function MessagesSection({ messages }: {
  messages: DashboardMessageRow[]
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Ostatnie wiadomości</h3>
        <Link href="/coach/chat" className="text-xs hover:opacity-80" style={{ color: '#FF5C1B' }}>Otwórz czat →</Link>
      </div>
      {messages.length === 0 ? (
        <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
          <div className="text-2xl mb-2">💬</div>
          <div className="text-sm">Brak nowych wiadomości</div>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => {
            const ath = m.athletes
            return (
              <Link key={m.id} href={`/coach/chat?athlete=${m.athlete_id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition-opacity"
                style={{ background: 'var(--bg-elevated)' }}>
                <Avatar initials={ath?.avatar ?? '?'} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{ath?.name ?? '—'}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{m.content}</div>
                </div>
                <div className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{timeAgo(m.created_at)}</div>
              </Link>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// ── FeedbackListSection ──────────────────────────────────────────────────────

export function FeedbackListSection({ feedbacks }: {
  feedbacks: DashboardFeedbackRow[]
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Nieprzeczytany feedback</h3>
        <Link href="/coach/feedback" className="text-xs hover:opacity-80" style={{ color: '#FF5C1B' }}>Wszystkie →</Link>
      </div>
      {feedbacks.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
          <div className="text-3xl mb-2">📥</div>
          <div className="text-sm">Brak nieprzeczytanego feedbacku</div>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((f) => {
            const ath = f.athletes
            const sigColor = SIGNAL_COLOR[f.signal] ?? '#6B7280'
            return (
              <Link key={f.id} href="/coach/feedback"
                className="block p-3 rounded-xl hover:opacity-80 transition-opacity"
                style={{ background: 'var(--bg-elevated)', borderLeft: `3px solid ${sigColor}` }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Avatar initials={ath?.avatar ?? '?'} size="sm" />
                    <span className="text-sm font-medium">{ath?.name ?? '—'}</span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(f.created_at)}</span>
                </div>
                <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                  {feedbackLabel(parseFeedbackTranscript(f.transcript ?? ''))}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </Card>
  )
}
