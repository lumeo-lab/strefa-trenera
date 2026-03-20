'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { feedbackLabel } from '@/components/coach/FeedbackCard'
import { dayName, formatDate, getWeekDays, intensityColor, parseFeedbackTranscript, sessionTypeLabel, toISODate } from '@/lib/utils'
import { isSessionCompleted, isSessionSkipped } from '@/lib/session-status'
import { getMonthCalendar, shiftMonth } from '@/lib/calendar'
import { AthleteBottomNav } from './AthleteBottomNav'
import { AthleteSession } from '@/lib/athlete-auth'
import type { AthletePlanFeedbackMap, AthleteTrainingSessionRow } from '@/lib/athlete-data'
import { SESSION_TYPES } from '@/lib/constants'

interface Props {
  athlete: AthleteSession
  sessions: AthleteTrainingSessionRow[]
  feedbacks: AthletePlanFeedbackMap
  today: string
}

export function AthletePlanPage({ athlete, sessions, feedbacks, today }: Props) {
  const router = useRouter()
  const currentMonth = today.slice(0, 7)
  const [view, setView] = useState<'week' | 'month'>('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  const weekDays = getWeekDays(weekOffset)
  const weekStart = toISODate(weekDays[0])
  const weekEnd = toISODate(weekDays[6])

  const calendarWeeks = getMonthCalendar(selectedMonth)

  const weekSessions = sessions.filter(s => s.date >= weekStart && s.date <= weekEnd)
  const weekDone = weekSessions.filter(s => isSessionCompleted(s)).length
  const weekTotal = weekSessions.length

  function goToDay(dateStr: string) {
    const params = dateStr === today ? '' : `?d=${dateStr}`
    router.push(`/u/${athlete.slug}${params}`)
  }

  return (
    <div style={{ color: 'var(--text-primary)', paddingBottom: '90px' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 border-b" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
        <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{athlete.name}</div>
        <h1 className="text-xl font-bold">Plan treningowy</h1>
      </div>

      <div className="p-5">
        {/* View switcher */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <button onClick={() => setView('week')}
              className="px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer"
              style={{ background: view === 'week' ? '#FF5C1B' : 'transparent', color: view === 'week' ? 'white' : 'var(--text-muted)' }}>
              Tydzień
            </button>
            <button onClick={() => setView('month')}
              className="px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer"
              style={{ background: view === 'month' ? '#FF5C1B' : 'transparent', color: view === 'month' ? 'white' : 'var(--text-muted)' }}>
              Miesiąc
            </button>
          </div>

          {view === 'week' ? (
            <div className="flex items-center gap-2">
              <button onClick={() => setWeekOffset(w => w - 1)} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>←</button>
              <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Dziś</button>
              <button onClick={() => setWeekOffset(w => w + 1)} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>→</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedMonth(m => shiftMonth(m, -1))} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>←</button>
              <button onClick={() => setSelectedMonth(currentMonth)} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Dziś</button>
              <button onClick={() => setSelectedMonth(m => shiftMonth(m, 1))} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>→</button>
            </div>
          )}
        </div>

        {/* Week view */}
        {view === 'week' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {formatDate(weekStart, { day: 'numeric', month: 'short' })} — {formatDate(weekEnd, { day: 'numeric', month: 'short' })}
              </div>
              {weekTotal > 0 && (
                <div className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: weekDone === weekTotal ? 'rgba(46,204,113,0.12)' : 'var(--bg-subtle)', color: weekDone === weekTotal ? '#2ECC71' : 'var(--text-muted)' }}>
                  {weekDone}/{weekTotal} ukończonych
                </div>
              )}
            </div>
            {weekDays.map(day => {
              const dateStr = toISODate(day)
              const daySessions = sessions.filter(s => s.date === dateStr)
              const isToday = dateStr === today
              const isPast = dateStr < today
              const fb = feedbacks[dateStr]

              return (
                <button key={dateStr} onClick={() => goToDay(dateStr)}
                  className="w-full text-left rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-[0.99]"
                  style={{ border: isToday ? '2px solid rgba(255,92,27,0.4)' : '1px solid var(--border)', background: 'var(--bg-card)' }}>
                  <div className="px-4 py-3 flex items-center gap-3" style={{ background: isToday ? 'rgba(255,92,27,0.06)' : 'var(--bg-subtle)', borderBottom: daySessions.length > 0 || fb ? '1px solid var(--border)' : 'none' }}>
                    <div className="text-center shrink-0" style={{ minWidth: '40px' }}>
                      <div className="text-xs font-medium capitalize" style={{ color: isToday ? '#FF5C1B' : 'var(--text-muted)' }}>{dayName(day, true)}</div>
                      <div className="text-xl font-black" style={{ color: isToday ? '#FF5C1B' : 'var(--text-primary)' }}>{day.getDate()}</div>
                    </div>
                    {daySessions.length === 0 && !fb && (
                      <span className="text-sm flex-1" style={{ color: 'var(--text-muted)' }}>Wolny dzień</span>
                    )}
                    {daySessions.length > 0 && !fb && (
                      <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>→</span>
                    )}
                  </div>
                  {daySessions.length > 0 && (
                    <div className="p-3 space-y-2">
                      {daySessions.map(s => {
                        const isKey = s.session_priority === 'key'
                        return (
                          <div key={s.id} className={`p-3 rounded-xl ${intensityColor(s.type)}`}
                            style={isKey ? { boxShadow: 'inset 0 0 0 1.5px rgba(255,92,27,0.4)' } : undefined}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold uppercase tracking-wider opacity-70">{sessionTypeLabel(s.type)}</span>
                                  {isKey && <span className="text-xs" title="Kluczowa sesja">⭐</span>}
                                </div>
                                <div className="font-semibold text-sm mt-0.5">{s.title}</div>
                              </div>
                              {isSessionCompleted(s)
                                ? <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full ml-2 shrink-0">✓</span>
                                : isSessionSkipped(s) ? <span className="text-xs px-2 py-0.5 rounded-full ml-2 shrink-0" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>—</span>
                                : isPast ? <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full ml-2 shrink-0">✗</span>
                                : null}
                            </div>
                            {s.description && <p className="text-xs opacity-70 mt-1 line-clamp-1">{s.description}</p>}
                            <div className="flex gap-4 text-xs font-medium opacity-80 mt-2">
                              {s.planned_distance && <span>📏 {s.planned_distance} km</span>}
                              {s.planned_duration && <span>⏱ {s.planned_duration} min</span>}
                              {s.planned_pace && <span>⚡ {s.planned_pace}/km</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {fb && (
                    <div className="px-3 pb-3 space-y-1.5">
                      <div className="p-2.5 rounded-xl text-xs" style={{ background: 'var(--bg-subtle)' }}>
                        <div className="flex items-center gap-1.5">
                          <span>{fb.signal === 'green' ? '🟢' : fb.signal === 'yellow' ? '🟡' : '🔴'}</span>
                          <span className="font-semibold">{feedbackLabel(parseFeedbackTranscript(fb.transcript ?? ''))}</span>
                        </div>
                      </div>
                      {fb.coach_reply && (
                        <div className="p-2.5 rounded-xl text-xs" style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.2)' }}>
                          <span className="font-semibold" style={{ color: '#2ECC71' }}>💬 Trener</span>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Month view */}
        {view === 'month' && (
          <>
            <div className="text-xs font-semibold capitalize mb-3 text-center" style={{ color: 'var(--text-primary)' }}>
              {new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]) - 1, 1).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border)' }}>
                {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map(d => (
                  <div key={d} className="py-2 text-center text-xs font-semibold" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>{d}</div>
                ))}
              </div>
              {calendarWeeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7" style={{ borderBottom: wi < calendarWeeks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  {week.map((dateStr, di) => {
                    if (!dateStr) return <div key={di} className="min-h-16 p-1" style={{ background: 'var(--bg-base)', borderRight: di < 6 ? '1px solid var(--border)' : 'none' }} />
                    const daySessions = sessions.filter(s => s.date === dateStr)
                    const isToday = dateStr === today
                    const dayNum = parseInt(dateStr.split('-')[2])
                    const fb = feedbacks[dateStr]
                    const hasCompleted = daySessions.some(s => isSessionCompleted(s))
                    const hasSkipped = daySessions.some(s => isSessionSkipped(s))
                    return (
                      <button key={dateStr} onClick={() => goToDay(dateStr)}
                        className="min-h-16 p-1 cursor-pointer text-left transition-colors active:opacity-70"
                        style={{
                          background: 'var(--bg-card)',
                          borderRight: di < 6 ? '1px solid var(--border)' : 'none',
                          outline: isToday ? '2px solid rgba(255,92,27,0.4)' : 'none',
                          outlineOffset: '-2px',
                        }}>
                        <div className="flex justify-center mb-0.5">
                          <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: isToday ? '#FF5C1B' : 'transparent', color: isToday ? 'white' : 'var(--text-muted)' }}>
                            {dayNum}
                          </span>
                        </div>
                        {/* Session dots */}
                        {daySessions.length > 0 && (
                          <div className="flex justify-center gap-0.5 mb-0.5">
                            {daySessions.slice(0, 3).map(s => (
                              <div key={s.id} className="w-1.5 h-1.5 rounded-full" style={{
                                background: isSessionCompleted(s) ? '#2ECC71'
                                  : isSessionSkipped(s) ? '#f59e0b'
                                  : intensityColor(s.type).includes('orange') ? '#FF5C1B' : 'var(--text-muted)',
                              }} />
                            ))}
                          </div>
                        )}
                        {/* Session title */}
                        {daySessions.slice(0, 1).map(s => (
                          <div key={s.id} className="text-center truncate px-0.5" style={{ fontSize: '8px', fontWeight: '600', lineHeight: '1.3', color: 'var(--text-muted)' }}>
                            {s.title.length > 8 ? s.title.slice(0, 7) + '…' : s.title}
                          </div>
                        ))}
                        {/* Feedback / coach reply dots */}
                        {(fb || hasCompleted || hasSkipped) && (
                          <div className="flex justify-center gap-1 mt-0.5">
                            {fb && <span style={{ fontSize: '6px' }}>{fb.signal === 'green' ? '🟢' : fb.signal === 'yellow' ? '🟡' : '🔴'}</span>}
                            {fb?.coach_reply && <span style={{ fontSize: '6px' }}>💬</span>}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <span className="text-xs mr-1" style={{ color: 'var(--text-muted)' }}>Legenda:</span>
          {SESSION_TYPES.map(t => (
            <span key={t} className={`text-xs px-2 py-0.5 rounded-full font-medium ${intensityColor(t)}`}>{sessionTypeLabel(t)}</span>
          ))}
        </div>
      </div>

      <AthleteBottomNav slug={athlete.slug} athleteName={athlete.name} athleteAvatar={athlete.avatar} />
    </div>
  )
}
