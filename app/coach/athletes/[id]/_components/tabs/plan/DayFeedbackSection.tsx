'use client'

import React from 'react'
import { parseFeedbackTranscript } from '@/lib/utils'
import type { CoachFeedbackRow, CoachTrainingSessionRow } from '../../types'

// --- Feedback helpers ---

export function feedbackToneStyle(feedback: CoachFeedbackRow): React.CSSProperties {
  if (feedback.signal === 'red') {
    return {
      background: 'linear-gradient(180deg, rgba(255,244,244,0.96) 0%, rgba(255,237,237,0.96) 100%)',
      color: '#B42318',
      border: '1px solid rgba(229,72,77,0.28)',
      boxShadow: 'inset 3px 0 0 #E5484D',
    }
  }
  if (feedback.signal === 'yellow') {
    return {
      background: 'linear-gradient(180deg, rgba(255,249,235,0.98) 0%, rgba(255,244,214,0.98) 100%)',
      color: '#B7791F',
      border: '1px solid rgba(234,179,8,0.28)',
      boxShadow: 'inset 3px 0 0 #EAB308',
    }
  }
  return {
    background: 'linear-gradient(180deg, rgba(238,252,244,0.98) 0%, rgba(228,249,237,0.98) 100%)',
    color: '#15803D',
    border: '1px solid rgba(34,197,94,0.24)',
    boxShadow: 'inset 3px 0 0 #22C55E',
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
  background: 'linear-gradient(180deg, rgba(255,244,244,0.96) 0%, rgba(255,237,237,0.96) 100%)',
  color: '#B42318',
  border: '1px solid rgba(229,72,77,0.24)',
  boxShadow: 'inset 3px 0 0 #E5484D',
}

// --- Component ---

interface DayFeedbackSectionProps {
  sessionFeedbacks: Array<{ session: CoachTrainingSessionRow; feedback: CoachFeedbackRow }>
  dateFeedback: CoachFeedbackRow | null
  showNoFeedback: boolean
  missingSessionFeedbacksCount: number
  totalDaySessions: number
  onFeedbackClick: (feedback: CoachFeedbackRow) => void
  compact: boolean
}

export function DayFeedbackSection({
  sessionFeedbacks,
  dateFeedback,
  showNoFeedback,
  missingSessionFeedbacksCount,
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
              <span style={{ color: '#DC2626' }}>✕</span> {missingSessionFeedbacksCount > 1 ? 'brak feedbacku przy części treningów' : 'brak feedbacku'}
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
          <span style={{ color: '#DC2626' }}>✕</span> {missingSessionFeedbacksCount > 1 ? 'brak feedbacku przy części treningów' : 'brak feedbacku'}
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
            className="w-full py-1 rounded-xl text-xs font-medium cursor-pointer flex items-center justify-center gap-1"
            style={feedbackToneStyle(feedback)}
          >
            <span>{feedbackToneIcon(feedback)}</span>
            <span>{formatFeedbackBadgeLabel(session.title, totalDaySessions)}</span>
          </button>
        ))}
        {dateFeedback && (
          <button
            onClick={() => onFeedbackClick(dateFeedback)}
            className="w-full py-1 rounded-xl text-xs font-medium cursor-pointer flex items-center justify-center gap-1"
            style={feedbackToneStyle(dateFeedback)}
          >
            <span>{feedbackToneIcon(dateFeedback)}</span>
            <span>feedback dzienny</span>
          </button>
        )}
        {showNoFeedback && (
          <div
            className="w-full py-1 rounded-xl text-xs font-medium flex items-center justify-center gap-1"
            style={noFeedbackStyle}
          >
            <span style={{ color: '#DC2626' }}>✕</span>
            <span>{missingSessionFeedbacksCount > 1 ? 'brak feedbacku przy części treningów' : 'brak feedbacku'}</span>
          </div>
        )}
      </div>
    )
  }
  if (dateFeedback) {
    return (
      <button
        onClick={() => onFeedbackClick(dateFeedback)}
        className="w-full py-1 rounded-xl text-xs font-medium cursor-pointer flex items-center justify-center gap-1"
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
        className="w-full py-1 rounded-xl text-xs font-medium flex items-center justify-center gap-1"
        style={noFeedbackStyle}
      >
        <span style={{ color: '#DC2626' }}>✕</span>
        <span>{missingSessionFeedbacksCount > 1 ? 'brak feedbacku przy części treningów' : 'brak feedbacku'}</span>
      </div>
    )
  }
  return null
}
