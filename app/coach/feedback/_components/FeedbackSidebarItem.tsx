'use client'

import { Badge } from '@/components/ui/Badge'
import { feedbackLabel } from '@/components/coach/FeedbackCard'
import { parseFeedbackTranscript, timeAgo } from '@/lib/utils'
import type { FeedbackWithJoins } from './FeedbackClient'

export function FeedbackSidebarItem({
  fb,
  isSelected,
  onSelect,
}: {
  fb: FeedbackWithJoins
  isSelected: boolean
  onSelect: () => void
}) {
  const parsed = parseFeedbackTranscript(fb.transcript ?? '')
  const label = feedbackLabel(parsed)
  const signalDot = fb.signal === 'green' ? '🟢' : fb.signal === 'yellow' ? '🟡' : '🔴'
  const preview = parsed.notes
    ? parsed.notes.length > 60 ? parsed.notes.slice(0, 60) + '…' : parsed.notes
    : parsed.voice
      ? parsed.voice.length > 60 ? parsed.voice.slice(0, 60) + '…' : parsed.voice
      : ''

  return (
    <button
      className="w-full flex items-start gap-3 px-4 py-3 text-left transition-all cursor-pointer border-b"
      style={{
        background: isSelected ? 'rgba(255,92,27,0.08)' : undefined,
        borderLeft: isSelected ? '3px solid #FF5C1B' : '3px solid transparent',
        borderBottomColor: 'var(--border)',
      }}
      onClick={onSelect}
      aria-label={`Feedback od ${fb.athletes?.name || 'Nieznany'}: ${label}`}
      aria-current={isSelected ? 'true' : undefined}
    >
      <span className="text-sm mt-0.5 shrink-0" aria-hidden="true">{signalDot}</span>
      <div className="flex-1 min-w-0">
        {/* Row 1: name + time */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${!fb.read ? 'font-bold' : 'font-medium'}`}>
            {fb.athletes?.name ?? 'Nieznany'}
          </span>
          <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
            {timeAgo(fb.created_at)}
          </span>
        </div>
        {/* Row 2: label + badges */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs truncate flex-1" style={{ color: 'var(--text-muted)' }}>
            {label}
          </span>
          {!fb.read && <Badge variant="orange">Nowy</Badge>}
          {!fb.coach_reply && fb.read && (
            <span
              className="text-[10px] shrink-0 px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}
            >
              Brak odp.
            </span>
          )}
        </div>
        {/* Row 3: preview */}
        {preview && (
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
            &ldquo;{preview}&rdquo;
          </p>
        )}
      </div>
    </button>
  )
}
