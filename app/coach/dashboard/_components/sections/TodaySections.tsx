'use client'

import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate, intensityColor, plural, sessionTypeLabel } from '@/lib/utils'
import type { SessionType } from '@/lib/types'
import Link from 'next/link'
import type { DashboardSessionRow } from '../types'

function sessionMetaLabel(session: DashboardSessionRow) {
  const parts: string[] = []
  if (session.planned_distance) parts.push(`${session.planned_distance} km`)
  if (session.completed) parts.push('zrealizowane przez zawodnika')
  else parts.push('oczekuje na realizację')
  return parts.join(' · ')
}

function feedbackBadge(session: DashboardSessionRow) {
  if (session.feedbackSignal === 'red') return { label: 'Czerwony feedback', color: '#E74C3C', bg: 'rgba(231,76,60,0.12)' }
  if (session.feedbackSignal === 'yellow') return { label: 'Feedback ostrzegawczy', color: '#F1C40F', bg: 'rgba(241,196,15,0.12)' }
  if (session.feedbackSignal === 'green') return { label: 'Jest feedback', color: '#2ECC71', bg: 'rgba(46,204,113,0.12)' }
  return null
}

export function TodayPlanSection({ sessions, todayCompleted }: {
  sessions: DashboardSessionRow[]
  todayCompleted: number
}) {
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    const signalRank: Record<string, number> = { red: 0, yellow: 1, green: 2, '': 3 }
    const aSignal = signalRank[a.feedbackSignal ?? ''] ?? 3
    const bSignal = signalRank[b.feedbackSignal ?? ''] ?? 3
    if (aSignal !== bSignal) return aSignal - bSignal
    return a.title.localeCompare(b.title, 'pl')
  })

  const openSessions = sortedSessions.filter((session) => !session.completed)
  const doneSessions = sortedSessions.filter((session) => session.completed)

  return (
    <Card className="p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold">Dziś w planie</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:max-w-[240px] lg:justify-end">
          {sessions.length > 0 && (
            <span
              className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium"
              style={{ background: 'rgba(46,204,113,0.1)', color: todayCompleted > 0 ? '#2ECC71' : 'var(--text-muted)' }}
            >
              {todayCompleted}/{sessions.length} wykonane
            </span>
          )}
          <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            {sessions.length} {plural(sessions.length, 'sesja', 'sesje', 'sesji')}
          </span>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
          <div className="text-3xl mb-2">🌿</div>
          <div className="text-sm">Na dziś nie ma zaplanowanych sesji.</div>
          <Link href="/coach/planner" className="inline-flex mt-4 px-3 py-2 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
            Otwórz planer
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {openSessions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: '#FF5C1B' }}>
                  Oczekują na realizację
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {openSessions.length} {plural(openSessions.length, 'sesja jest jeszcze otwarta', 'sesje są jeszcze otwarte', 'sesji jest jeszcze otwartych')}
                </div>
              </div>
              <div className="space-y-2">
                {openSessions.map((session) => {
                  const athlete = session.athletes
                  const badge = feedbackBadge(session)
                  return (
                    <Link
                      key={session.id}
                      href={`/coach/planner?athlete=${session.athlete_id}`}
                      className="flex items-center gap-3 p-3 rounded-xl transition-opacity hover:opacity-80"
                      style={{ background: 'var(--bg-elevated)', border: badge ? `1px solid ${badge.bg}` : '1px solid transparent' }}
                    >
                      <Avatar initials={athlete?.avatar ?? '?'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{athlete?.name ?? '—'}</div>
                        <div className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{session.title}</div>
                        <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{sessionMetaLabel(session)}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${intensityColor(session.type as SessionType)}`}>
                          {sessionTypeLabel(session.type as SessionType)}
                        </span>
                        {badge && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ color: badge.color, background: badge.bg }}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {doneSessions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: '#2ECC71' }}>
                  Zrealizowane dziś
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Sesje zamknięte przez zawodników
                </div>
              </div>
              <div className="space-y-2">
                {doneSessions.map((session) => {
                  const athlete = session.athletes
                  const badge = feedbackBadge(session)
                  return (
                    <Link
                      key={session.id}
                      href={`/coach/planner?athlete=${session.athlete_id}`}
                      className="flex items-center gap-3 p-3 rounded-xl transition-opacity hover:opacity-80"
                      style={{ background: 'rgba(46,204,113,0.06)', border: '1px solid rgba(46,204,113,0.12)' }}
                    >
                      <Avatar initials={athlete?.avatar ?? '?'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{athlete?.name ?? '—'}</div>
                        <div className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{session.title}</div>
                        <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {session.planned_distance ? `${session.planned_distance} km · ` : ''}zamknięte {formatDate(session.date, { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: '#2ECC71', background: 'rgba(46,204,113,0.12)' }}>
                          Wykonane
                        </span>
                        {badge && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ color: badge.color, background: badge.bg }}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
