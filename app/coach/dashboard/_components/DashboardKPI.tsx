'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { formatCurrency, plural } from '@/lib/utils'
import type { KpiId } from './useDashboardPrefs'
import type { DashboardAlertItem } from './types'

function KpiCardLink({
  href,
  children,
  tone = 'neutral',
}: {
  href: string
  children: React.ReactNode
  tone?: 'neutral' | 'warning' | 'danger' | 'positive'
}) {
  const toneStyles = {
    neutral: {
      border: 'var(--border)',
      shadow: '0 0 0 1px rgba(255,255,255,0.01)',
    },
    warning: {
      border: 'rgba(241,196,15,0.28)',
      shadow: '0 10px 24px rgba(241,196,15,0.06)',
    },
    danger: {
      border: 'rgba(231,76,60,0.3)',
      shadow: '0 10px 24px rgba(231,76,60,0.08)',
    },
    positive: {
      border: 'rgba(46,204,113,0.24)',
      shadow: '0 10px 24px rgba(46,204,113,0.06)',
    },
  } as const

  return (
    <Link href={href} className="block rounded-2xl group focus-visible:outline-none">
      <Card
        className="p-4 cursor-pointer transition-all duration-200 group-hover:-translate-y-0.5 group-hover:opacity-100 group-hover:border-transparent group-hover:ring-1 group-hover:ring-[rgba(255,92,27,0.35)] group-focus-visible:ring-2 group-focus-visible:ring-[rgba(255,92,27,0.45)]"
      >
        <div
          className="rounded-[inherit]"
          style={{
            margin: '-16px',
            padding: '16px',
            borderRadius: 'inherit',
            border: `1px solid ${toneStyles[tone].border}`,
            boxShadow: toneStyles[tone].shadow,
          }}
        >
          {children}
        </div>
      </Card>
    </Link>
  )
}

interface DashboardKPIProps {
  visibleKpi: { id: KpiId; visible: boolean }[]
  activeCount: number
  archivedAthleteCount: number
  alertAthletes: DashboardAlertItem[]
  totalUnread: number
  estimatedMonthlyRevenue: number
  pendingAmount: number
  overdueAmount: number
  pendingCount: number
  overdueCount: number
}

export function DashboardKPI({
  visibleKpi,
  activeCount,
  archivedAthleteCount,
  alertAthletes,
  totalUnread,
  estimatedMonthlyRevenue,
  pendingAmount,
  overdueAmount,
  pendingCount,
  overdueCount,
}: DashboardKPIProps) {
  function renderKpi(id: KpiId) {
    switch (id) {
      case 'athletes': return (
        <KpiCardLink href="/coach/athletes" tone={alertAthletes.length > 0 ? 'warning' : 'positive'}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg shrink-0">👟</span>
                <div className="text-xs font-medium truncate" style={{ color: 'var(--text-muted)' }}>Aktywni zawodnicy</div>
              </div>
              {alertAthletes.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>
                  {alertAthletes.length} {plural(alertAthletes.length, 'alert', 'alerty', 'alertów')}
                </span>
              )}
            </div>
            <div className="text-[1.7rem] leading-none font-bold mb-2">{activeCount}</div>
            <div className="text-xs font-medium" style={{ color: archivedAthleteCount > 0 ? '#F39C12' : '#2ECC71' }}>
              {archivedAthleteCount > 0 ? `${archivedAthleteCount} archiwalnych` : 'Brak archiwalnych'}
            </div>
        </KpiCardLink>
      )
      case 'feedback': return (
        <KpiCardLink href="/coach/feedback" tone={totalUnread >= 3 ? 'danger' : totalUnread > 0 ? 'warning' : 'positive'}>
            <div className="flex items-center gap-2 mb-3 min-w-0">
              <span className="text-lg shrink-0">📥</span>
              <div className="text-xs font-medium truncate" style={{ color: 'var(--text-muted)' }}>Feedback do przeczytania</div>
            </div>
            <div className="text-[1.7rem] leading-none font-bold mb-2">{totalUnread}</div>
            <div className="text-xs font-medium" style={{ color: totalUnread >= 3 ? '#E74C3C' : totalUnread > 0 ? '#F1C40F' : '#2ECC71' }}>
              {totalUnread >= 3 ? 'Wysoki priorytet' : totalUnread > 0 ? 'Wymaga uwagi' : 'Wszystko odczytane'}
            </div>
        </KpiCardLink>
      )
      case 'revenue': return (
        <KpiCardLink href="/coach/analytics" tone="neutral">
            <div className="flex items-center gap-2 mb-3 min-w-0">
              <span className="text-lg shrink-0">💰</span>
              <div className="text-xs font-medium truncate" style={{ color: 'var(--text-muted)' }}>Szacowany przychód w miesiącu</div>
            </div>
            <div className="text-[1.7rem] leading-none font-bold mb-2">{formatCurrency(estimatedMonthlyRevenue)}</div>
            <div className="text-xs font-medium" style={{ color: '#FF5C1B' }}>Na podstawie aktywnych pakietów</div>
        </KpiCardLink>
      )
      case 'payments': return (
        <KpiCardLink href="/coach/invoices" tone={overdueAmount > 0 ? 'danger' : pendingAmount > 0 ? 'warning' : 'positive'}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg shrink-0">💳</span>
                <div className="text-xs font-medium truncate" style={{ color: 'var(--text-muted)' }}>Faktury do opłacenia</div>
              </div>
              {overdueAmount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>Po terminie</span>
              )}
            </div>
            <div className="text-[1.7rem] leading-none font-bold mb-2" style={{ color: overdueAmount > 0 ? '#E74C3C' : 'inherit' }}>
              {formatCurrency(pendingAmount + overdueAmount)}
            </div>
            <div className="text-xs font-medium" style={{ color: overdueAmount > 0 ? '#E74C3C' : pendingAmount > 0 ? '#F1C40F' : '#2ECC71' }}>
              {overdueAmount > 0
                ? `${overdueCount} po terminie płatności`
                : pendingAmount > 0
                ? `${pendingCount} czekają na wpłatę`
                : 'Brak zaległości'}
            </div>
        </KpiCardLink>
      )
    }
  }

  if (visibleKpi.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {visibleKpi.map(k => (
        <div key={k.id}>{renderKpi(k.id)}</div>
      ))}
    </div>
  )
}
