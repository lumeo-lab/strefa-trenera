'use client'

import { useState, Fragment } from 'react'
import { Card } from '@/components/ui/Card'
import { formatDate, intensityColor, sessionTypeLabel } from '@/lib/utils'
import { SessionType, DbRow } from '@/lib/types'
import { FeedbackDetail } from './FeedbackTab'
import { SessionTypeDef } from '@/lib/useCustomSessionTypes'

function shiftMonth(m: string, d: number): string {
  const [y, mo] = m.split('-').map(Number)
  const dt = new Date(y, mo - 1 + d, 1)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(m: string): string {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
}

interface HistoryTabProps {
  sessions: DbRow[]
  feedbacks: DbRow[]
  feedbackBySession: Record<string, DbRow>
  feedbackByDate: Record<string, DbRow>
  today: string
  currentMonth: string
  allSessionTypes: SessionTypeDef[]
  customSessionTypes: SessionTypeDef[]
}

export function HistoryTab({ sessions, feedbacks, feedbackBySession, feedbackByDate, today, currentMonth, allSessionTypes, customSessionTypes }: HistoryTabProps) {
  const [historyMonth, setHistoryMonth] = useState(currentMonth)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  function toggleRow(sessionId: string) {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(sessionId)) { next.delete(sessionId) } else { next.add(sessionId) }
      return next
    })
  }

  function typeClass(type: string): string {
    if (customSessionTypes.find(t => t.key === type)) return ''
    return intensityColor(type as SessionType)
  }
  function typeStyle(type: string): React.CSSProperties {
    const c = customSessionTypes.find(t => t.key === type)
    return c?.color ? { background: c.color + '33', color: c.color } : {}
  }
  function typeLabel(type: string): string {
    return allSessionTypes.find(t => t.key === type)?.label ?? sessionTypeLabel(type as SessionType)
  }

  const monthSessions = sessions.filter(s => s.date.slice(0, 7) === historyMonth).sort((a, b) => b.date.localeCompare(a.date))
  const monthCompleted = monthSessions.filter(s => s.completed)
  const monthKm = monthCompleted.reduce((sum, s) => sum + (s.actual_distance || 0), 0)
  const monthFeedbacks = feedbacks.filter(f => f.date.slice(0, 7) === historyMonth)
  const completionRate = monthSessions.length > 0
    ? Math.round((monthCompleted.length / monthSessions.length) * 100)
    : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Sesje', value: `${monthCompleted.length} / ${monthSessions.length}` },
          { label: 'Łącznie km', value: monthKm > 0 ? `${monthKm.toFixed(0)} km` : '—' },
          { label: 'Feedbacków', value: monthFeedbacks.length },
          { label: 'Ukończenie', value: monthSessions.length > 0 ? `${completionRate}%` : '—' },
        ].map(stat => (
          <Card key={stat.label} className="p-4 text-center">
            <div className="text-xl font-bold mb-1">{stat.value}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setHistoryMonth(m => shiftMonth(m, -1))}
          className="px-3 py-1.5 rounded-xl text-sm cursor-pointer"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>←</button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold capitalize" style={{ color: 'var(--text-primary)' }}>
            {monthLabel(historyMonth)}
          </span>
          {historyMonth !== currentMonth && (
            <button onClick={() => setHistoryMonth(currentMonth)}
              className="px-2.5 py-1 rounded-lg text-xs cursor-pointer"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Dziś
            </button>
          )}
        </div>
        <button onClick={() => setHistoryMonth(m => shiftMonth(m, 1))}
          className="px-3 py-1.5 rounded-xl text-sm cursor-pointer"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>→</button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
              {['Data', 'Sesja', 'Typ', 'Dystans', 'Tempo', 'HR', 'Status', 'Feedback'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthSessions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <div className="text-3xl mb-2">📅</div>
                  <div className="text-sm font-medium mb-1">Brak sesji w tym miesiącu</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Przejdź do zakładki Plan, aby zaplanować treningi</div>
                </td>
              </tr>
            )}
            {(() => {
              const pastMonthSessions = monthSessions.filter(s => s.date < today || s.completed)
              const upcomingMonthSessions = monthSessions.filter(s => s.date >= today && !s.completed).reverse()
              const renderRow = (session: DbRow) => {
                const fb = feedbackBySession[session.id] || feedbackByDate[session.date]
                const isExpanded = expandedRows.has(session.id)
                return (
                  <Fragment key={session.id}>
                    <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--bg-subtle)' }}>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(session.date, { day: 'numeric', month: 'short' })}</td>
                      <td className="px-4 py-3 font-medium text-xs">{session.title}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${typeClass(session.type)}`}
                          style={typeStyle(session.type)}>
                          {typeLabel(session.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {session.actual_distance ? `${session.actual_distance} km` : session.planned_distance ? `(${session.planned_distance} km)` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{session.actual_pace || session.planned_pace || '—'}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{session.avg_hr ? `${session.avg_hr} bpm` : '—'}</td>
                      <td className="px-4 py-3">
                        {session.completed
                          ? <span className="text-xs text-green-400">✓ Wykonany</span>
                          : session.date < today
                          ? <span className="text-xs text-red-400">✗ Pominięty</span>
                          : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Planowany</span>}
                      </td>
                      <td className="px-4 py-3">
                        {fb ? (
                          <button onClick={() => toggleRow(session.id)}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg cursor-pointer"
                            style={{ background: isExpanded ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)', color: isExpanded ? '#FF5C1B' : 'var(--text-muted)' }}>
                            <span>💬</span><span>{isExpanded ? '▲' : '▼'}</span>
                          </button>
                        ) : <span className="text-xs" style={{ color: 'var(--border)' }}>—</span>}
                      </td>
                    </tr>
                    {isExpanded && fb && (
                      <tr>
                        <td colSpan={8} className="px-4 pb-3">
                          <div className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                            <FeedbackDetail fb={fb} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              }
              return (
                <>
                  {pastMonthSessions.map(renderRow)}
                  {upcomingMonthSessions.length > 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-2 text-xs font-medium text-center"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                        — Nadchodzące —
                      </td>
                    </tr>
                  )}
                  {upcomingMonthSessions.map(renderRow)}
                </>
              )
            })()}
          </tbody>
        </table>
      </div>
    </div>
  )
}
