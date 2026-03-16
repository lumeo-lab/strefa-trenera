'use client'

import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { daysUntil, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import type { DashboardInvoiceRow, DashboardRaceRow } from '../types'

const INVOICE_STATUS_INFO: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Oczekuje', color: '#F1C40F' },
  paid:      { label: 'Opłacona', color: '#2ECC71' },
  overdue:   { label: 'Zaległa',  color: '#E74C3C' },
  cancelled: { label: 'Anulowana', color: '#8A92A8' },
}

// ── UpcomingRacesSection ─────────────────────────────────────────────────────

export function UpcomingRacesSection({ races }: {
  races: DashboardRaceRow[]
}) {
  if (races.length === 0) return null
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Nadchodzące zawody</h3>
        <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>14 dni</span>
      </div>
      <div className="space-y-2">
        {races.map((race) => {
          const ath = race.athletes
          const { days } = daysUntil(race.date)
          return (
            <Link key={race.id} href={`/coach/athletes/${race.athlete_id}`}
              className="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition-opacity"
              style={{ background: 'var(--bg-elevated)' }}>
              <Avatar initials={ath?.avatar ?? '?'} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{ath?.name ?? '—'}</div>
                <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {race.name}{race.distance ? ` · ${race.distance}` : ''}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-semibold" style={{ color: days === 0 ? '#E74C3C' : days <= 3 ? '#F39C12' : days <= 7 ? '#F1C40F' : 'var(--text-muted)' }}>
                  {days === 0 ? 'Dziś!' : days === 1 ? 'Jutro' : `za ${days} dni`}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(race.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}

// ── RecentInvoicesSection ────────────────────────────────────────────────────

export function RecentInvoicesSection({ recentInvoices }: {
  recentInvoices: DashboardInvoiceRow[]
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Ostatnie faktury</h3>
        <Link href="/coach/invoices" className="text-xs hover:opacity-80" style={{ color: '#FF5C1B' }}>Wszystkie →</Link>
      </div>
      {recentInvoices.length === 0 ? (
        <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>Brak faktur</div>
      ) : (
        <div className="space-y-2">
          {recentInvoices.map((inv) => {
            const ath = inv.athletes
            const st = INVOICE_STATUS_INFO[inv.status] ?? INVOICE_STATUS_INFO.pending
            return (
              <Link key={inv.id} href="/coach/invoices"
                className="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition-opacity"
                style={{ background: 'var(--bg-elevated)' }}>
                <Avatar initials={ath?.avatar ?? '?'} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{ath?.name ?? '—'}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{inv.number}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold">{formatCurrency(inv.amount)}</div>
                  <div className="text-xs font-medium" style={{ color: st.color }}>{st.label}</div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </Card>
  )
}
