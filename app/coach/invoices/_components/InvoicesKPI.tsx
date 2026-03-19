'use client'

import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'

type Totals = {
  paid: number
  pending: number
  overdue: number
  overdueCount: number
}

export function InvoicesKPI({ totals, totalDue }: { totals: Totals; totalDue: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <Card className="p-4">
        <div className="text-xs mb-1 uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Opłacone</div>
        <div className="text-2xl font-bold text-green-400">{formatCurrency(totals.paid)}</div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Wpłaty zaksięgowane</div>
      </Card>
      <Card className="p-4">
        <div className="text-xs mb-1 uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Oczekujące</div>
        <div className="text-2xl font-bold text-yellow-400">{formatCurrency(totals.pending)}</div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>W terminie płatności</div>
      </Card>
      <Card className={`p-4 ${totals.overdueCount > 0 ? 'border-l-3 border-l-red-500' : ''}`}>
        <div className="text-xs mb-1 uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Przeterminowane</div>
        <div className="text-2xl font-bold text-red-400">{formatCurrency(totals.overdue)}</div>
        <div className="text-xs mt-1" style={{ color: totals.overdueCount > 0 ? '#E74C3C' : 'var(--text-muted)' }}>
          {totals.overdueCount > 0 ? `${totals.overdueCount} ${totals.overdueCount === 1 ? 'faktura wymaga' : 'faktur wymaga'} kontaktu` : 'Brak zaległości'}
        </div>
      </Card>
      <Card className="p-4">
        <div className="text-xs mb-1 uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Łącznie do zapłaty</div>
        <div className="text-2xl font-bold" style={{ color: totalDue > 0 ? '#FF5C1B' : 'var(--text-primary)' }}>{formatCurrency(totalDue)}</div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Oczekujące + po terminie</div>
      </Card>
    </div>
  )
}
