'use client'

import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { formatCurrency, plural } from '@/lib/utils'
import Link from 'next/link'
import type { DashboardInvoiceRow, DashboardRaceRow } from '../types'

const INVOICE_STATUS_INFO: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Oczekuje', color: '#F1C40F' },
  paid:      { label: 'Opłacona', color: '#2ECC71' },
  overdue:   { label: 'Zaległa',  color: '#E74C3C' },
  cancelled: { label: 'Anulowana', color: '#8A92A8' },
}

function diffDays(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T12:00:00Z`).getTime()
  const to = new Date(`${toIso}T12:00:00Z`).getTime()
  return Math.round((to - from) / 86400000)
}

function raceTimingLabel(raceDate: string, todayIso: string) {
  const days = diffDays(todayIso, raceDate)
  if (days === 0) return { label: 'Dziś!', color: '#E74C3C' }
  if (days === 1) return { label: 'Jutro', color: '#F39C12' }
  if (days <= 7) return { label: `Za ${days} dni`, color: '#F1C40F' }
  return { label: `Za ${days} dni`, color: 'var(--text-muted)' }
}

function overdueLabel(dueDate: string, todayIso: string) {
  const days = diffDays(dueDate, todayIso)
  if (days <= 0) return 'Termin mija dziś'
  if (days === 1) return 'Termin minął wczoraj'
  return `Termin minął ${days} dni temu`
}

// ── UpcomingRacesSection ─────────────────────────────────────────────────────

export function UpcomingRacesSection({ races, todayIso }: {
  races: DashboardRaceRow[]
  todayIso: string
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
          const timing = raceTimingLabel(race.date, todayIso)
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
                <div className="text-xs font-semibold" style={{ color: timing.color }}>
                  {timing.label}
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

// ── OverdueInvoicesSection ───────────────────────────────────────────────────

export function OverdueInvoicesSection({ overdueInvoices, todayIso }: {
  overdueInvoices: DashboardInvoiceRow[]
  todayIso: string
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Płatności po terminie</h3>
        <Link href="/coach/invoices" className="text-xs hover:opacity-80" style={{ color: '#FF5C1B' }}>Wszystkie →</Link>
      </div>
      {overdueInvoices.length === 0 ? (
        <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Nie ma żadnych płatności po terminie.
        </div>
      ) : (
        <div className="space-y-2">
          {overdueInvoices.map((inv) => {
            const ath = inv.athletes
            const st = INVOICE_STATUS_INFO[inv.status] ?? INVOICE_STATUS_INFO.pending
            const overdueText = inv.due_date ? overdueLabel(inv.due_date, todayIso) : ''
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
                  {overdueText && (
                    <div className="text-xs" style={{ color: '#E74C3C' }}>
                      {overdueText}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
          {overdueInvoices.length > 0 && (
            <div className="pt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              {overdueInvoices.length} {plural(overdueInvoices.length, 'faktura wymaga', 'faktury wymagają', 'faktur wymaga')} pilnego kontaktu.
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
