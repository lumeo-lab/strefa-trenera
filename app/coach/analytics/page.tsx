import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CoachTopbar } from '@/components/coach/CoachTopbar'

export const metadata: Metadata = { title: 'Analityka | Strefa Trenera' }
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const [{ data: athletes }, { data: invoices }] = await Promise.all([
    supabase.from('athletes').select('id, name, status, package, package_price, join_date'),
    supabase.from('invoices').select('amount, status, date').order('date'),
  ])

  const allAthletes = athletes ?? []
  const allInvoices = invoices ?? []

  const activeAthletes = allAthletes.filter(a => a.status !== 'inactive').length
  const mrr = allAthletes.filter(a => a.status !== 'inactive').reduce((s, a) => s + a.package_price, 0)
  const overdueAmount = allInvoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0)
  const pendingAmount = allInvoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0)
  const totalPaid = allInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const retentionAlerts = allAthletes.filter(a => a.status === 'warning' || a.status === 'alert')

  // Revenue by month (last 6 months from invoices)
  const revenueByMonth: Record<string, number> = {}
  for (const inv of allInvoices.filter(i => i.status === 'paid')) {
    const month = inv.date.slice(0, 7)
    revenueByMonth[month] = (revenueByMonth[month] || 0) + inv.amount
  }
  const sortedMonths = Object.keys(revenueByMonth).sort().slice(-6)
  const revenueHistory = sortedMonths.map(m => {
    const [y, mo] = m.split('-').map(Number)
    const label = new Date(y, mo - 1, 1).toLocaleDateString('pl-PL', { month: 'short' })
    return { month: label, amount: revenueByMonth[m] }
  })
  const maxRevenue = Math.max(...revenueHistory.map(r => r.amount), 1)

  const currentMonth = new Date().toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })

  return (
    <div>
      <CoachTopbar title="Analityka biznesowa" subtitle={currentMonth} />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* KPI grid */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Przychód miesięczny', value: formatCurrency(mrr), trend: 'Suma pakietów aktywnych zawodników', up: true },
            { label: 'Aktywni zawodnicy', value: activeAthletes, trend: `${allAthletes.length} łącznie`, up: true },
            { label: 'Oczekujące płatności', value: formatCurrency(pendingAmount), trend: 'Do opłacenia', up: false },
            { label: 'Zaległości', value: formatCurrency(overdueAmount), trend: 'Przeterminowane faktury', up: false },
            { label: 'Łączne przychody', value: formatCurrency(totalPaid), trend: 'Wszystkie faktury', up: true },
            { label: 'Alerty', value: retentionAlerts.length, trend: 'Zawodnicy wymagający uwagi', up: retentionAlerts.length === 0 },
          ].map(kpi => (
            <Card key={kpi.label} className="p-5">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{kpi.label}</div>
              <div className="text-2xl font-bold mb-1">{kpi.value}</div>
              {kpi.trend && <div className="text-xs" style={{ color: kpi.up ? '#2ECC71' : '#E74C3C' }}>{kpi.trend}</div>}
            </Card>
          ))}
        </div>

        {/* Revenue chart */}
        {revenueHistory.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-6">Przychody miesięczne (opłacone faktury)</h3>
            <div className="flex items-end gap-4 h-48">
              {revenueHistory.map((rev, i) => {
                const height = (rev.amount / maxRevenue) * 100
                const isLast = i === revenueHistory.length - 1
                return (
                  <div key={rev.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs font-semibold" style={{ color: isLast ? '#FF5C1B' : 'var(--text-muted)' }}>
                      {formatCurrency(rev.amount)}
                    </div>
                    <div className="w-full rounded-t-xl transition-all" style={{
                      height: `${height}%`,
                      background: isLast ? 'linear-gradient(180deg, #FF5C1B, #FF7A42)' : 'var(--border-mid)',
                      minHeight: '4px',
                    }} />
                    <div className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{rev.month}</div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Retention alerts */}
        {retentionAlerts.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold mb-4 text-red-400">⚠️ Zawodnicy wymagający uwagi</h3>
            <div className="space-y-3">
              {retentionAlerts.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                  <div>
                    <div className="font-medium text-sm">{a.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.package}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${a.status === 'alert' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                    {a.status === 'alert' ? '🔴 Alert' : '🟡 Uwaga'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Package distribution */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Zawodnicy według pakietów</h3>
          {(() => {
            const pkgNames = Array.from(new Set(allAthletes.map(a => a.package).filter(Boolean))).sort()
            const colClass = pkgNames.length <= 2 ? 'grid-cols-2' : pkgNames.length <= 4 ? 'grid-cols-4' : 'grid-cols-3'
            if (pkgNames.length === 0) return (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>Brak zawodników z przypisanym pakietem</p>
            )
            return (
              <div className={`grid ${colClass} gap-4`}>
                {pkgNames.map(pkg => {
                  const count = allAthletes.filter(a => a.package === pkg).length
                  return (
                    <div key={pkg} className="text-center p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                      <div className="text-2xl font-bold mb-1">{count}</div>
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{pkg}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {Math.round((count / allAthletes.length) * 100)}%
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </Card>
      </div>
    </div>
  )
}
