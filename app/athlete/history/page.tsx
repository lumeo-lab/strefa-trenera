'use client'
import { useState } from 'react'
import { sessions, feedbacks } from '@/lib/data'
import { intensityColor } from '@/lib/utils'

const ATHLETE_ID = 'a1'
const CURRENT_MONTH = '2026-02'

function shiftMonth(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
}

function formatDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function AthleteHistoryPage() {
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH)

  const monthSessions = sessions
    .filter(s => s.athleteId === ATHLETE_ID && s.completed && s.date.startsWith(selectedMonth))
    .sort((a, b) => b.date.localeCompare(a.date))

  const totalKm = monthSessions.reduce((sum, s) => sum + (s.actualDistance || 0), 0)
  const avgHR = monthSessions.filter(s => s.avgHR).length > 0
    ? monthSessions.filter(s => s.avgHR).reduce((sum, s, _, arr) => sum + (s.avgHR || 0) / arr.length, 0)
    : 0

  // Weekly km within the selected month
  const [y, mo] = selectedMonth.split('-').map(Number)
  const daysInMonth = new Date(y, mo, 0).getDate()
  const weekRanges = [
    { label: '1–7', start: 1, end: 7 },
    { label: '8–14', start: 8, end: 14 },
    { label: '15–21', start: 15, end: 21 },
    { label: '22–' + daysInMonth, start: 22, end: daysInMonth },
  ]
  const weekKm = weekRanges.map(({ start, end }) =>
    monthSessions
      .filter(s => { const day = parseInt(s.date.split('-')[2]); return day >= start && day <= end })
      .reduce((sum, s) => sum + (s.actualDistance || 0), 0)
  )
  const maxWeekKm = Math.max(...weekKm, 1)

  const isFuture = selectedMonth > CURRENT_MONTH

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header z nawigacją miesięcy */}
      <div className="px-5 pt-12 pb-5 lg:px-8 lg:pt-8" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-xl font-bold mb-4">Historia treningów</h1>
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setSelectedMonth(m => shiftMonth(m, -1))}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shrink-0"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
          >←</button>
          <div className="text-center flex-1">
            <div className="text-base font-semibold capitalize">{monthLabel(selectedMonth)}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {monthSessions.length} {monthSessions.length === 1 ? 'trening' : monthSessions.length < 5 ? 'treningi' : 'treningów'}
            </div>
          </div>
          <button
            onClick={() => setSelectedMonth(m => shiftMonth(m, 1))}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shrink-0"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
          >→</button>
        </div>
      </div>

      {isFuture ? (
        <div className="px-5 lg:px-8 py-16 text-center">
          <div className="text-4xl mb-3">📅</div>
          <div className="font-semibold mb-1">Brak danych</div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Nie ma jeszcze treningów z tego miesiąca</div>
        </div>
      ) : (
        <>
          {/* Stats miesięczne */}
          <div className="grid grid-cols-3 gap-3 px-5 py-4 lg:px-8">
            {[
              ['🏃', monthSessions.length, 'treningów'],
              ['📏', `${totalKm.toFixed(0)} km`, 'łącznie'],
              ['❤️', avgHR > 0 ? `${Math.round(avgHR)} bpm` : '—', 'śr. tętno'],
            ].map(([icon, value, label]) => (
              <div key={label as string} className="p-3 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-xl mb-1">{icon}</div>
                <div className="text-base font-bold">{value}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Wykres słupkowy — km wg tygodnia */}
          {monthSessions.length > 0 && (
            <div className="mx-5 mb-4 p-4 rounded-2xl lg:mx-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>km wg tygodnia</div>
              <div className="flex items-end gap-3 h-20">
                {weekRanges.map((range, i) => {
                  const km = weekKm[i]
                  const heightPct = (km / maxWeekKm) * 100
                  return (
                    <div key={range.label} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-xs font-semibold" style={{ color: km > 0 ? 'var(--text-primary)' : 'transparent' }}>
                        {km > 0 ? `${km.toFixed(0)}` : '0'}
                      </div>
                      <div className="w-full rounded-t-lg transition-all"
                        style={{ height: km > 0 ? `${Math.max(heightPct, 8)}%` : '4px', background: km > 0 ? '#FF5C1B' : 'var(--border)' }} />
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{range.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Lista sesji */}
          {monthSessions.length === 0 ? (
            <div className="px-5 lg:px-8 py-12 text-center">
              <div className="text-4xl mb-3">🏃</div>
              <div className="font-semibold mb-1">Brak treningów</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>W tym miesiącu nie zapisano żadnych treningów</div>
            </div>
          ) : (
            <div className="px-5 lg:px-8 pb-4 space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {monthSessions.map(session => {
                const fb = feedbacks.find(f => f.sessionId === session.id)
                return (
                  <div key={session.id} className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className={`px-4 py-3 ${intensityColor(session.type)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{session.title}</span>
                        <span className="text-xs opacity-70">{formatDay(session.date)}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs opacity-70">
                        {session.actualDistance && <span>📏 {session.actualDistance} km</span>}
                        {session.actualDuration && <span>⏱️ {session.actualDuration} min</span>}
                        {session.actualPace && <span>⚡ {session.actualPace}/km</span>}
                        {session.avgHR && <span>❤️ {session.avgHR} bpm</span>}
                      </div>
                    </div>
                    {fb && (
                      <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--bg-subtle)' }}>
                        <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                          {fb.source === 'voice' ? '🎤' : fb.source === 'text' ? '✏️' : '⌚'} Twój feedback
                        </div>
                        <div className="text-xs line-clamp-2" style={{ color: 'var(--text-primary)' }}>{fb.aiSummary}</div>
                        {fb.coachReply && (
                          <div className="mt-2 text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(46,204,113,0.08)', color: '#2ECC71' }}>
                            💬 Trener: {fb.coachReply}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
