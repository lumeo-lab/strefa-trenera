'use client'

import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { intensityColor, plural, sessionTypeLabel } from '@/lib/utils'
import type { SessionType } from '@/lib/types'
import Link from 'next/link'
import type { DashboardSessionRow } from '../types'

// ── WeekSummarySection ───────────────────────────────────────────────────────

export function WeekSummarySection({ weekStats }: {
  weekStats: { total: number; completed: number; km: number; rate: number }
}) {
  if (weekStats.total === 0) return null
  return (
    <Card className="px-5 py-3">
      <div className="flex items-center gap-1.5 flex-wrap text-xs">
        <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>Ten tydzień:</span>
        <span className="font-medium">{weekStats.total} {plural(weekStats.total, 'sesja', 'sesje', 'sesji')} w planie</span>
        <span style={{ color: 'var(--border)' }}>·</span>
        <span className="font-medium text-green-400">{weekStats.completed} ukończonych</span>
        <span style={{ color: 'var(--border)' }}>·</span>
        <span className="font-medium" style={{ color: weekStats.rate >= 70 ? '#2ECC71' : weekStats.rate >= 40 ? '#F1C40F' : '#E74C3C' }}>
          {weekStats.rate}% realizacji
        </span>
        {weekStats.km > 0 && (
          <>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span className="font-medium">🏃 {weekStats.km.toFixed(0)} km</span>
          </>
        )}
      </div>
    </Card>
  )
}

// ── TodayPlanSection ─────────────────────────────────────────────────────────

export function TodayPlanSection({ sessions, todayCompleted }: {
  sessions: DashboardSessionRow[]
  todayCompleted: number
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Dziś w planie</h3>
        <div className="flex items-center gap-2">
          {sessions.length > 0 && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{todayCompleted}/{sessions.length} wykonane</span>
          )}
          <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            {sessions.length} {plural(sessions.length, 'sesja', 'sesje', 'sesji')}
          </span>
        </div>
      </div>
      {sessions.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
          <div className="text-3xl mb-2">🌿</div>
          <div className="text-sm">Brak zaplanowanych sesji na dziś</div>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => {
            const ath = s.athletes
            return (
              <Link key={s.id} href={`/coach/athletes/${s.athlete_id}`}
                className="flex items-center gap-3 p-3 rounded-xl transition-opacity hover:opacity-80"
                style={{ background: 'var(--bg-elevated)' }}>
                <Avatar initials={ath?.avatar ?? '?'} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{ath?.name ?? '—'}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{s.title}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${intensityColor(s.type as SessionType)}`}>
                    {sessionTypeLabel(s.type as SessionType)}
                  </span>
                  {s.planned_distance && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.planned_distance} km</span>}
                  {s.completed ? <span className="text-xs text-green-400 font-bold">✓</span> : <span className="text-xs" style={{ color: 'var(--border)' }}>○</span>}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </Card>
  )
}
