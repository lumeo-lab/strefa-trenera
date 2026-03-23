'use client'

import { memo } from 'react'
import { Badge } from '@/components/ui/Badge'
import { getFeedbackDisplayData, getFeedbackLabel, getFeedbackPreview } from '@/lib/feedback-helpers'
import { getPriorityColors, getPriorityLabel } from '@/lib/feedback-priority'
import { timeAgo } from '@/lib/utils'
import type { FeedbackWithPriority } from './types'

export const FeedbackSidebarItem = memo(function FeedbackSidebarItem({
  fb,
  isSelected,
  onSelect,
}: {
  fb: FeedbackWithPriority
  isSelected: boolean
  onSelect: () => void
}) {
  const display = getFeedbackDisplayData(fb)
  const label = getFeedbackLabel(display)
  const preview = getFeedbackPreview(display)
  const athleteName = fb.athletes?.name || 'Nieznany'
  const { level, reasons } = fb.priority
  const priorityLabel = getPriorityLabel(level)
  const priorityColors = getPriorityColors(level)

  // Signal color for left border
  const signalBorderColor = fb.signal === 'red' ? '#ef4444'
    : fb.signal === 'yellow' ? '#eab308'
    : isSelected ? '#FF5C1B' : 'transparent'

  // Attention reasons (excluding generic ones that already have badges)
  const attentionReasons = reasons.filter(r => r !== 'Nowy' && r !== 'Brak odpowiedzi')
  const reasonsText = attentionReasons.length > 0 ? attentionReasons.join(' · ') : ''

  return (
    <button
      className="w-full flex items-start gap-2.5 px-3 py-3 text-left transition-all cursor-pointer border-b"
      style={{
        background: isSelected ? 'rgba(255,92,27,0.08)' : undefined,
        borderLeft: `3px solid ${signalBorderColor}`,
        borderBottomColor: 'var(--border)',
      }}
      onClick={onSelect}
      aria-label={`Feedback od ${athleteName}: ${label}`}
      aria-current={isSelected ? 'true' : undefined}
    >
      <div className="flex-1 min-w-0">
        {/* Row 1: name + priority badge + time */}
        <div className="flex items-center gap-1.5">
          <span className={`text-sm truncate flex-1 ${!fb.read ? 'font-bold' : 'font-medium'}`}>
            {athleteName}
          </span>
          {priorityLabel && (
            <span
              className="text-[10px] font-semibold shrink-0 px-1.5 py-0.5 rounded"
              style={{ background: priorityColors.bg, color: priorityColors.text }}
            >
              {priorityLabel}
            </span>
          )}
          <span className="text-[11px] shrink-0" style={{ color: 'var(--text-muted)' }}>
            {timeAgo(fb.created_at)}
          </span>
        </div>
        {/* Row 2: session + label + badges */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs truncate flex-1" style={{ color: 'var(--text-muted)' }}>
            {fb.training_sessions?.title ? `${fb.training_sessions.title} · ${label}` : label}
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
        {/* Row 3: attention reasons or preview */}
        {reasonsText ? (
          <p className="text-xs mt-0.5 truncate" style={{ color: priorityColors.text }}>
            {reasonsText}
          </p>
        ) : preview ? (
          <p className="text-xs mt-0.5 truncate italic" style={{ color: 'var(--text-muted)' }}>
            &ldquo;{preview}&rdquo;
          </p>
        ) : null}
      </div>
    </button>
  )
})
