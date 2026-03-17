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
    <Card className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="font-semibold">Podsumowanie bieżącego tygodnia</h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Szybki przegląd tego, ile treningów jest już zrealizowanych.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 min-w-0">
          <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-elevated)' }}>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Zaplanowane</div>
            <div className="mt-1 text-sm font-semibold">{weekStats.total} {plural(weekStats.total, 'sesja', 'sesje', 'sesji')}</div>
          </div>
          <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-elevated)' }}>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Wykonane</div>
            <div className="mt-1 text-sm font-semibold text-green-400">{weekStats.completed}</div>
          </div>
          <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-elevated)' }}>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Realizacja planu</div>
            <div className="mt-1 text-sm font-semibold" style={{ color: weekStats.rate >= 70 ? '#2ECC71' : weekStats.rate >= 40 ? '#F1C40F' : '#E74C3C' }}>
              {weekStats.rate}%
            </div>
          </div>
          <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-elevated)' }}>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Pokonane kilometry</div>
            <div className="mt-1 text-sm font-semibold">{weekStats.km.toFixed(0)} km</div>
          </div>
        </div>
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
          <div className="text-sm">Na dziś nie ma zaplanowanych sesji.</div>
          <Link href="/coach/planner" className="inline-flex mt-4 px-3 py-2 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
            Otwórz planer
          </Link>
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
