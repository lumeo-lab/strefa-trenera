'use client'

import { Fragment, useState } from 'react'
import { formatDate, sessionTypeLabel } from '@/lib/utils'
import { SessionType } from '@/lib/types'
import { FeedbackDetail } from '@/components/coach/FeedbackCard'
import { SelectField } from '@/components/ui/SelectField'
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'missed'>('all')
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'with-feedback'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | SessionType>('all')
  const [search, setSearch] = useState('')

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

  const monthSessions = sessions
    .filter((session) => session.date.slice(0, 7) === historyMonth)
    .filter((session) => session.completed || session.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))
  const filteredMonthSessions = monthSessions.filter((session) => {
    const query = search.trim().toLowerCase()
    if (query) {
      const haystack = [session.title, session.description, typeLabel(session.type)].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(query)) return false
    }

    if (statusFilter === 'completed' && !session.completed) return false
    if (statusFilter === 'missed' && (session.completed || session.date >= today)) return false

    const fb = feedbackBySession[session.id] || feedbackByDate[session.date]
    if (feedbackFilter === 'with-feedback' && !fb) return false

    if (typeFilter !== 'all' && session.type !== typeFilter) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="rounded-2xl px-3 py-2.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Szukaj..."
            className="px-3 py-1.5 rounded-xl text-xs min-w-[120px] flex-1"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', maxWidth: 220 }}
          />
          <SelectField value={statusFilter} onChange={(value) => setStatusFilter(value as typeof statusFilter)} className="min-w-0">
            <option value="all">Wszystkie</option>
            <option value="completed">Wykonane</option>
            <option value="missed">Pominięte</option>
          </SelectField>
          <SelectField value={feedbackFilter} onChange={(value) => setFeedbackFilter(value as typeof feedbackFilter)} className="min-w-0">
            <option value="all">Feedback: wszystkie</option>
            <option value="with-feedback">Z feedbackiem</option>
          </SelectField>
          <SelectField value={typeFilter} onChange={(value) => setTypeFilter(value as 'all' | SessionType)} className="min-w-0">
            <option value="all">Typ: wszystkie</option>
            {allSessionTypes.map((type) => (
              <option key={type.key} value={type.key}>{type.label}</option>
            ))}
          </SelectField>
          <span className="text-xs ml-auto shrink-0" style={{ color: 'var(--text-muted)' }}>
            {filteredMonthSessions.length} {filteredMonthSessions.length === 1 ? 'sesja' : filteredMonthSessions.length < 5 ? 'sesje' : 'sesji'}
          </span>
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
                        {session.actual_distance ? `${session.actual_distance} km` : session.planned_distance ? `Plan: ${session.planned_distance} km` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{session.actual_pace || (session.planned_pace ? `Plan: ${session.planned_pace}` : '—')}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{session.avg_hr ? `${session.avg_hr} bpm` : '—'}</td>
                    <td className="px-4 py-3">
                      {session.completed
                        ? <span className="text-xs text-green-400">✓ Wykonany</span>
                        : session.date < today
                        ? <span className="text-xs text-red-400">✗ Pominięty</span>
                          : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}
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
              return filteredMonthSessions.map(renderRow)
            })()}
          </tbody>
        </table>
      </div>
    </div>
  )
}
