'use client'

import React from 'react'
import { parseFeedbackTranscript } from '@/lib/utils'
import type { CoachFeedbackRow, CoachTrainingSessionRow } from '../../types'

// --- Feedback helpers ---

export function feedbackToneStyle(feedback: CoachFeedbackRow): React.CSSProperties {
  if (feedback.signal === 'red') {
    return {
      background: 'rgba(239,68,68,0.10)',
      color: '#DC2626',
      border: '1px solid rgba(239,68,68,0.18)',
    }
  }
  if (feedback.signal === 'yellow') {
    return {
      background: 'rgba(234,179,8,0.10)',
      color: '#CA8A04',
      border: '1px solid rgba(234,179,8,0.18)',
    }
  }
  return {
    background: 'rgba(34,197,94,0.10)',
    color: '#16A34A',
    border: '1px solid rgba(34,197,94,0.18)',
  }
}

export function feedbackToneIcon(feedback: CoachFeedbackRow): string {
  const parsed = parseFeedbackTranscript(feedback.transcript ?? '')
  return parsed.feeling || '💬'
}

export function formatFeedbackBadgeLabel(sessionTitle: string, totalSessions: number) {
  return totalSessions > 1 ? `feedback · ${sessionTitle}` : 'feedback'
}

const noFeedbackStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--text-muted)',
  border: '1px solid var(--border)',
}

// --- Component ---

interface DayFeedbackSectionProps {
  sessionFeedbacks: Array<{ session: CoachTrainingSessionRow; feedback: CoachFeedbackRow }>
  dateFeedback: CoachFeedbackRow | null
  showNoFeedback: boolean
  totalDaySessions: number
  onFeedbackClick: (feedback: CoachFeedbackRow) => void
  compact: boolean
}

export const DayFeedbackSection = React.memo(function DayFeedbackSection({
  sessionFeedbacks,
  dateFeedback,
  showNoFeedback,
  totalDaySessions,
  onFeedbackClick,
  compact,
}: DayFeedbackSectionProps) {
  if (compact) {
    // Month view: compact style
    if (sessionFeedbacks.length > 0) {
      return (
        <div className="space-y-1.5">
          {sessionFeedbacks.map(({ session, feedback }) => (
            <button
              key={feedback.id}
              onClick={(e) => { e.stopPropagation(); onFeedbackClick(feedback) }}
              className="w-full text-center cursor-pointer rounded-lg py-0.5"
              style={{ fontSize: '10px', ...feedbackToneStyle(feedback) }}
            >
              {feedbackToneIcon(feedback)} {formatFeedbackBadgeLabel(session.title, totalDaySessions)}
            </button>
          ))}
          {dateFeedback && (
            <button
              onClick={(e) => { e.stopPropagation(); onFeedbackClick(dateFeedback) }}
              className="w-full text-center cursor-pointer rounded-lg py-0.5"
              style={{ fontSize: '10px', ...feedbackToneStyle(dateFeedback) }}
            >
              {feedbackToneIcon(dateFeedback)} feedback dzienny
            </button>
          )}
          {showNoFeedback && (
            <div
              className="w-full text-center rounded-lg py-0.5"
              style={{ fontSize: '10px', ...noFeedbackStyle }}
            >
              brak feedbacku
            </div>
          )}
        </div>
      )
    }
    if (dateFeedback) {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); onFeedbackClick(dateFeedback) }}
          className="w-full text-center cursor-pointer rounded-lg py-0.5"
          style={{ fontSize: '10px', ...feedbackToneStyle(dateFeedback) }}
        >
          {feedbackToneIcon(dateFeedback)} feedback
        </button>
      )
    }
    if (showNoFeedback) {
      return (
        <div
          className="w-full text-center rounded-lg py-0.5"
          style={{ fontSize: '10px', ...noFeedbackStyle }}
        >
          brak feedbacku
        </div>
      )
    }
    return null
  }

  // Week view: full style
  if (sessionFeedbacks.length > 0) {
    return (
      <div className="space-y-1.5">
        {sessionFeedbacks.map(({ session, feedback }) => (
          <button
            key={feedback.id}
            onClick={() => onFeedbackClick(feedback)}
            className="w-full py-1 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1"
            style={feedbackToneStyle(feedback)}
          >
            <span>{feedbackToneIcon(feedback)}</span>
            <span>{formatFeedbackBadgeLabel(session.title, totalDaySessions)}</span>
          </button>
        ))}
        {dateFeedback && (
          <button
            onClick={() => onFeedbackClick(dateFeedback)}
            className="w-full py-1 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1"
            style={feedbackToneStyle(dateFeedback)}
          >
            <span>{feedbackToneIcon(dateFeedback)}</span>
            <span>feedback dzienny</span>
          </button>
        )}
        {showNoFeedback && (
          <div
            className="w-full py-1 rounded-xl text-xs flex items-center justify-center gap-1"
            style={noFeedbackStyle}
          >
            brak feedbacku
          </div>
        )}
      </div>
    )
  }
  if (dateFeedback) {
    return (
      <button
        onClick={() => onFeedbackClick(dateFeedback)}
        className="w-full py-1 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1"
        style={feedbackToneStyle(dateFeedback)}
      >
        <span>{feedbackToneIcon(dateFeedback)}</span>
        <span>feedback</span>
      </button>
    )
  }
  if (showNoFeedback) {
    return (
      <div
        className="w-full py-1 rounded-xl text-xs flex items-center justify-center gap-1"
        style={noFeedbackStyle}
      >
        brak feedbacku
      </div>
    )
  }
  return null
})
