'use client'

import { useState } from 'react'
import { intensityColor, sessionTypeLabel, formatDate } from '@/lib/utils'
import { AthleteBottomNav } from './AthleteBottomNav'
import { AthleteSession } from '@/lib/athlete-auth'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = Record<string, any>

interface Props {
  athlete: AthleteSession
  sessions: DbRow[]
}

function shiftMonth(m: string, d: number): string {
  const [y, mo] = m.split('-').map(Number)
  const dt = new Date(y, mo - 1 + d, 1)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(m: string): string {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
}

export function AthleteHistoryPage({ athlete, sessions }: Props) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  const monthSessions = sessions.filter(s => s.date.slice(0, 7) === selectedMonth)
  const totalKm = sessions.reduce((s, sess) => s + (sess.actual_distance || 0), 0)
  const totalMin = sessions.reduce((s, sess) => s + (sess.actual_duration || 0), 0)

  return (
    <div style={{ color: 'var(--text-primary)', paddingBottom: '90px' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 border-b" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
        <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{athlete.name}</div>
        <h1 className="text-xl font-bold">Historia treningów</h1>
      </div>

      <div className="p-5 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Sesji', value: sessions.length },
            { label: 'Łącznie km', value: `${totalKm.toFixed(0)}` },
            { label: 'Łącznie godz.', value: `${Math.floor(totalMin / 60)}h ${totalMin % 60}min` },
          ].map(stat => (
            <div key={stat.label} className="p-3 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-xl font-bold mb-0.5">{stat.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between py-2 px-1">
          <button onClick={() => setSelectedMonth(m => shiftMonth(m, -1))}
            className="px-3 py-1.5 rounded-xl text-sm cursor-pointer"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>←</button>
          <span className="text-sm font-bold capitalize" style={{ color: 'var(--text-primary)' }}>{monthLabel(selectedMonth)}</span>
          <button onClick={() => setSelectedMonth(m => shiftMonth(m, 1))}
            className="px-3 py-1.5 rounded-xl text-sm cursor-pointer"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>→</button>
        </div>

        {monthSessions.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <div className="text-5xl mb-3">📊</div>
            <div>Brak sesji w tym miesiącu</div>
          </div>
        ) : (
          <div className="space-y-2">
            {monthSessions.map(s => (
              <div key={s.id} className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(s.date, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                    <div className="font-semibold text-sm mt-0.5">{s.title}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${intensityColor(s.type)}`}>{sessionTypeLabel(s.type)}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {s.actual_distance && <span>📏 {s.actual_distance} km</span>}
                  {s.actual_duration && <span>⏱️ {s.actual_duration} min</span>}
                  {s.actual_pace && <span>⚡ {s.actual_pace}/km</span>}
                  {s.avg_hr && <span>❤️ {s.avg_hr} bpm</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AthleteBottomNav slug={athlete.slug} />
    </div>
  )
}
