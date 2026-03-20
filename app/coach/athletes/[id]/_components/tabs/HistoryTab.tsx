'use client'

import { Fragment, useState } from 'react'
import { formatDate, sessionTypeLabel } from '@/lib/utils'
import { SessionType } from '@/lib/types'
import { FeedbackDetail } from '@/components/coach/FeedbackCard'
import { SelectField } from '@/components/ui/SelectField'
import { SessionTypeDef } from '@/lib/session-type-defs'
import { ProfileEmptyState } from '../ProfileStates'
import { getSessionExecutionLabel, getSessionExecutionStatus } from '@/lib/session-status'
import type {
  CoachStravaActivityRow,
  CoachTrainingSessionRow,
  FeedbackByDateMap,
  FeedbackBySessionMap,
} from '../types'

// ── Helpers ────────────────────────────────────────────────────────────

function shiftMonth(m: string, d: number): string {
  const [y, mo] = m.split('-').map(Number)
  const dt = new Date(y, mo - 1 + d, 1)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(m: string): string {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
}

function deviationPercent(planned: number | null, actual: number | null): { value: number; label: string; color: string } | null {
  if (!planned || !actual || planned === 0) return null
  const pct = Math.round(((actual - planned) / planned) * 100)
  const color = Math.abs(pct) <= 10 ? '#2ECC71' : Math.abs(pct) <= 25 ? '#F1C40F' : '#E74C3C'
  const sign = pct > 0 ? '+' : ''
  return { value: pct, label: `${sign}${pct}%`, color }
}

const SOURCE_ICONS: Record<string, { icon: string; tooltip: string }> = {
  athlete: { icon: '🏃', tooltip: 'Potwierdzone przez zawodnika — zawodnik oznaczył trening jako wykonany lub wysłał feedback.' },
  coach: { icon: '👨‍💻', tooltip: 'Oznaczone przez trenera — trener ręcznie potwierdził wykonanie i wpisał wyniki.' },
  strava: { icon: '⌚', tooltip: 'Wykryte ze Strava/zegarka — system automatycznie powiązał aktywność z zaplanowaną sesją.' },
  imported: { icon: '📥', tooltip: 'Zaimportowane — dane zostały zaimportowane z zewnętrznego źródła.' },
}

// ── Component ──────────────────────────────────────────────────────────

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'missed' | 'detected' | 'needs-attention' | 'key'>('all')
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'with-feedback'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | SessionType>('all')
  const [search, setSearch] = useState('')

  function toggleRow(id: string) {
    setExpandedRows(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }
  function toggleDescription(id: string) {
    setExpandedDescriptions(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
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

  // ── Data ──────────────────────────────────────────────────────────────

  const monthSessions = sessions
    .filter(s => s.date.slice(0, 7) === historyMonth)
    .filter(s => getSessionExecutionStatus(s) !== 'planned' || s.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))

  const summary = monthSessions.reduce(
    (acc, s) => {
      const status = getSessionExecutionStatus(s)
      if (status === 'completed') { acc.completed += 1; acc.totalDist += s.actual_distance ?? 0; acc.totalDur += s.actual_duration ?? 0 }
      else if (status === 'detected') { acc.detected += 1; acc.totalDist += s.actual_distance ?? 0; acc.totalDur += s.actual_duration ?? 0 }
      else if (status === 'skipped') acc.skipped += 1
      else if (status === 'planned' && s.date < today) acc.unresolved += 1
      if (s.session_priority === 'key') { acc.keyTotal += 1; if (status === 'completed' || status === 'detected') acc.keyDone += 1 }
      return acc
    },
    { completed: 0, detected: 0, skipped: 0, unresolved: 0, totalDist: 0, totalDur: 0, keyTotal: 0, keyDone: 0 },
  )

  const totalDue = summary.completed + summary.detected + summary.skipped + summary.unresolved
  const completionRate = totalDue > 0 ? Math.round(((summary.completed + summary.detected) / totalDue) * 100) : 0
  const completionColor = completionRate >= 80 ? '#2ECC71' : completionRate >= 60 ? '#F1C40F' : '#E74C3C'

  const linkedStravaIds = new Set(sessions.map(s => s.linked_strava_activity_id).filter((v): v is number => typeof v === 'number'))
  const monthUnplanned = stravaActivities
    .filter(a => a.start_date?.slice(0, 7) === historyMonth && !linkedStravaIds.has(a.strava_id))
    .sort((a, b) => (b.start_date ?? '').localeCompare(a.start_date ?? ''))
  const stravaById = new Map(stravaActivities.map(a => [a.strava_id, a] as const))

  // ── Priority bar counts ───────────────────────────────────────────────

  const priorityCounts = {
    unresolved: summary.unresolved,
    skipped: summary.skipped,
    detected: summary.detected,
    unplanned: monthUnplanned.length,
    key: summary.keyTotal,
  }

  // ── Filtering ─────────────────────────────────────────────────────────

  const filtered = monthSessions.filter(s => {
    const q = search.trim().toLowerCase()
    if (q) {
      const haystack = [s.title, s.description, typeLabel(s.type)].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }
    const status = getSessionExecutionStatus(s)
    if (statusFilter === 'completed' && status !== 'completed') return false
    if (statusFilter === 'detected' && status !== 'detected') return false
    if (statusFilter === 'missed' && !(status === 'skipped' || (status === 'planned' && s.date < today))) return false
    if (statusFilter === 'needs-attention' && !(status === 'skipped' || (status === 'planned' && s.date < today) || status === 'detected')) return false
    if (statusFilter === 'key' && s.session_priority !== 'key') return false
    const fb = feedbackBySession[s.id] || feedbackByDate[s.date]
    if (feedbackFilter === 'with-feedback' && !fb) return false
    if (typeFilter !== 'all' && s.type !== typeFilter) return false
    return true
  })

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">

      {/* Month summary */}
      {totalDue > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl px-4 py-3 text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold" style={{ color: completionColor }}>{completionRate}%</span>
            <span style={{ color: 'var(--text-muted)' }}>realizacji</span>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>✓ {summary.completed + summary.detected} wykonane</span>
          {summary.skipped > 0 && <span style={{ color: '#E74C3C' }}>✗ {summary.skipped} pominięte</span>}
          {summary.unresolved > 0 && <span style={{ color: '#E74C3C' }}>? {summary.unresolved} niewyjaśnione</span>}
          {summary.totalDist > 0 && <span style={{ color: 'var(--text-muted)' }}>📏 {summary.totalDist.toFixed(1)} km</span>}
          {summary.totalDur > 0 && <span style={{ color: 'var(--text-muted)' }}>⏱ {summary.totalDur} min</span>}
          {summary.keyTotal > 0 && (
            <span style={{ color: summary.keyDone === summary.keyTotal ? '#2ECC71' : '#F1C40F' }}>
              🔑 {summary.keyDone}/{summary.keyTotal} kluczowe
            </span>
          )}
          {completionRate < 60 && totalDue >= 3 && (
            <span className="ml-auto text-xs italic" style={{ color: '#E74C3C' }}>
              Niska realizacja — warto sprawdzić przyczynę
            </span>
          )}
        </div>
      )}

      {/* Priority bar */}
      <div className="flex flex-wrap gap-1.5">
        {([
          { key: 'detected' as const, label: 'Wykryte', count: priorityCounts.detected, color: '#60A5FA' },
          { key: 'key' as const, label: 'Kluczowe', count: priorityCounts.key, color: '#FF5C1B' },
        ]).filter(p => p.count > 0).map(p => (
          <button
            key={p.key}
            onClick={() => setStatusFilter(statusFilter === p.key ? 'all' : p.key)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all"
            style={{
              background: statusFilter === p.key ? `${p.color}22` : 'var(--bg-elevated)',
              color: statusFilter === p.key ? p.color : 'var(--text-muted)',
              border: statusFilter === p.key ? `1px solid ${p.color}44` : '1px solid var(--border)',
            }}
          >
            {p.label} ({p.count})
          </button>
        ))}
        {monthUnplanned.length > 0 && (
          <span className="px-3 py-1.5 rounded-xl text-xs" style={{ background: 'rgba(96,165,250,0.08)', color: '#60A5FA', border: '1px solid rgba(96,165,250,0.2)' }}>
            Poza planem: {monthUnplanned.length}
          </span>
        )}
      </div>

      {/* Filters + month nav */}
      <div className="rounded-2xl px-3 py-2.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj..."
            className="px-3 py-1.5 rounded-xl text-xs min-w-[120px] flex-1"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', maxWidth: 200 }}
          />
          <SelectField value={statusFilter} onChange={v => setStatusFilter(v as typeof statusFilter)} className="min-w-0">
            <option value="all">Wszystkie</option>
            <option value="completed">Wykonane</option>
            <option value="detected">Wykryte</option>
            <option value="missed">Pominięte / niewyjaśnione</option>
            <option value="needs-attention">Wymaga uwagi</option>
            <option value="key">Kluczowe</option>
          </SelectField>
          <SelectField value={feedbackFilter} onChange={v => setFeedbackFilter(v as typeof feedbackFilter)} className="min-w-0">
            <option value="all">Feedback: wszystkie</option>
            <option value="with-feedback">Z feedbackiem</option>
          </SelectField>
          <SelectField value={typeFilter} onChange={v => setTypeFilter(v as 'all' | SessionType)} className="min-w-0">
            <option value="all">Typ: wszystkie</option>
            {allSessionTypes.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </SelectField>
          <span className="text-xs ml-auto shrink-0" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} {filtered.length === 1 ? 'sesja' : filtered.length < 5 ? 'sesje' : 'sesji'}
          </span>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between rounded-2xl px-3 py-2.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <button onClick={() => setHistoryMonth(m => shiftMonth(m, -1))} className="px-3 py-1.5 rounded-xl text-sm cursor-pointer" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>←</button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold capitalize">{monthLabel(historyMonth)}</span>
          {historyMonth !== currentMonth && (
            <button onClick={() => setHistoryMonth(currentMonth)} className="px-2.5 py-1 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Dziś</button>
          )}
        </div>
        <button onClick={() => setHistoryMonth(m => shiftMonth(m, 1))} className="px-3 py-1.5 rounded-xl text-sm cursor-pointer" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>→</button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
              {['Data', 'Sesja', 'Typ', 'Plan', 'Wykonanie', 'Δ', 'Status', 'Feedback'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center">
                <ProfileEmptyState icon="📅" title="Brak sesji w tym widoku" description="Zmień filtry albo przejdź do innego miesiąca." />
              </td></tr>
            )}
            {filtered.map(session => {
              const fb = feedbackBySession[session.id] || feedbackByDate[session.date]
              const isExpanded = expandedRows.has(session.id)
              const isDescExpanded = expandedDescriptions.has(session.id)
              const status = getSessionExecutionStatus(session)
              const sourceData = SOURCE_ICONS[session.completion_source ?? '']
              const statusLabel = status === 'planned' && session.date < today ? 'Niewyjaśniona' : getSessionExecutionLabel(session)
              const tone = statusTone(session)
              const linkedActivity = session.linked_strava_activity_id ? stravaById.get(session.linked_strava_activity_id) : null
              const elevGain = linkedActivity?.total_elevation_gain != null ? Math.round(linkedActivity.total_elevation_gain) : null
              const distDev = deviationPercent(session.planned_distance, session.actual_distance)
              const durDev = deviationPercent(session.planned_duration, session.actual_duration)

              return (
                <Fragment key={session.id}>
                  <tr style={{ borderBottom: isExpanded || isDescExpanded ? 'none' : '1px solid var(--bg-subtle)' }}>
                    {/* Date */}
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(session.date, { day: 'numeric', month: 'short' })}
                    </td>

                    {/* Session title */}
                    <td className="px-4 py-3 max-w-[240px]">
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => session.description && toggleDescription(session.id)}
                          className="text-xs font-medium truncate text-left" style={{ color: 'var(--text-primary)', cursor: session.description ? 'pointer' : 'default' }}>
                          {session.session_priority === 'key' && <span title="Kluczowa sesja">🔑 </span>}
                          {session.title}
                        </button>
                        {session.description && (
                          <button type="button" onClick={() => toggleDescription(session.id)}
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full cursor-pointer shrink-0"
                            style={{ background: isDescExpanded ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)', color: isDescExpanded ? '#FF5C1B' : 'var(--text-muted)' }}>
                            {isDescExpanded ? '▾' : '▸'}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={typeStyle(session.type)}>{typeLabel(session.type)}</span>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {session.planned_distance != null && <span className="text-[11px] rounded-full px-1.5 py-0.5" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>📏 {session.planned_distance} km</span>}
                        {session.planned_duration != null && <span className="text-[11px] rounded-full px-1.5 py-0.5" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>⏱ {session.planned_duration} min</span>}
                        {!session.planned_distance && !session.planned_duration && <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>—</span>}
                      </div>
                    </td>

                    {/* Execution */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {session.actual_distance != null && <span className="text-[11px] rounded-full px-1.5 py-0.5" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>📏 {session.actual_distance} km</span>}
                        {session.actual_duration != null && <span className="text-[11px] rounded-full px-1.5 py-0.5" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>⏱ {session.actual_duration} min</span>}
                        {session.avg_hr != null && <span className="text-[11px] rounded-full px-1.5 py-0.5" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>❤️ {session.avg_hr}</span>}
                        {session.max_hr != null && <span className="text-[11px] rounded-full px-1.5 py-0.5" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>❤️‍🔥 {session.max_hr}</span>}
                        {elevGain != null && <span className="text-[11px] rounded-full px-1.5 py-0.5" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>⛰ {elevGain}m</span>}
                        {!session.actual_distance && !session.actual_duration && !session.avg_hr && <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>—</span>}
                      </div>
                    </td>

                    {/* Deviation */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {distDev || durDev ? (
                        <div className="flex flex-col gap-0.5">
                          {distDev && <span className="text-[11px] font-medium" style={{ color: distDev.color }}>{distDev.label} km</span>}
                          {durDev && <span className="text-[11px] font-medium" style={{ color: durDev.color }}>{durDev.label} czas</span>}
                        </div>
                      ) : <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>

                    {/* Status + source */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ color: tone.color, background: tone.bg }}>
                          {statusLabel}
                        </span>
                        {sourceData && <span className="text-xs cursor-help" title={sourceData.tooltip}>{sourceData.icon}</span>}
                      </div>
                      {status === 'skipped' && session.skipped_reason && (
                        <div className="text-[10px] mt-0.5 italic" style={{ color: 'var(--text-muted)' }}>
                          {session.skipped_reason}
                        </div>
                      )}
                    </td>

                    {/* Feedback */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {fb ? (
                        <button onClick={() => toggleRow(session.id)}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg cursor-pointer"
                          style={{ background: isExpanded ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)', color: isExpanded ? '#FF5C1B' : 'var(--text-muted)' }}>
                          {fb.signal === 'red' ? '🔴' : fb.signal === 'yellow' ? '🟡' : '🟢'}
                          <span>{isExpanded ? '▲' : '▼'}</span>
                        </button>
                      ) : <span className="text-xs" style={{ color: 'var(--border)' }}>—</span>}
                    </td>
                  </tr>

                  {/* Description expand */}
                  {isDescExpanded && session.description && (
                    <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--bg-subtle)' }}>
                      <td colSpan={8} className="px-4 pb-3">
                        <div className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                          <div className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>{session.description}</div>
                          {session.url && (
                            <a href={session.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs mt-2" style={{ color: '#60A5FA' }}>
                              🔗 {session.url_label || 'Link'}
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Feedback expand */}
                  {isExpanded && fb && (
                    <tr style={{ borderBottom: '1px solid var(--bg-subtle)' }}>
                      <td colSpan={8} className="px-4 pb-3">
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

      {/* Unplanned activities */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold">Aktywności poza planem</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Aktywności ze Stravy niesparowane z żadną sesją planową.</p>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {monthUnplanned.length > 0 ? `${monthUnplanned.length} do sprawdzenia` : 'Brak'}
          </span>
        </div>
        {monthUnplanned.length > 0 ? (
          <div className="space-y-2 mt-3">
            {monthUnplanned.slice(0, 8).map(a => (
              <div key={a.strava_id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{a.name || 'Aktywność Strava'}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {a.start_date ? formatDate(a.start_date, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {a.distance != null && <span>{(a.distance / 1000).toFixed(1)} km</span>}
                  {a.moving_time != null && <span>{Math.round(a.moving_time / 60)} min</span>}
                  {a.average_heartrate != null && <span>{Math.round(a.average_heartrate)} bpm</span>}
                </div>
              </div>
            ))}
            {monthUnplanned.length > 8 && (
              <div className="text-xs text-center pt-1" style={{ color: 'var(--text-muted)' }}>+{monthUnplanned.length - 8} więcej</div>
            )}
          </div>
        ) : (
          <div className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>W tym miesiącu nie ma niesparowanych aktywności.</div>
        )}
      </div>
    </div>
  )
}
