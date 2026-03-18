'use client'

import { Fragment, useState } from 'react'
import { formatDate, sessionTypeLabel } from '@/lib/utils'
import { SessionType } from '@/lib/types'
import { FeedbackDetail } from '@/components/coach/FeedbackCard'
import { SessionTypeDef } from '@/lib/session-type-defs'
import { ProfileEmptyState } from '../ProfileStates'
import type {
  CoachTrainingSessionRow,
  FeedbackByDateMap,
  FeedbackBySessionMap,
} from '../types'

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
  sessions: CoachTrainingSessionRow[]
  feedbackBySession: FeedbackBySessionMap
  feedbackByDate: FeedbackByDateMap
  today: string
  currentMonth: string
  allSessionTypes: SessionTypeDef[]
}

export function HistoryTab({ sessions, feedbackBySession, feedbackByDate, today, currentMonth, allSessionTypes }: HistoryTabProps) {
  const [historyMonth, setHistoryMonth] = useState(currentMonth)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'missed' | 'planned'>('all')
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'with-feedback'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | SessionType>('all')

  function toggleRow(sessionId: string) {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(sessionId)) { next.delete(sessionId) } else { next.add(sessionId) }
      return next
    })
  }

  function typeStyle(type: string): React.CSSProperties {
    const c = allSessionTypes.find(t => t.key === type)
    return c?.color ? { background: c.color + '33', color: c.color } : {}
  }
  function typeLabel(type: string): string {
    return allSessionTypes.find(t => t.key === type)?.label ?? sessionTypeLabel(type as SessionType)
  }

  const monthSessions = sessions.filter(s => s.date.slice(0, 7) === historyMonth).sort((a, b) => b.date.localeCompare(a.date))
  const filteredMonthSessions = monthSessions.filter((session) => {
    if (statusFilter === 'completed' && !session.completed) return false
    if (statusFilter === 'missed' && (session.completed || session.date >= today)) return false
    if (statusFilter === 'planned' && (session.completed || session.date < today)) return false

    const fb = feedbackBySession[session.id] || feedbackByDate[session.date]
    if (feedbackFilter === 'with-feedback' && !fb) return false

    if (typeFilter !== 'all' && session.type !== typeFilter) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="grid gap-3 md:grid-cols-3 flex-1 min-w-[320px]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5 inline-flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF5C1B' }} />
              Status sesji
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="w-full px-3 py-2 rounded-xl text-sm cursor-pointer"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <option value="all">Wszystkie sesje</option>
              <option value="completed">Wykonane</option>
              <option value="missed">Pominięte</option>
              <option value="planned">Planowane</option>
            </select>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5 inline-flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF5C1B' }} />
              Feedback
            </div>
            <select
              value={feedbackFilter}
              onChange={(e) => setFeedbackFilter(e.target.value as typeof feedbackFilter)}
              className="w-full px-3 py-2 rounded-xl text-sm cursor-pointer"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <option value="all">Cała historia</option>
              <option value="with-feedback">Tylko z feedbackiem</option>
            </select>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5 inline-flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF5C1B' }} />
              Typ sesji
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | SessionType)}
              className="w-full px-3 py-2 rounded-xl text-sm cursor-pointer"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <option value="all">Wszystkie typy</option>
              {allSessionTypes.map((type) => (
                <option key={type.key} value={type.key}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="text-sm px-3 py-2 rounded-xl" style={{ background: 'rgba(255,92,27,0.06)', color: '#FFB38F', border: '1px solid rgba(255,92,27,0.16)' }}>
          {filteredMonthSessions.length} {filteredMonthSessions.length === 1 ? 'sesja' : filteredMonthSessions.length < 5 ? 'sesje' : 'sesji'}
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between rounded-2xl px-3 py-2.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <button onClick={() => setHistoryMonth(m => shiftMonth(m, -1))}
          className="px-3 py-1.5 rounded-xl text-sm cursor-pointer"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>←</button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold capitalize" style={{ color: 'var(--text-primary)' }}>
            {monthLabel(historyMonth)}
          </span>
          {historyMonth !== currentMonth && (
            <button onClick={() => setHistoryMonth(currentMonth)}
              className="px-2.5 py-1 rounded-lg text-xs cursor-pointer"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Dziś
            </button>
          )}
        </div>
        <button onClick={() => setHistoryMonth(m => shiftMonth(m, 1))}
          className="px-3 py-1.5 rounded-xl text-sm cursor-pointer"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>→</button>
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
            {filteredMonthSessions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <ProfileEmptyState
                    icon="📅"
                    title="Brak sesji w tym widoku"
                    description="Zmień filtry albo przejdź do innego miesiąca, aby zobaczyć historię treningów zawodnika."
                  />
                </td>
              </tr>
            )}
            {(() => {
              const pastMonthSessions = filteredMonthSessions.filter(s => s.date < today || s.completed)
              const upcomingMonthSessions = filteredMonthSessions.filter(s => s.date >= today && !s.completed).reverse()
              const renderRow = (session: CoachTrainingSessionRow) => {
                const fb = feedbackBySession[session.id] || feedbackByDate[session.date]
                const isExpanded = expandedRows.has(session.id)
                return (
                  <Fragment key={session.id}>
                    <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--bg-subtle)' }}>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(session.date, { day: 'numeric', month: 'short' })}</td>
                      <td className="px-4 py-3 font-medium text-xs">{session.title}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full"
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
