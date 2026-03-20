'use client'

import { Fragment, useMemo, useState } from 'react'
import { formatDate, sessionTypeLabel } from '@/lib/utils'
import { SessionType } from '@/lib/types'
import { FeedbackDetail } from '@/components/coach/FeedbackCard'
import { SelectField } from '@/components/ui/SelectField'
import { SessionTypeDef } from '@/lib/session-type-defs'
import { ProfileEmptyState } from '../ProfileStates'
import { getSessionCompletionSourceLabel, getSessionExecutionLabel, getSessionExecutionStatus } from '@/lib/session-status'
import type {
  CoachTrainingSessionRow,
  CoachStravaActivityRow,
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
  stravaActivities: CoachStravaActivityRow[]
  today: string
  currentMonth: string
  allSessionTypes: SessionTypeDef[]
}

export function HistoryTab({ sessions, feedbackBySession, feedbackByDate, stravaActivities, today, currentMonth, allSessionTypes }: HistoryTabProps) {
  const [historyMonth, setHistoryMonth] = useState(currentMonth)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'missed' | 'detected'>('all')
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

  function statusTone(session: CoachTrainingSessionRow) {
    const status = getSessionExecutionStatus(session)
    if (status === 'completed') return { color: '#2ECC71', bg: 'rgba(46,204,113,0.12)' }
    if (status === 'detected') return { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' }
    if (status === 'skipped' || (status === 'planned' && session.date < today)) return { color: '#E74C3C', bg: 'rgba(231,76,60,0.12)' }
    return { color: 'var(--text-muted)', bg: 'var(--bg-subtle)' }
  }

  const actualSourceLabels: Record<NonNullable<CoachTrainingSessionRow['actual_data_source']>, string> = {
    athlete: 'Zawodnik',
    coach: 'Trener',
    strava: 'Strava',
    imported: 'Import',
  }

  const monthSessions = sessions
    .filter((session) => session.date.slice(0, 7) === historyMonth)
    .filter((session) => getSessionExecutionStatus(session) !== 'planned' || session.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))

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

  const unresolvedSessions = useMemo(
    () => monthSessions.filter((session) => getSessionExecutionStatus(session) === 'planned' && session.date < today),
    [monthSessions, today],
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
      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold">Historia wykonania</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Operacyjny log pracy z zawodnikiem: sesje, statusy, feedback, źródła danych i przypadki do weryfikacji.
            </p>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Miesiąc: {monthLabel(historyMonth)}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mt-4">
          <div className="rounded-xl px-3 py-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>Wykonane</div>
            <div className="mt-2 text-xl font-semibold" style={{ color: '#2ECC71' }}>{monthSummary.completed}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Sesje potwierdzone jako wykonane</div>
          </div>
          <div className="rounded-xl px-3 py-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>Wykryte</div>
            <div className="mt-2 text-xl font-semibold" style={{ color: '#60A5FA' }}>{monthSummary.detected}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Sesje wykryte z urządzenia do potwierdzenia</div>
          </div>
          <div className="rounded-xl px-3 py-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>Pominięte</div>
            <div className="mt-2 text-xl font-semibold" style={{ color: '#E74C3C' }}>{monthSummary.skipped}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Sesje oznaczone jako niewykonane</div>
          </div>
          <div className="rounded-xl px-3 py-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>Do sprawdzenia</div>
            <div className="mt-2 text-xl font-semibold" style={{ color: monthSummary.unresolved > 0 || monthUnplannedActivities.length > 0 ? '#F1C40F' : 'var(--text-primary)' }}>
              {monthSummary.unresolved + monthUnplannedActivities.length}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Brak potwierdzeń i aktywności poza planem</div>
          </div>
        </div>
      </div>

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

      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold">Do weryfikacji</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              To są przypadki, które wymagają ręcznego spojrzenia: aktywności poza planem i sesje bez domknięcia.
            </p>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {monthUnplannedActivities.length > 0 || unresolvedSessions.length > 0
              ? `${monthUnplannedActivities.length} aktywności poza planem · ${unresolvedSessions.length} sesji bez domknięcia`
              : 'Brak otwartych spraw w tym miesiącu'}
          </div>
        </div>

        <div className="grid gap-4 mt-4 xl:grid-cols-2">
          <div className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">Sesje bez domknięcia</div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{unresolvedSessions.length}</span>
            </div>
            {unresolvedSessions.length > 0 ? (
              <div className="space-y-3 mt-4">
                {unresolvedSessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="rounded-xl p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{session.title}</div>
                        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(session.date, { day: 'numeric', month: 'short' })} · {typeLabel(session.type)}
                        </div>
                      </div>
                      <span className="text-[11px] rounded-full px-2.5 py-1" style={{ background: 'rgba(241,196,15,0.12)', color: '#F1C40F' }}>
                        Brak potwierdzenia
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
                Wszystkie przeszłe sesje z tego miesiąca mają już status wykonania.
              </div>
            )}
          </div>

          <div className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">Aktywności poza planem</div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{monthUnplannedActivities.length}</span>
            </div>
            {monthUnplannedActivities.length > 0 ? (
              <div className="space-y-3 mt-4">
                {monthUnplannedActivities.slice(0, 5).map((activity) => (
                  <div key={activity.strava_id} className="rounded-xl p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
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
              {['Data', 'Sesja', 'Typ', 'Plan / actual', 'Status', 'Źródła', 'Feedback'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredMonthSessions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
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
                const status = getSessionExecutionStatus(session)
                const sourceLabel = getSessionCompletionSourceLabel(session)
                const statusLabel = status === 'planned' && session.date < today
                  ? 'Brak potwierdzenia'
                  : getSessionExecutionLabel(session)
                const actualSourceLabel = session.actual_data_source ? actualSourceLabels[session.actual_data_source] : null
                const pairingLabel = session.linked_strava_activity_id ? `Strava #${session.linked_strava_activity_id}` : null
                const tone = statusTone(session)
                return (
                  <Fragment key={session.id}>
                    <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--bg-subtle)' }}>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(session.date, { day: 'numeric', month: 'short' })}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium">{session.title}</div>
                        {session.description && (
                          <div className="text-[11px] mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                            {session.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={typeStyle(session.type)}>
                          {typeLabel(session.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {session.planned_distance || session.planned_duration
                            ? `Plan: ${session.planned_distance ? `${session.planned_distance} km` : '—'} · ${session.planned_duration ? `${session.planned_duration} min` : '—'}`
                            : 'Plan: —'}
                        </div>
                        <div className="text-xs mt-1">
                          {session.actual_distance || session.actual_duration
                            ? `Actual: ${session.actual_distance ? `${session.actual_distance} km` : '—'} · ${session.actual_duration ? `${session.actual_duration} min` : '—'}`
                            : 'Actual: —'}
                        </div>
                        {(session.actual_pace || session.avg_hr) && (
                          <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                            {session.actual_pace ? `Tempo ${session.actual_pace}` : 'Tempo —'}{session.avg_hr ? ` · HR ${session.avg_hr}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center w-fit rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ color: tone.color, background: tone.bg }}>
                            {statusLabel}
                          </span>
                          {sourceLabel && (
                            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                              {sourceLabel}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {actualSourceLabel ? (
                            <span className="text-[11px] rounded-full px-2.5 py-1 w-fit" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                              Actual: {actualSourceLabel}
                            </span>
                          ) : (
                            <span className="text-[11px]" style={{ color: 'var(--border)' }}>Brak actual source</span>
                          )}
                          {pairingLabel ? (
                            <span className="text-[11px] rounded-full px-2.5 py-1 w-fit" style={{ background: 'rgba(96,165,250,0.12)', color: '#60A5FA' }}>
                              {pairingLabel}
                            </span>
                          ) : (
                            <span className="text-[11px]" style={{ color: 'var(--border)' }}>Bez pairingu</span>
                          )}
                        </div>
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
                        <td colSpan={7} className="px-4 pb-3">
                          <div className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                            <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
                              <div className="rounded-xl p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>Metadane sesji</div>
                                <div className="space-y-2 mt-3 text-xs">
                                  <div>Status: <span className="font-medium">{statusLabel}</span></div>
                                  <div>Źródło wykonania: <span className="font-medium">{sourceLabel ?? 'Brak'}</span></div>
                                  <div>Źródło actual danych: <span className="font-medium">{actualSourceLabel ?? 'Brak'}</span></div>
                                  <div>Pairing Strava: <span className="font-medium">{pairingLabel ?? 'Brak'}</span></div>
                                </div>
                              </div>
                              <FeedbackDetail fb={fb} />
                            </div>
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
