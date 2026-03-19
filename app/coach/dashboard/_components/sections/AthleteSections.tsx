'use client'

import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import Link from 'next/link'
import type { DashboardAlertItem, DashboardAthleteRow } from '../types'

const ATHLETE_STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  alert:   { label: 'Alert',  color: '#E74C3C', bg: 'rgba(231,76,60,0.1)' },
  warning: { label: 'Uwaga',  color: '#F39C12', bg: 'rgba(243,156,18,0.1)' },
}

// ── AlertsSection ────────────────────────────────────────────────────────────

export function AlertsSection({ alertAthletes }: {
  alertAthletes: DashboardAlertItem[]
}) {
  if (alertAthletes.length === 0) return null
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Wymagają uwagi</h3>
        <Link href="/coach/athletes" className="text-xs hover:opacity-80" style={{ color: '#FF5C1B' }}>Wszyscy →</Link>
      </div>
      <div className="space-y-2">
        {alertAthletes.map(({ athlete, primaryReason, extraReasonCount }) => {
          const info = ATHLETE_STATUS_INFO[athlete.status]
          return (
            <Link key={athlete.id} href={`/coach/athletes/${athlete.id}`}
              className="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition-opacity"
              style={{ background: 'var(--bg-elevated)' }}>
              <Avatar initials={athlete.avatar} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{athlete.name}</div>
                <div className="mt-0.5 text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {primaryReason}
                  {extraReasonCount > 0 ? ` · +${extraReasonCount} innych sygnałów` : ''}
                </div>
              </div>
              {info && <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: info.bg, color: info.color }}>{info.label}</span>}
            </Link>
          )
        })}
      </div>
    </Card>
  )
}

// ── NoSessionsSection ────────────────────────────────────────────────────────

export function NoSessionsSection({ noSessionsAthletes }: {
  noSessionsAthletes: DashboardAthleteRow[]
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Bez planu do końca tygodnia</h3>
        <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
          {noSessionsAthletes.length}
        </span>
      </div>
      {noSessionsAthletes.length === 0 ? (
        <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          ✅ Wszyscy aktywni zawodnicy mają już plan od dziś do końca tygodnia.
        </div>
      ) : (
        <div className="space-y-2">
          {noSessionsAthletes.slice(0, 6).map((a) => (
            <Link key={a.id} href={`/coach/planner?athlete=${a.id}`}
              className="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition-opacity"
              style={{ background: 'var(--bg-elevated)' }}>
              <Avatar initials={a.avatar} size="sm" />
              <div className="flex-1 text-sm font-medium">{a.name}</div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>brak sesji</span>
            </Link>
          ))}
          {noSessionsAthletes.length > 6 && (
            <div className="text-xs text-center pt-1" style={{ color: 'var(--text-muted)' }}>
              i {noSessionsAthletes.length - 6} więcej
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// ── RecentAthletesSection ────────────────────────────────────────────────────

export function RecentAthletesSection({ recentAthletesData }: {
  recentAthletesData: DashboardAthleteRow[]
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Ostatnio dodani zawodnicy</h3>
        <Link href="/coach/athletes" className="text-xs hover:opacity-80" style={{ color: '#FF5C1B' }}>Wszyscy →</Link>
      </div>
      {recentAthletesData.length === 0 ? (
        <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>Brak zawodników</div>
      ) : (
        <div className="space-y-2">
          {recentAthletesData.map((a) => (
            <Link key={a.id} href={`/coach/athletes/${a.id}`}
              className="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition-opacity"
              style={{ background: 'var(--bg-elevated)' }}>
              <Avatar initials={a.avatar} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{a.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.package}</div>
              </div>
              <div className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                {a.created_at ? new Date(a.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }) : ''}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  )
}
