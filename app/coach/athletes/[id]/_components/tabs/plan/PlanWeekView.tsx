'use client'

import React from 'react'
import { dayName, isToday, toISODate } from '@/lib/utils'
import { SessionCard } from '@/app/coach/athletes/[id]/_components/tabs/plan/SessionCard'
import { DayFeedbackSection } from '@/app/coach/athletes/[id]/_components/tabs/plan/DayFeedbackSection'
import type { CoachFeedbackRow, CoachTrainingSessionRow } from '@/app/coach/athletes/[id]/_components/types'

interface PlanWeekViewProps {
  weekDays: Date[]
  weekSessions: CoachTrainingSessionRow[]
  today: string
  density: 'full' | 'compact'
  showFeedback: boolean
  draggedSessionId: string | null
  dragTargetDate: string | null
  typeStyle: (type: string) => React.CSSProperties
  completionStyle: (session: CoachTrainingSessionRow) => React.CSSProperties
  getTypeLabel: (type: string) => string | undefined
  getSessionFeedback: (sessionId: string) => CoachFeedbackRow | null
  getDateFeedback: (dateStr: string) => CoachFeedbackRow | null
  onSessionClick: (session: CoachTrainingSessionRow) => void
  onAddSession: (date: string) => void
  onDragStart: (sessionId: string, e: React.DragEvent) => void
  onDragEnd: () => void
  onDragOver: (dateStr: string) => void
  onDragLeave: (dateStr: string) => void
  onDrop: (dateStr: string) => void
  onFeedbackClick: (feedback: CoachFeedbackRow) => void
}

export function PlanWeekView({
  weekDays,
  weekSessions,
  today,
  density,
  showFeedback,
  draggedSessionId,
  dragTargetDate,
  typeStyle,
  completionStyle,
  getTypeLabel,
  getSessionFeedback,
  getDateFeedback,
  onSessionClick,
  onAddSession,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onFeedbackClick,
}: PlanWeekViewProps) {
  return (
    <div className="overflow-x-auto pb-20">
      {weekSessions.length === 0 && (
        <div className="mb-4 rounded-2xl px-4 py-5" style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
          <div className="text-sm font-semibold">Brak sesji w tym tygodniu</div>
          <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            Kliknij `+ dodaj` w wybranym dniu albo użyj szablonu, jeśli chcesz szybko ułożyć cały tydzień.
          </div>
        </div>
      )}
      <div className="grid grid-cols-7 gap-2 min-w-[980px]" style={{ minHeight: '260px' }}>
        {weekDays.map(day => {
          const dateStr = toISODate(day)
          const daySessions = weekSessions.filter(s => s.date === dateStr)
          const sessionFeedbacks = daySessions
            .map((session) => ({ session, feedback: getSessionFeedback(session.id) }))
            .filter((item): item is { session: CoachTrainingSessionRow; feedback: CoachFeedbackRow } => !!item.feedback)
          const dateFeedback = getDateFeedback(dateStr)
          const canShowNoFeedback = dateStr < today
          const missingSessionFeedbacks = canShowNoFeedback
            ? daySessions.filter((session) => !getSessionFeedback(session.id))
            : []
          const showNoFeedback = missingSessionFeedbacks.length > 0 && !dateFeedback
          const hasBottomFeedbackSection = sessionFeedbacks.length > 0 || !!dateFeedback || showNoFeedback
          const todayFlag = isToday(dateStr)

          return (
            <div key={dateStr} className="flex flex-col rounded-2xl overflow-hidden"
              onDragOver={(e) => {
                if (!draggedSessionId) return
                e.preventDefault()
                onDragOver(dateStr)
              }}
              onDragLeave={() => onDragLeave(dateStr)}
              onDrop={(e) => {
                if (!draggedSessionId) return
                e.preventDefault()
                onDrop(dateStr)
              }}
              style={{
                border: dragTargetDate === dateStr
                  ? '2px solid rgba(255,92,27,0.75)'
                  : todayFlag
                  ? '2px solid rgba(255,92,27,0.5)'
                  : '1px solid var(--border)',
                background: dragTargetDate === dateStr ? 'rgba(255,92,27,0.05)' : 'var(--bg-card)',
              }}>
              <div className="py-3 px-2 text-center shrink-0"
                style={{ background: todayFlag ? 'rgba(255,92,27,0.10)' : 'var(--bg-elevated)', borderBottom: todayFlag ? '2px solid rgba(255,92,27,0.4)' : '1px solid var(--border)' }}>
                <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: todayFlag ? '#FF5C1B' : 'var(--text-muted)' }}>
                  {dayName(day, true)}
                </div>
                <div className="text-xl font-black leading-tight mt-0.5" style={{ color: todayFlag ? '#FF5C1B' : 'var(--text-primary)' }}>
                  {day.getDate()}
                </div>
              </div>
              <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
                {daySessions.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center py-5 gap-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>Dzień wolny</span>
                  </div>
                )}
                {daySessions.map(session => (
                  <div key={session.id} className="space-y-1.5">
                    <SessionCard
                      session={session}
                      density={density}
                      typeStyle={typeStyle(session.type)}
                      completionStyle={completionStyle(session)}
                      isDragging={draggedSessionId === session.id}
                      typeLabel={getTypeLabel(session.type)}
                      onClick={() => onSessionClick(session)}
                      onDragStart={(e) => onDragStart(session.id, e)}
                      onDragEnd={onDragEnd}
                    />
                  </div>
                ))}
              </div>
              {showFeedback && daySessions.length > 0 && hasBottomFeedbackSection && (
                <div
                  className="px-1.5 pb-3 pt-2 shrink-0"
                  style={{ borderTop: '1px dashed var(--border-strong)' }}
                >
                  <DayFeedbackSection
                    sessionFeedbacks={sessionFeedbacks}
                    dateFeedback={dateFeedback}
                    showNoFeedback={showNoFeedback}
                    totalDaySessions={daySessions.length}
                    onFeedbackClick={onFeedbackClick}
                    compact={false}
                  />
                </div>
              )}
              <div className="p-1.5 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
                <button onClick={() => onAddSession(dateStr)}
                  className="w-full py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors hover:opacity-80"
                  style={{ background: 'rgba(255,92,27,0.06)', color: '#FF5C1B' }}>+ Dodaj</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
