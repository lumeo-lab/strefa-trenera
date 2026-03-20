'use client'

import { Fragment, useState } from 'react'
import { formatDate, sessionTypeLabel } from '@/lib/utils'
import { SessionType } from '@/lib/types'
import { FeedbackDetail } from '@/components/coach/FeedbackCard'
import { SelectField } from '@/components/ui/SelectField'
import { SessionTypeDef } from '@/lib/session-type-defs'
import { ProfileEmptyState } from '../ProfileStates'
import { getSessionCompletionSourceLabel, getSessionExecutionLabel, getSessionExecutionStatus } from '@/lib/session-status'
import type {
  CoachStravaActivityRow,
  CoachTrainingSessionRow,
  FeedbackByDateMap,
  FeedbackBySessionMap,
} from '../types'

function StatusHelpTooltip({
  text,
}: {
  text: string
}) {
  return (
    <span className="relative inline-flex items-center justify-center group">
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold cursor-help"
        style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
        title={text}
      >
        i
      </span>
      <span
        className="pointer-events-none absolute right-0 top-full z-20 mt-2 hidden w-72 whitespace-normal rounded-xl px-3 py-2 text-[11px] leading-5 shadow-lg group-hover:block"
        style={{ background: 'rgba(15,23,42,0.96)', color: 'white', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {text}
      </span>
    </span>
  )
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

interface HistoryTabProps {
  sessions: CoachTrainingSessionRow[]
  feedbackBySession: FeedbackBySessionMap
  feedbackByDate: FeedbackByDateMap
  stravaActivities: CoachStravaActivityRow[]
  today: string
  currentMonth: string
  allSessionTypes: SessionTypeDef[]
}

export function HistoryTab({ sessions, feedbackBySession, feedbackByDate, stravaActivities, today, currentMonth, allSessionTypes }: HistoryTabProps) {
  const [historyMonth, setHistoryMonth] = useState(currentMonth)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'missed' | 'detected'>('all')
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'with-feedback'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | SessionType>('all')
  const [search, setSearch] = useState('')

  function toggleRow(sessionId: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }

  function toggleDescription(sessionId: string) {
    setExpandedDescriptions((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }

  function typeStyle(type: string): React.CSSProperties {
    const c = allSessionTypes.find((t) => t.key === type)
    return c?.color ? { background: c.color + '33', color: c.color } : {}
  }

  function typeLabel(type: string): string {
    return allSessionTypes.find((t) => t.key === type)?.label ?? sessionTypeLabel(type as SessionType)
  }

  function statusTone(session: CoachTrainingSessionRow) {
    const status = getSessionExecutionStatus(session)
    if (status === 'completed') return { color: '#2ECC71', bg: 'rgba(46,204,113,0.12)' }
    if (status === 'detected') return { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' }
    if (status === 'skipped' || (status === 'planned' && session.date < today)) return { color: '#E74C3C', bg: 'rgba(231,76,60,0.12)' }
    return { color: 'var(--text-muted)', bg: 'var(--bg-subtle)' }
  }

  function statusHelpText(session: CoachTrainingSessionRow) {
    const status = getSessionExecutionStatus(session)
    if (status === 'completed') {
      return 'Sesja została potwierdzona jako wykonana. Liczy się jako zrealizowana i nie wymaga dalszego działania.'
    }
    if (status === 'detected') {
      return 'System wykrył aktywność z urządzenia lub Stravy powiązaną z tą sesją. Warto sprawdzić, czy to na pewno właściwe wykonanie.'
    }
    if (status === 'skipped') {
      return 'Sesja została oznaczona jako niewykonana. Nie liczy się do realizacji planu.'
    }
    if (session.date < today) {
      return 'To przeszła sesja planowana, która nadal nie ma potwierdzenia wykonania ani oznaczenia jako pominięta. Warto ją wyjaśnić.'
    }
    return 'To sesja planowana na przyszłość. Jeszcze nie wymaga potwierdzenia.'
  }

  const monthSessions = sessions
    .filter((session) => session.date.slice(0, 7) === historyMonth)
    .filter((session) => getSessionExecutionStatus(session) !== 'planned' || session.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))

  // TODO: Etap 2 — render month summary bar above table
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const monthSummary = monthSessions.reduce(
    (acc, session) => {
      const status = getSessionExecutionStatus(session)
      if (status === 'completed') acc.completed += 1
      else if (status === 'detected') acc.detected += 1
      else if (status === 'skipped') acc.skipped += 1
      else if (status === 'planned' && session.date < today) acc.unresolved += 1
      return acc
    },
    { completed: 0, detected: 0, skipped: 0, unresolved: 0 },
  )

  const linkedStravaIds = new Set(
    sessions
      .map((session) => session.linked_strava_activity_id)
      .filter((value): value is number => typeof value === 'number'),
  )

  const monthUnplannedActivities = stravaActivities
    .filter((activity) => activity.start_date?.slice(0, 7) === historyMonth)
    .filter((activity) => !linkedStravaIds.has(activity.strava_id))
    .sort((a, b) => (b.start_date ?? '').localeCompare(a.start_date ?? ''))

  const stravaActivityById = new Map(
    stravaActivities.map((activity) => [activity.strava_id, activity] as const),
  )

  const filteredMonthSessions = monthSessions.filter((session) => {
    const query = search.trim().toLowerCase()
    if (query) {
      const haystack = [session.title, session.description, typeLabel(session.type)].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(query)) return false
    }

    const status = getSessionExecutionStatus(session)
    if (statusFilter === 'completed' && status !== 'completed') return false
    if (statusFilter === 'detected' && status !== 'detected') return false
    if (statusFilter === 'missed' && !(status === 'skipped' || (status === 'planned' && session.date < today))) return false

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
            <option value="detected">Wykryte</option>
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

      <div className="flex items-center justify-between rounded-2xl px-3 py-2.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <button
          onClick={() => setHistoryMonth((m) => shiftMonth(m, -1))}
          className="px-3 py-1.5 rounded-xl text-sm cursor-pointer"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          ←
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold capitalize" style={{ color: 'var(--text-primary)' }}>
            {monthLabel(historyMonth)}
          </span>
          {historyMonth !== currentMonth && (
            <button
              onClick={() => setHistoryMonth(currentMonth)}
              className="px-2.5 py-1 rounded-lg text-xs cursor-pointer"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              Dziś
            </button>
          )}
        </div>
        <button
          onClick={() => setHistoryMonth((m) => shiftMonth(m, 1))}
          className="px-3 py-1.5 rounded-xl text-sm cursor-pointer"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          →
        </button>
      </div>

      <div className="rounded-2xl overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full min-w-[1020px] text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
              {['Data', 'Sesja', 'Typ', 'Wykonanie', 'Status', 'Feedback'].map((header) => (
                <th key={header} className="text-left px-4 py-3 font-medium text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredMonthSessions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <ProfileEmptyState
                    icon="📅"
                    title="Brak sesji w tym widoku"
                    description="Zmień filtry albo przejdź do innego miesiąca, aby zobaczyć historię treningów zawodnika."
                  />
                </td>
              </tr>
            )}
            {filteredMonthSessions.map((session) => {
              const fb = feedbackBySession[session.id] || feedbackByDate[session.date]
              const isExpanded = expandedRows.has(session.id)
              const isDescriptionExpanded = expandedDescriptions.has(session.id)
              const status = getSessionExecutionStatus(session)
              // TODO: Etap 2 — show source label in table row
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const sourceLabel = getSessionCompletionSourceLabel(session)
              const statusLabel = status === 'planned' && session.date < today
                ? 'Brak potwierdzenia'
                : getSessionExecutionLabel(session)
              const tone = statusTone(session)
              const linkedActivity = session.linked_strava_activity_id
                ? stravaActivityById.get(session.linked_strava_activity_id)
                : null
              const elevationGain = linkedActivity?.total_elevation_gain != null
                ? Math.round(linkedActivity.total_elevation_gain)
                : null
              const executionChips = [
                session.actual_distance != null ? { icon: '📏', value: `${session.actual_distance} km` } : null,
                session.actual_duration != null ? { icon: '⏱', value: `${session.actual_duration} min` } : null,
                session.actual_pace ? { icon: '⚡', value: session.actual_pace } : null,
                session.avg_hr != null ? { icon: '❤️', value: `${session.avg_hr}` } : null,
                elevationGain != null ? { icon: '⛰', value: `${elevationGain} m` } : null,
              ].filter((chip): chip is { icon: string; value: string } => chip != null)
              const executionEmptyLabel = session.date > today
                ? 'Czeka na wykonanie'
                : 'Brak danych wykonania'
              return (
                <Fragment key={session.id}>
                  <tr style={{ borderBottom: isExpanded || isDescriptionExpanded ? 'none' : '1px solid var(--bg-subtle)' }}>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(session.date, { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-3 w-[23%] min-w-[220px] max-w-[300px]">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => session.description && toggleDescription(session.id)}
                          className="text-xs font-medium truncate text-left"
                          style={{ color: 'var(--text-primary)', cursor: session.description ? 'pointer' : 'default' }}
                          aria-label={session.description ? (isDescriptionExpanded ? 'Ukryj opis sesji' : 'Pokaż opis sesji') : undefined}
                          title={session.description ? (isDescriptionExpanded ? 'Ukryj opis sesji' : 'Pokaż opis sesji') : undefined}
                        >
                          {session.title}
                        </button>
                        {session.description ? (
                          <button
                            type="button"
                            onClick={() => toggleDescription(session.id)}
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full cursor-pointer shrink-0"
                            style={{ background: isDescriptionExpanded ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)', color: isDescriptionExpanded ? '#FF5C1B' : 'var(--text-muted)' }}
                            aria-label={isDescriptionExpanded ? 'Ukryj opis sesji' : 'Pokaż opis sesji'}
                            title={isDescriptionExpanded ? 'Ukryj opis sesji' : 'Pokaż opis sesji'}
                          >
                            {isDescriptionExpanded ? '▾' : '▸'}
                          </button>
                        ) : null}
                        <span className="flex-1 min-w-0" />
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={typeStyle(session.type)}>
                        {typeLabel(session.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 w-[35%] min-w-[360px]">
                      {executionChips.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {executionChips.map((chip) => (
                            <span
                              key={`${session.id}-${chip.icon}-${chip.value}`}
                              className="text-[11px] rounded-full px-2 py-1"
                              style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
                            >
                              {chip.icon} {chip.value}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {executionEmptyLabel}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center w-fit rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ color: tone.color, background: tone.bg }}>
                          {statusLabel}
                        </span>
                        <StatusHelpTooltip text={statusHelpText(session)} />
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {fb ? (
                        <button
                          onClick={() => toggleRow(session.id)}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg cursor-pointer"
                          style={{ background: isExpanded ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)', color: isExpanded ? '#FF5C1B' : 'var(--text-muted)' }}
                        >
                          <span>💬</span>
                          <span>{isExpanded ? '▲' : '▼'}</span>
                        </button>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--border)' }}>—</span>
                      )}
                    </td>
                  </tr>
                  {isDescriptionExpanded && session.description && (
                    <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--bg-subtle)' }}>
                        <td colSpan={6} className="px-4 pb-3">
                        <div className="rounded-xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                          <div className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>Plan</div>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              <span className="text-[11px] rounded-full px-2 py-1" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                                📏 {session.planned_distance ? `${session.planned_distance} km` : '—'}
                              </span>
                              <span className="text-[11px] rounded-full px-2 py-1" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                                ⏱ {session.planned_duration ? `${session.planned_duration} min` : '—'}
                              </span>
                              <span className="text-[11px] rounded-full px-2 py-1" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                                ⚡ {session.planned_pace ? session.planned_pace : '—'}
                              </span>
                              {session.url && (
                                <span className="text-[11px] rounded-full px-2 py-1" style={{ background: 'rgba(96,165,250,0.12)', color: '#60A5FA' }}>
                                  🔗 {session.url_label || 'Link'}
                                </span>
                              )}
                            </div>
                            <div className="text-xs leading-6 mt-3" style={{ color: 'var(--text-muted)' }}>
                              {session.description}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {isExpanded && fb && (
                    <tr>
                        <td colSpan={6} className="px-4 pb-3">
                          <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                            <FeedbackDetail fb={fb} />
                          </div>
                        </td>
                      </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold">Aktywności poza planem</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              To są aktywności ze Stravy, które nie zostały sparowane z żadną sesją planową.
            </p>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {monthUnplannedActivities.length > 0
              ? `${monthUnplannedActivities.length} aktywności do sprawdzenia`
              : 'Brak aktywności poza planem'}
          </div>
        </div>

        {monthUnplannedActivities.length > 0 ? (
          <div className="space-y-3 mt-4">
            {monthUnplannedActivities.slice(0, 5).map((activity) => (
              <div key={activity.strava_id} className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-sm font-semibold">{activity.name || 'Aktywność Strava'}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {activity.start_date ? formatDate(activity.start_date, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Brak daty'}
                    </div>
                  </div>
                  <span className="text-[11px] rounded-full px-2.5 py-1" style={{ background: 'rgba(96,165,250,0.12)', color: '#60A5FA' }}>
                    Do sparowania
                  </span>
                </div>
                <div className="flex items-center gap-4 flex-wrap text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                  {activity.distance != null && <span>{(activity.distance / 1000).toFixed(1)} km</span>}
                  {activity.moving_time != null && <span>{Math.round(activity.moving_time / 60)} min</span>}
                  {activity.average_heartrate != null && <span>{Math.round(activity.average_heartrate)} bpm</span>}
                  {activity.total_elevation_gain != null && <span>{Math.round(activity.total_elevation_gain)} m+</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
            W tym miesiącu nie ma niesparowanych aktywności ze Stravy.
          </div>
        )}
      </div>
    </div>
  )
}
