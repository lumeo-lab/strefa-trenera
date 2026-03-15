'use client'

import React, { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  formatDate, intensityColor, sessionTypeLabel,
  getWeekDays, toISODate, dayName, isToday, isPast,
} from '@/lib/utils'
import { SessionType, DbRow } from '@/lib/types'
import { markSessionCompleted } from '@/lib/actions/sessions'
import { useCustomSessionTypes } from '@/lib/useCustomSessionTypes'
import { FeedbackDetail } from './FeedbackTab'
import { Modal } from '@/components/ui/Modal'
import { SessionModal } from '../modals/SessionModal'

function shiftMonth(m: string, d: number): string {
  const [y, mo] = m.split('-').map(Number)
  const dt = new Date(y, mo - 1 + d, 1)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(m: string): string {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
}

function getMonthCalendar(monthStr: string): (string | null)[][] {
  const [y, mo] = monthStr.split('-').map(Number)
  const daysInMonth = new Date(y, mo, 0).getDate()
  const startDow = (new Date(y, mo - 1, 1).getDay() + 6) % 7
  const cells: (string | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${monthStr}-${String(d).padStart(2, '0')}`)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

interface PlanTabProps {
  athleteId: string
  sessions: DbRow[]
  feedbackByDate: Record<string, DbRow>
  today: string
  currentMonth: string
}

export function PlanTab({ athleteId, sessions, feedbackByDate, today, currentMonth }: PlanTabProps) {
  const router = useRouter()
  const { custom: customSessionTypes } = useCustomSessionTypes()

  const [planView, setPlanView] = useState<'week' | 'month'>('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // Session modal
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<DbRow | null>(null)
  const [newSessionDate, setNewSessionDate] = useState('')

  // Feedback detail modal
  const [feedbackModalData, setFeedbackModalData] = useState<DbRow | null>(null)

  function typeClass(type: string): string {
    if (customSessionTypes.find(t => t.key === type)) return ''
    return intensityColor(type as SessionType)
  }
  function typeStyle(type: string): React.CSSProperties {
    const c = customSessionTypes.find(t => t.key === type)
    return c?.color ? { background: c.color + '33', color: c.color } : {}
  }
  function completionStyle(session: DbRow): React.CSSProperties {
    if (session.completed) return { outline: '2px solid rgba(46,204,113,0.6)', outlineOffset: '-2px' }
    return {}
  }

  function openNewSession(date: string) {
    setNewSessionDate(date)
    setEditingSession(null)
    setSessionModalOpen(true)
  }

  function openEditSession(session: DbRow) {
    setEditingSession(session)
    setNewSessionDate('')
    setSessionModalOpen(true)
  }

  // Plan week data
  const weekDays = getWeekDays(weekOffset)
  const weekStart = toISODate(weekDays[0])
  const weekEnd = toISODate(weekDays[6])
  const weekSessions = sessions.filter(s => s.date >= weekStart && s.date <= weekEnd)

  // Plan month data
  const calendarWeeks = getMonthCalendar(selectedMonth)

  return (
    <>
      <div>
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <button
              onClick={() => setPlanView('week')}
              className="px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all"
              style={{ background: planView === 'week' ? '#FF5C1B' : 'transparent', color: planView === 'week' ? 'white' : 'var(--text-muted)' }}
            >📅 Tydzień</button>
            <button
              onClick={() => setPlanView('month')}
              className="px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all"
              style={{ background: planView === 'month' ? '#FF5C1B' : 'transparent', color: planView === 'month' ? 'white' : 'var(--text-muted)' }}
            >📆 Miesiąc</button>
          </div>

          {planView === 'week' ? (
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <button onClick={() => setWeekOffset(w => w - 1)} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>←</button>
                <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Dziś</button>
                <button onClick={() => setWeekOffset(w => w + 1)} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>→</button>
              </div>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {formatDate(weekStart, { day: 'numeric', month: 'short' })} — {formatDate(weekEnd, { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <button onClick={() => setSelectedMonth(m => shiftMonth(m, -1))} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>←</button>
                <button onClick={() => setSelectedMonth(currentMonth)} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Dziś</button>
                <button onClick={() => setSelectedMonth(m => shiftMonth(m, 1))} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>→</button>
              </div>
              <span className="text-sm capitalize font-medium" style={{ color: 'var(--text-muted)' }}>
                {monthLabel(selectedMonth)}
              </span>
            </div>
          )}
        </div>

        {/* Week view */}
        {planView === 'week' && (
          <div className="grid grid-cols-7 gap-2 pb-20" style={{ minHeight: '260px' }}>
            {weekDays.map(day => {
              const dateStr = toISODate(day)
              const daySessions = weekSessions.filter(s => s.date === dateStr)
              const todayFlag = isToday(dateStr)
              const pastFlag = isPast(dateStr)

              return (
                <div key={dateStr} className="flex flex-col rounded-2xl overflow-hidden"
                  style={{ border: todayFlag ? '2px solid rgba(255,92,27,0.5)' : '1px solid var(--border)', background: 'var(--bg-card)' }}>
                  <div className="py-3 px-2 text-center shrink-0"
                    style={{ background: todayFlag ? 'rgba(255,92,27,0.07)' : 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                    <div className="text-xs font-medium capitalize" style={{ color: todayFlag ? '#FF5C1B' : 'var(--text-muted)' }}>
                      {dayName(day, true)}
                    </div>
                    <div className="text-xl font-black leading-tight mt-0.5" style={{ color: todayFlag ? '#FF5C1B' : 'var(--text-primary)' }}>
                      {day.getDate()}
                    </div>
                  </div>
                  <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
                    {daySessions.length === 0 && (
                      <div className="h-full flex items-center justify-center py-4">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>wolny</span>
                      </div>
                    )}
                    {daySessions.map(session => (
                      <div key={session.id} onClick={() => openEditSession(session)}
                        className={`relative p-2 rounded-xl cursor-pointer hover:opacity-80 ${typeClass(session.type)}`}
                        style={{ ...typeStyle(session.type), ...completionStyle(session) }}>
                        {!session.completed && (
                          <button
                            onClick={async e => {
                              e.stopPropagation()
                              await markSessionCompleted(session.id, athleteId)
                              startTransition(() => router.refresh())
                            }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs cursor-pointer opacity-60 hover:opacity-100"
                            style={{ background: 'rgba(0,0,0,0.25)', color: 'white' }}
                            title="Oznacz jako wykonaną"
                          >✓</button>
                        )}
                        <div className="font-semibold text-xs leading-tight mb-1 pr-5">{session.title}</div>
                        {session.description && <div className="text-xs opacity-60 leading-tight mb-1">{session.description}</div>}
                        <div className="flex flex-col gap-0.5 text-xs opacity-75">
                          {session.planned_distance && <span>📏 {session.planned_distance} km</span>}
                          {session.planned_duration && <span>⏱ {session.planned_duration} min</span>}
                          {session.planned_pace && <span>⚡ {session.planned_pace}/km</span>}
                        </div>
                        {session.actual_distance && (
                          <div className="flex flex-col gap-0.5 text-xs mt-1" style={{ color: 'rgba(46,204,113,0.9)' }}>
                            <span>✓ {session.actual_distance} km</span>
                            {session.actual_pace && <span>⚡ {session.actual_pace}/km</span>}
                          </div>
                        )}
                        {session.url && (
                          <a href={session.url} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 mt-1.5 text-xs opacity-80 hover:opacity-100">
                            🔗 <span className="underline">{session.url_label || 'Link'}</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                  {feedbackByDate[dateStr] && (
                    <div className="px-1.5 pb-1 shrink-0">
                      <button onClick={() => setFeedbackModalData(feedbackByDate[dateStr])}
                        className="w-full py-1 rounded-xl text-xs font-medium cursor-pointer flex items-center justify-center gap-1"
                        style={{ background: 'rgba(255,92,27,0.08)', color: '#FF5C1B', border: '1px solid rgba(255,92,27,0.2)' }}>
                        💬 Feedback
                      </button>
                    </div>
                  )}
                  <div className="p-1.5 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
                    <button onClick={() => openNewSession(dateStr)}
                      className="w-full py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors"
                      style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>+ dodaj</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Month view */}
        {planView === 'month' && (
          <div className="pb-20">
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border)' }}>
                {['Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob', 'Nie'].map(d => (
                  <div key={d} className="py-3 text-center text-xs font-semibold" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>{d}</div>
                ))}
              </div>
              {calendarWeeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7" style={{ borderBottom: wi < calendarWeeks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  {week.map((dateStr, di) => {
                    if (!dateStr) return (
                      <div key={di} className="min-h-36 p-2" style={{ background: 'var(--bg-base)', borderRight: di < 6 ? '1px solid var(--border)' : 'none' }} />
                    )
                    const daySessions = sessions.filter(s => s.date === dateStr)
                    const todayFlag = isToday(dateStr)
                    const isSelected = selectedDay === dateStr
                    const dayNum = parseInt(dateStr.split('-')[2])
                    return (
                      <div key={dateStr} className="min-h-36 p-2 transition-colors"
                        style={{
                          background: isSelected ? 'rgba(255,92,27,0.06)' : 'var(--bg-card)',
                          borderRight: di < 6 ? '1px solid var(--border)' : 'none',
                          outline: todayFlag ? '2px solid rgba(255,92,27,0.4)' : 'none',
                          outlineOffset: '-2px',
                        }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <button onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                            className="text-sm font-bold cursor-pointer w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ background: todayFlag ? '#FF5C1B' : 'transparent', color: todayFlag ? 'white' : isSelected ? '#FF5C1B' : 'var(--text-primary)' }}>
                            {dayNum}
                          </button>
                          <button onClick={e => { e.stopPropagation(); openNewSession(dateStr) }}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs cursor-pointer"
                            style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>+</button>
                        </div>
                        <div className="space-y-1">
                          {daySessions.slice(0, 3).map(s => (
                            <div key={s.id} onClick={() => openEditSession(s)}
                              className={`px-1.5 py-1 rounded-lg cursor-pointer hover:opacity-80 ${typeClass(s.type)}`}
                              style={{ ...typeStyle(s.type), ...completionStyle(s) }}>
                              <div className="text-xs font-semibold leading-tight">{s.title}</div>
                              {s.completed && s.actual_distance
                                ? <div style={{ fontSize: '10px', color: 'rgba(46,204,113,0.9)' }}>✓ {s.actual_distance}km</div>
                                : <div className="flex flex-wrap gap-x-2 mt-0.5" style={{ fontSize: '10px', opacity: 0.75 }}>
                                    {s.planned_distance && <span>📏 {s.planned_distance}km</span>}
                                    {s.planned_duration && <span>⏱ {s.planned_duration}min</span>}
                                  </div>
                              }
                            </div>
                          ))}
                          {daySessions.length > 3 && <div className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>+{daySessions.length - 3} więcej</div>}
                        </div>
                        {feedbackByDate[dateStr] && (
                          <button onClick={e => { e.stopPropagation(); setFeedbackModalData(feedbackByDate[dateStr]) }}
                            className="mt-1 w-full text-center cursor-pointer rounded-lg py-0.5"
                            style={{ fontSize: '10px', background: 'rgba(255,92,27,0.1)', color: '#FF5C1B', border: 'none' }}>
                            💬 feedback
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            {selectedDay && (
              <div className="mt-4 p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="font-semibold">{formatDate(selectedDay, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                  <button onClick={() => openNewSession(selectedDay)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium cursor-pointer"
                    style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>+ Dodaj sesję</button>
                </div>
                {sessions.filter(s => s.date === selectedDay).length === 0 ? (
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Brak sesji — wolny dzień</div>
                ) : (
                  <div className="space-y-2">
                    {sessions.filter(s => s.date === selectedDay).map(session => (
                      <div key={session.id} className={`flex items-center gap-4 p-3 rounded-xl ${typeClass(session.type)}`}
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
                        <button onClick={() => openEditSession(session)} className="p-1.5 rounded-lg cursor-pointer text-sm" style={{ background: 'rgba(0,0,0,0.2)' }}>✏️</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Feedback detail modal */}
      <Modal
        open={!!feedbackModalData}
        onClose={() => setFeedbackModalData(null)}
        title="Feedback zawodnika"
        size="sm"
      >
        {feedbackModalData && <FeedbackDetail fb={feedbackModalData} />}
      </Modal>

      {/* Session modal */}
      {sessionModalOpen && (
        <SessionModal
          open={sessionModalOpen}
          onClose={() => setSessionModalOpen(false)}
          athleteId={athleteId}
          today={today}
          editSession={editingSession}
          initialDate={newSessionDate}
        />
      )}
    </>
  )
}
