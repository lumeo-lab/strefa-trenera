'use client'

import { useState } from 'react'
import { intensityColor, sessionTypeLabel, formatDate, getWeekDays, toISODate, dayName } from '@/lib/utils'
import { AthleteBottomNav } from './AthleteBottomNav'
import { AthleteSession } from '@/lib/athlete-auth'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = Record<string, any>

interface Props {
  athlete: AthleteSession
  sessions: DbRow[]
  today: string
}

function shiftMonth(m: string, d: number): string {
  const [y, mo] = m.split('-').map(Number)
  const dt = new Date(y, mo - 1 + d, 1)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}

export function AthletePlanPage({ athlete, sessions, today }: Props) {
  const currentMonth = today.slice(0, 7)
  const [view, setView] = useState<'week' | 'month'>('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  const weekDays = getWeekDays(weekOffset)
  const weekStart = toISODate(weekDays[0])
  const weekEnd = toISODate(weekDays[6])

  const SESSION_TYPES = ['easy', 'interval', 'tempo', 'long', 'rest', 'gym'] as const

  function getMonthCalendar(monthStr: string) {
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

  const calendarWeeks = getMonthCalendar(selectedMonth)

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
            <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              {formatDate(weekStart, { day: 'numeric', month: 'short' })} — {formatDate(weekEnd, { day: 'numeric', month: 'short' })}
            </div>
            {weekDays.map(day => {
              const dateStr = toISODate(day)
              const daySessions = sessions.filter(s => s.date === dateStr)
              const isToday = dateStr === today
              const isPast = dateStr < today

              return (
                <div key={dateStr} className="rounded-2xl overflow-hidden" style={{ border: isToday ? '2px solid rgba(255,92,27,0.4)' : '1px solid var(--border)', background: 'var(--bg-card)' }}>
                  <div className="px-4 py-3 flex items-center gap-3" style={{ background: isToday ? 'rgba(255,92,27,0.06)' : 'var(--bg-subtle)', borderBottom: daySessions.length > 0 ? '1px solid var(--border)' : 'none' }}>
                    <div className="text-center shrink-0" style={{ minWidth: '40px' }}>
                      <div className="text-xs font-medium capitalize" style={{ color: isToday ? '#FF5C1B' : 'var(--text-muted)' }}>{dayName(day, true)}</div>
                      <div className="text-xl font-black" style={{ color: isToday ? '#FF5C1B' : 'var(--text-primary)' }}>{day.getDate()}</div>
                    </div>
                    {daySessions.length === 0 && (
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Wolny dzień</span>
                    )}
                  </div>
                  {daySessions.length > 0 && (
                    <div className="p-3 space-y-2">
                      {daySessions.map(s => (
                        <div key={s.id} className={`p-3 rounded-xl ${intensityColor(s.type)}`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-0.5">{sessionTypeLabel(s.type)}</div>
                              <div className="font-semibold text-sm">{s.title}</div>
                            </div>
                            {s.completed
                              ? <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full ml-2 shrink-0">✓</span>
                              : isPast ? <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full ml-2 shrink-0">✗</span>
                              : null}
                          </div>
                          {s.description && <p className="text-xs opacity-70 mt-1">{s.description}</p>}
                          <div className="flex gap-4 text-xs font-medium opacity-80 mt-2">
                            {s.planned_distance && <span>📏 {s.planned_distance} km</span>}
                            {s.planned_duration && <span>⏱ {s.planned_duration} min</span>}
                            {s.planned_pace && <span>⚡ {s.planned_pace}/km</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Month view */}
        {view === 'month' && (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border)' }}>
              {['Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob', 'Nie'].map(d => (
                <div key={d} className="py-2 text-center text-xs font-semibold" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>{d}</div>
              ))}
            </div>
            {calendarWeeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7" style={{ borderBottom: wi < calendarWeeks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                {week.map((dateStr, di) => {
                  if (!dateStr) return <div key={di} className="min-h-20 p-1" style={{ background: 'var(--bg-base)', borderRight: di < 6 ? '1px solid var(--border)' : 'none' }} />
                  const daySessions = sessions.filter(s => s.date === dateStr)
                  const isToday = dateStr === today
                  const dayNum = parseInt(dateStr.split('-')[2])
                  return (
                    <div key={dateStr} className="min-h-20 p-1.5"
                      style={{
                        background: 'var(--bg-card)',
                        borderRight: di < 6 ? '1px solid var(--border)' : 'none',
                        outline: isToday ? '2px solid rgba(255,92,27,0.4)' : 'none',
                        outlineOffset: '-2px',
                      }}>
                      <div className="flex justify-center mb-1">
                        <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: isToday ? '#FF5C1B' : 'transparent', color: isToday ? 'white' : 'var(--text-muted)' }}>
                          {dayNum}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {daySessions.slice(0, 2).map(s => (
                          <div key={s.id} className={`px-1 py-0.5 rounded text-center ${intensityColor(s.type)}`} style={{ fontSize: '9px', fontWeight: '600', lineHeight: '1.2' }}>
                            {s.title.length > 12 ? s.title.slice(0, 10) + '…' : s.title}
                          </div>
                        ))}
                        {daySessions.length > 2 && <div className="text-center" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>+{daySessions.length - 2}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <span className="text-xs mr-1" style={{ color: 'var(--text-muted)' }}>Legenda:</span>
          {SESSION_TYPES.map(t => (
            <span key={t} className={`text-xs px-2 py-0.5 rounded-full font-medium ${intensityColor(t)}`}>{sessionTypeLabel(t)}</span>
          ))}
        </div>
      </div>

      <AthleteBottomNav slug={athlete.slug} />
    </div>
  )
}
