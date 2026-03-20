'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getBusinessToday } from '@/lib/date'
import { formatDate, intensityColor, sessionTypeLabel } from '@/lib/utils'
import { isSessionCompleted, isSessionSkipped } from '@/lib/session-status'
import { monthLabel, shiftMonth } from '@/lib/calendar'
import { AthleteBottomNav } from './AthleteBottomNav'
import { AthleteSession } from '@/lib/athlete-auth'
import type { AthleteFeedbackRow, AthleteStravaActivityRow, AthleteTrainingSessionRow } from '@/lib/athlete-data'

type FeedbackSnippet = Pick<AthleteFeedbackRow, 'id' | 'date' | 'signal' | 'coach_reply' | 'feeling' | 'rpe' | 'notes_structured' | 'source'>

interface Props {
  athlete: AthleteSession
  sessions: AthleteTrainingSessionRow[]
  feedbacks: FeedbackSnippet[]
  stravaConnected: boolean
  stravaActivities: AthleteStravaActivityRow[]
  stravaStatus?: string
  stravaMsg?: string
}

function formatPace(metersPerSec: number): string {
  if (!metersPerSec) return ''
  const secPerKm = 1000 / metersPerSec
  const min = Math.floor(secPerKm / 60)
  const sec = Math.round(secPerKm % 60)
  return `${min}:${String(sec).padStart(2, '0')}/km`
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m} min`
}

const SOURCE_LABEL: Record<string, string> = {
  athlete: '👤',
  coach: '🏋️',
  strava: '🟠',
  imported: '📥',
}

export function AthleteHistoryPage({ athlete, sessions, feedbacks, stravaConnected, stravaActivities, stravaStatus, stravaMsg }: Props) {
  const currentMonth = getBusinessToday().slice(0, 7)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  async function handleSync() {
    setSyncing(true)
    setSyncError(null)
    try {
      const res = await fetch('/api/strava/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: athlete.slug }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null) as { error?: string } | null
        throw new Error(payload?.error || 'sync failed')
      }
      startTransition(() => router.refresh())
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Nie udało się zsynchronizować.')
    } finally {
      setSyncing(false)
    }
  }

  // Build feedback map by date
  const feedbackByDate: Record<string, FeedbackSnippet> = {}
  for (const fb of feedbacks) {
    if (fb.source !== 'voice' && !feedbackByDate[fb.date]) feedbackByDate[fb.date] = fb
  }

  const monthSessions = sessions.filter(s => s.date.slice(0, 7) === selectedMonth)
  const completedCount = monthSessions.filter(s => isSessionCompleted(s)).length
  const skippedCount = monthSessions.filter(s => isSessionSkipped(s)).length
  const totalKm = monthSessions.reduce((sum, s) => sum + (s.actual_distance || 0), 0)
  const totalMin = monthSessions.reduce((sum, s) => sum + (s.actual_duration || 0), 0)
  const completionRate = monthSessions.length > 0 ? Math.round((completedCount / monthSessions.length) * 100) : 0

  // Unlinked Strava activities (not paired with any session)
  const linkedStravaIds = new Set(sessions.map(s => s.linked_strava_activity_id).filter(Boolean))
  const monthStravaExtra = stravaActivities
    .filter(a => a.start_date?.slice(0, 7) === selectedMonth && !linkedStravaIds.has(a.strava_id))

  const stravaAuthUrl = `/api/strava/auth?slug=${athlete.slug}`

  return (
    <div style={{ color: 'var(--text-primary)', paddingBottom: '90px' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 border-b" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
        <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{athlete.name}</div>
        <h1 className="text-xl font-bold">Wykonanie</h1>
      </div>

      <div className="p-5 space-y-4">

        {/* Strava status banners */}
        {stravaStatus === 'connected' && (
          <div className="px-4 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(252,76,2,0.1)', border: '1px solid rgba(252,76,2,0.3)', color: '#FC4C02' }}>
            ✓ Strava połączona!
          </div>
        )}
        {stravaStatus === 'denied' && (
          <div className="px-4 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            Odmówiłeś dostępu do Stravy.
          </div>
        )}
        {stravaStatus === 'error' && (
          <div className="px-4 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            Błąd połączenia ze Stravą{stravaMsg && `: ${stravaMsg}`}
          </div>
        )}

        {/* Connect / sync Strava */}
        {!stravaConnected ? (
          <a href={stravaAuthUrl}
            className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer"
            style={{ background: '#FC4C02', color: 'white', textDecoration: 'none' }}>
            <span className="text-xs font-black tracking-widest px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.18)' }}>STRAVA</span>
            <div>
              <div className="font-semibold text-sm">Połącz ze Stravą</div>
              <div className="text-xs opacity-80">Automatycznie importuj biegi</div>
            </div>
          </a>
        ) : (
          <div className="flex items-center justify-between px-4 py-2 rounded-xl text-sm"
            style={{ background: 'rgba(252,76,2,0.08)', border: '1px solid rgba(252,76,2,0.2)', color: '#FC4C02' }}>
            <span className="font-medium">🟠 Strava</span>
            <button onClick={handleSync} disabled={syncing}
              className="text-xs px-3 py-1 rounded-lg cursor-pointer"
              style={{ background: '#FC4C02', color: 'white', border: 'none', opacity: syncing ? 0.6 : 1 }}>
              {syncing ? 'Synchronizuję...' : '↻ Odśwież'}
            </button>
          </div>
        )}
        {syncError && (
          <div className="px-4 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            {syncError}
          </div>
        )}

        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedMonth(m => shiftMonth(m, -1))}
            className="px-3 py-1.5 rounded-xl text-sm cursor-pointer"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>←</button>
          <span className="text-sm font-bold capitalize">{monthLabel(selectedMonth)}</span>
          <button onClick={() => setSelectedMonth(m => shiftMonth(m, 1))}
            className="px-3 py-1.5 rounded-xl text-sm cursor-pointer"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>→</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Sesji', value: `${completedCount}/${monthSessions.length}` },
            { label: 'Realizacja', value: `${completionRate}%` },
            { label: 'Dystans', value: `${totalKm.toFixed(0)} km` },
            { label: 'Czas', value: totalMin >= 60 ? `${Math.floor(totalMin / 60)}h ${totalMin % 60}m` : `${totalMin}m` },
          ].map(stat => (
            <div key={stat.label} className="p-2 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-lg font-bold">{stat.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Session list */}
        {monthSessions.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <div className="text-4xl mb-3">📋</div>
            <div>Brak sesji w tym miesiącu</div>
          </div>
        ) : (
          <div className="space-y-2">
            {monthSessions.map(s => {
              const completed = isSessionCompleted(s)
              const skipped = isSessionSkipped(s)
              const hasActuals = !!(s.actual_distance || s.actual_duration)
              const fb = feedbackByDate[s.date]
              const source = s.completion_source
              return (
                <div key={s.id} className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(s.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        {completed && <span className="text-xs" style={{ color: '#2ECC71' }}>✓ ukończony</span>}
                        {skipped && <span className="text-xs" style={{ color: '#f59e0b' }}>— pominięty</span>}
                        {!completed && !skipped && s.date < getBusinessToday() && <span className="text-xs" style={{ color: '#f87171' }}>✗</span>}
                        {source && <span className="text-xs" title={source}>{SOURCE_LABEL[source] ?? ''}</span>}
                      </div>
                      <div className="font-semibold text-sm mt-0.5">{s.title}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${intensityColor(s.type)}`}>{sessionTypeLabel(s.type)}</span>
                  </div>

                  {/* Plan */}
                  {(s.planned_distance || s.planned_duration || s.planned_pace) && (
                    <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="font-medium opacity-50">Plan:</span>
                      {s.planned_distance && <span>{s.planned_distance} km</span>}
                      {s.planned_duration && <span>{s.planned_duration} min</span>}
                      {s.planned_pace && <span>{s.planned_pace}/km</span>}
                    </div>
                  )}

                  {/* Execution */}
                  {hasActuals && (
                    <div className="flex flex-wrap gap-3 text-xs mt-1" style={{ color: completed ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      <span className="font-medium opacity-50" style={{ color: '#2ECC71' }}>Wynik:</span>
                      {s.actual_distance && <span>{s.actual_distance} km</span>}
                      {s.actual_duration && <span>{s.actual_duration} min</span>}
                      {s.actual_pace && <span>{s.actual_pace}/km</span>}
                      {s.avg_hr && <span>❤️ {Math.round(s.avg_hr)}</span>}
                    </div>
                  )}

                  {/* Skip reason */}
                  {skipped && s.skipped_reason && (
                    <div className="text-xs mt-1.5 italic" style={{ color: 'var(--text-muted)' }}>
                      Powód: {s.skipped_reason}
                    </div>
                  )}

                  {/* Feedback snippet */}
                  {fb && (
                    <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '10px' }}>{fb.signal === 'green' ? '🟢' : fb.signal === 'yellow' ? '🟡' : fb.signal === 'red' ? '🔴' : '⚪'}</span>
                      {fb.feeling && <span className="text-xs">{fb.feeling}</span>}
                      {fb.rpe && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>RPE {fb.rpe}</span>}
                      {fb.notes_structured && <span className="text-xs truncate flex-1" style={{ color: 'var(--text-muted)' }}>{fb.notes_structured}</span>}
                      {fb.coach_reply && <span className="text-xs shrink-0" style={{ color: '#2ECC71' }}>💬</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Extra Strava activities (not linked to any session) */}
        {monthStravaExtra.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
              Aktywności dodatkowe spoza planu ({monthStravaExtra.length})
            </div>
            {monthStravaExtra.map(a => (
              <div key={a.id} className="p-3 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid rgba(252,76,2,0.15)' }}>
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {a.start_date
                        ? new Date(a.start_date).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })
                        : '—'}
                    </div>
                    <div className="font-medium text-sm mt-0.5">{a.name}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(252,76,2,0.12)', color: '#FC4C02' }}>Strava</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {a.distance && <span>{(a.distance / 1000).toFixed(1)} km</span>}
                  {a.moving_time && <span>{formatDuration(a.moving_time)}</span>}
                  {a.average_speed && <span>{formatPace(a.average_speed)}</span>}
                  {a.average_heartrate && <span>❤️ {Math.round(a.average_heartrate)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <AthleteBottomNav slug={athlete.slug} athleteName={athlete.name} athleteAvatar={athlete.avatar} />
    </div>
  )
}
