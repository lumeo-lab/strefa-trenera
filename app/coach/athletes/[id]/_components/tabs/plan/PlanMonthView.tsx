'use client'

import React from 'react'
import { formatDate, isToday } from '@/lib/utils'
import { SessionCard } from '@/app/coach/athletes/[id]/_components/tabs/plan/SessionCard'
import { DayFeedbackSection } from '@/app/coach/athletes/[id]/_components/tabs/plan/DayFeedbackSection'
import type { CoachFeedbackRow, CoachTrainingSessionRow } from '@/app/coach/athletes/[id]/_components/types'

interface PlanMonthViewProps {
  calendarWeeks: (string | null)[][]
  monthSessions: CoachTrainingSessionRow[]
  visibleSessions: CoachTrainingSessionRow[]
  today: string
  density: 'full' | 'compact'
  showFeedback: boolean
  selectedDay: string | null
  setSelectedDay: (day: string | null) => void
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

export function PlanMonthView({
  calendarWeeks,
  monthSessions,
  visibleSessions,
  today,
  density,
  showFeedback,
  selectedDay,
  setSelectedDay,
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
}: PlanMonthViewProps) {
  return (
    <div className="pb-20 overflow-x-auto">
      {monthSessions.length === 0 && (
        <div className="mb-4 rounded-2xl px-4 py-5" style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
          <div className="text-sm font-semibold">Brak sesji w tym miesiącu</div>
          <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            Dodaj pierwszy trening z poziomu wybranego dnia albo wróć do widoku tygodnia, jeśli chcesz planować szybciej.
          </div>
        </div>
      )}
      <div className="rounded-2xl overflow-hidden min-w-[980px]" style={{ border: '1px solid var(--border)' }}>
        <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border)' }}>
          {['Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob', 'Nie'].map(d => (
            <div key={d} className="py-3 text-center text-xs font-semibold" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>{d}</div>
          ))}
        </div>
        {calendarWeeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7" style={{ borderBottom: wi < calendarWeeks.length - 1 ? '1px solid var(--border)' : 'none' }}>
            {week.map((dateStr, di) => {
              if (!dateStr) return (
                <div key={di} className="min-h-[11rem] p-2.5" style={{ background: 'var(--bg-base)', borderRight: di < 6 ? '1px solid var(--border)' : 'none' }} />
              )
              const daySessions = visibleSessions.filter(s => s.date === dateStr)
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
              const isSelected = selectedDay === dateStr
              const dayNum = parseInt(dateStr.split('-')[2])
              return (
                <div key={dateStr} className="min-h-[11rem] p-2.5 transition-colors flex flex-col"
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
                    background: dragTargetDate === dateStr
                      ? 'rgba(255,92,27,0.08)'
                      : isSelected
                      ? 'rgba(255,92,27,0.06)'
                      : 'var(--bg-card)',
                    borderRight: di < 6 ? '1px solid var(--border)' : 'none',
                    outline: dragTargetDate === dateStr
                      ? '2px solid rgba(255,92,27,0.75)'
                      : todayFlag
                      ? '2px solid rgba(255,92,27,0.4)'
                      : 'none',
                    outlineOffset: '-2px',
                  }}>
                  <div className="flex items-center justify-between mb-2">
                    <button onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                      className="text-sm font-bold cursor-pointer w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                      style={{
                        background: todayFlag ? '#FF5C1B' : isSelected ? 'rgba(255,92,27,0.15)' : 'transparent',
                        color: todayFlag ? 'white' : isSelected ? '#FF5C1B' : 'var(--text-primary)',
                      }}>
                      {dayNum}
                    </button>
                    <button onClick={e => { e.stopPropagation(); onAddSession(dateStr) }}
                      title="Dodaj sesję"
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs cursor-pointer"
                      style={{ background: 'rgba(255,92,27,0.08)', color: '#FF5C1B' }}>+</button>
                  </div>
                  <div className="space-y-1 flex-1">
                    {daySessions.slice(0, 3).map(s => (
                      <div key={s.id} className="space-y-1">
                        <SessionCard
                          session={s}
                          density={density}
                          typeStyle={typeStyle(s.type)}
                          completionStyle={completionStyle(s)}
                          isDragging={draggedSessionId === s.id}
                          typeLabel={getTypeLabel(s.type)}
                          onClick={() => onSessionClick(s)}
                          onDragStart={(e) => onDragStart(s.id, e)}
                          onDragEnd={onDragEnd}
                        />
                      </div>
                    ))}
                    {daySessions.length > 3 && (
                      <button
                        onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80"
                        style={{ background: 'var(--bg-elevated)', color: '#FF5C1B', border: '1px solid var(--border)' }}
                      >
                        +{daySessions.length - 3} więcej
                      </button>
                    )}
                  </div>
                  {showFeedback && daySessions.length > 0 && hasBottomFeedbackSection && (
                    <div
                      className="mt-auto pt-2"
                      style={{ borderTop: '1px dashed var(--border-strong)' }}
                    >
                      <DayFeedbackSection
                        sessionFeedbacks={sessionFeedbacks}
                        dateFeedback={dateFeedback}
                        showNoFeedback={showNoFeedback}
                        totalDaySessions={daySessions.length}
                        onFeedbackClick={onFeedbackClick}
                        compact={true}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {selectedDay && (
        <SelectedDayPanel
          selectedDay={selectedDay}
          sessions={visibleSessions.filter(s => s.date === selectedDay)}
          typeStyle={typeStyle}
          onAddSession={onAddSession}
          onSessionClick={onSessionClick}
        />
      )}
    </div>
  )
}

// Extracted to module level per React compiler rule
interface SelectedDayPanelProps {
  selectedDay: string
  sessions: CoachTrainingSessionRow[]
  typeStyle: (type: string) => React.CSSProperties
  onAddSession: (date: string) => void
  onSessionClick: (session: CoachTrainingSessionRow) => void
}

function SelectedDayPanel({ selectedDay, sessions, typeStyle, onAddSession, onSessionClick }: SelectedDayPanelProps) {
  return (
    <div className="mt-4 p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-semibold capitalize">{formatDate(selectedDay, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {sessions.length} {sessions.length === 1 ? 'sesja' : 'sesje'}
          </div>
        </div>
        <button onClick={() => onAddSession(selectedDay)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium cursor-pointer"
          style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>+ Dodaj sesję</button>
      </div>
      {sessions.length === 0 ? (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Brak sesji — wolny dzień</div>
      ) : (
        <div className="space-y-2">
          {sessions.map(session => (
            <div key={session.id} className="flex items-center gap-4 p-3 rounded-xl"
              style={typeStyle(session.type)}>
              <div className="flex-1">
                <div className="font-semibold text-sm">{session.title}</div>
                <div className="flex gap-4 text-xs opacity-70 mt-1">
                  {session.planned_distance && <span>📏 {session.planned_distance} km</span>}
                  {session.planned_duration && <span>⏱️ {session.planned_duration} min</span>}
                  {session.planned_pace && <span>⚡ {session.planned_pace}/km</span>}
                </div>
                {session.url && (
                  <a href={session.url} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 mt-1.5 text-xs opacity-80 hover:opacity-100 underline">
                    🔗 {session.url_label || 'Link'}
                  </a>
                )}
              </div>
              <button onClick={() => onSessionClick(session)} className="p-1.5 rounded-lg cursor-pointer text-sm" style={{ background: 'rgba(0,0,0,0.2)' }}>✏️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
