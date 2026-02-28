'use client'
import { useState } from 'react'
import { sessions } from '@/lib/data'
import { getWeekDays, toISODate, dayName, intensityColor, sessionTypeLabel, formatDate, isToday, isPast } from '@/lib/utils'

const ATHLETE_ID = 'a1'

export default function AthletePlanPage() {
  const [weekOffset, setWeekOffset] = useState(0)

  const weekDays = getWeekDays(weekOffset)
  const weekStart = toISODate(weekDays[0])
  const weekEnd = toISODate(weekDays[6])
  const weekSessions = sessions.filter(s => s.athleteId === ATHLETE_ID && s.date >= weekStart && s.date <= weekEnd)

  const weekStats = {
    total: weekSessions.length,
    completed: weekSessions.filter(s => s.completed).length,
    totalKm: weekSessions.reduce((sum, s) => sum + (s.plannedDistance || 0), 0),
  }

  const navButtons = (
    <div className="flex gap-2">
      <button onClick={() => setWeekOffset(w => w - 1)} className="px-3 py-1 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>←</button>
      <button onClick={() => setWeekOffset(0)} className="px-3 py-1 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>Dziś</button>
      <button onClick={() => setWeekOffset(w => w + 1)} className="px-3 py-1 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>→</button>
    </div>
  )

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 lg:px-8 lg:pt-8" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-xl font-bold mb-1">Plan tygodniowy</h1>
        <div className="flex items-center justify-between">
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {formatDate(weekStart, { day: 'numeric', month: 'short' })} — {formatDate(weekEnd, { day: 'numeric', month: 'short' })}
          </div>
          {navButtons}
        </div>
      </div>

      {/* Statsy tygodnia */}
      <div className="flex gap-3 px-5 py-4 lg:px-8">
        {[
          [`${weekStats.total}`, 'sesji'],
          [`${weekStats.completed}/${weekStats.total}`, 'wykonanych'],
          [`${weekStats.totalKm} km`, 'planowo'],
        ].map(([v, l]) => (
          <div key={l} className="flex-1 p-3 rounded-xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="font-bold text-sm">{v}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* ── Mobile: lista pionowa ── */}
      <div className="lg:hidden px-5 space-y-3 pb-4">
        {weekDays.map(day => {
          const dateStr = toISODate(day)
          const daySessions = weekSessions.filter(s => s.date === dateStr)
          const todayFlag = isToday(dateStr)
          const pastFlag = isPast(dateStr)
          return (
            <div key={dateStr} className="rounded-2xl overflow-hidden"
              style={{ border: todayFlag ? '1px solid rgba(255,92,27,0.4)' : '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <div className="flex items-center justify-between px-4 py-3"
                style={{ background: todayFlag ? 'rgba(255,92,27,0.08)' : undefined }}>
                <div className="flex items-center gap-3">
                  <div className={`text-xl font-black ${todayFlag ? 'text-orange-400' : ''}`}>{day.getDate()}</div>
                  <div>
                    <div className="text-sm font-semibold capitalize" style={{ color: todayFlag ? '#FF5C1B' : 'var(--text-primary)' }}>
                      {dayName(day)}
                    </div>
                    {todayFlag && <div className="text-xs" style={{ color: '#FF5C1B' }}>Dziś</div>}
                  </div>
                </div>
                {daySessions.length === 0 && (
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Odpoczynek</div>
                )}
              </div>
              {daySessions.map(session => (
                <div key={session.id} className={`px-4 py-3 border-t ${intensityColor(session.type)}`}
                  style={{ borderTopColor: 'var(--bg-subtle)' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-sm mb-1">{session.title}</div>
                      <div className="text-xs opacity-70 mb-2">{session.description}</div>
                      <div className="flex gap-3 text-xs font-medium opacity-80">
                        {session.plannedDistance && <span>📏 {session.plannedDistance} km</span>}
                        {session.plannedDuration && <span>⏱️ {session.plannedDuration} min</span>}
                        {session.plannedPace && <span>⚡ {session.plannedPace}/km</span>}
                      </div>
                    </div>
                    <div className="shrink-0 ml-3">
                      {session.completed
                        ? <span className="text-green-400 text-sm">✓</span>
                        : pastFlag
                        ? <span className="text-red-400 text-xs">pominięty</span>
                        : <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>{sessionTypeLabel(session.type)}</span>
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* ── Desktop: poziome wiersze ── */}
      <div className="hidden lg:block px-8 pb-8 space-y-2">
        {weekDays.map(day => {
          const dateStr = toISODate(day)
          const daySessions = weekSessions.filter(s => s.date === dateStr)
          const todayFlag = isToday(dateStr)
          const pastFlag = isPast(dateStr)

          return (
            <div key={dateStr}
              className="flex rounded-2xl overflow-hidden"
              style={{
                border: todayFlag ? '2px solid rgba(255,92,27,0.5)' : '1px solid var(--border)',
                background: 'var(--bg-card)',
                minHeight: '80px',
              }}>

              {/* Etykieta dnia */}
              <div className="w-36 shrink-0 flex flex-col items-center justify-center py-4 px-3 text-center"
                style={{
                  background: todayFlag ? 'rgba(255,92,27,0.07)' : 'var(--bg-subtle)',
                  borderRight: '1px solid var(--border)',
                }}>
                <div className="text-xs font-medium capitalize mb-1"
                  style={{ color: todayFlag ? '#FF5C1B' : 'var(--text-muted)' }}>
                  {dayName(day)}
                </div>
                <div className="text-3xl font-black leading-none"
                  style={{ color: todayFlag ? '#FF5C1B' : 'var(--text-primary)' }}>
                  {day.getDate()}
                </div>
                {todayFlag && (
                  <div className="text-xs font-semibold mt-1" style={{ color: '#FF5C1B' }}>Dziś</div>
                )}
              </div>

              {/* Sesje lub odpoczynek */}
              {daySessions.length === 0 ? (
                <div className="flex-1 flex items-center px-8">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Dzień odpoczynku</span>
                </div>
              ) : (
                <div className="flex-1 divide-y" style={{ borderColor: 'var(--border)' }}>
                  {daySessions.map(session => (
                    <div key={session.id}
                      className={`flex items-center gap-6 px-8 py-5 ${intensityColor(session.type)}`}>
                      {/* Info */}
                      <div className="flex-1">
                        <div className="font-semibold mb-0.5">{session.title}</div>
                        <div className="text-sm opacity-70 mb-3">{session.description}</div>
                        <div className="flex flex-wrap gap-5 text-sm font-medium opacity-80">
                          {session.plannedDistance && <span>📏 {session.plannedDistance} km</span>}
                          {session.plannedDuration && <span>⏱️ {session.plannedDuration} min</span>}
                          {session.plannedPace && <span>⚡ {session.plannedPace}/km</span>}
                        </div>
                      </div>
                      {/* Status badge */}
                      <div className="shrink-0">
                        {session.completed ? (
                          <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400">
                            ✓ Wykonany
                          </span>
                        ) : pastFlag ? (
                          <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400">
                            Pominięty
                          </span>
                        ) : (
                          <span className="px-4 py-1.5 rounded-full text-xs font-semibold"
                            style={{ background: 'rgba(255,92,27,0.12)', color: '#FF5C1B' }}>
                            {sessionTypeLabel(session.type)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
