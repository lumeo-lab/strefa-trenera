'use client'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { athletes, revenueHistory, businessKpis } from '@/lib/data'
import { formatCurrency } from '@/lib/utils'

export default function AnalyticsPage() {
  const maxRevenue = Math.max(...revenueHistory.map(r => r.amount))

  const retentionAlerts = athletes.filter(a => a.status === 'warning' || a.status === 'alert')

  return (
    <div>
      <CoachTopbar title="Analityka biznesowa" subtitle="Luty 2026" />

      <div className="p-6 space-y-6">
        {/* KPI grid */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'MRR', value: formatCurrency(businessKpis.mrr), trend: '+12% vs. styczeń', up: true },
            { label: 'Aktywni zawodnicy', value: businessKpis.activeAthletes, trend: '+1 w tym miesiącu', up: true },
            { label: 'Churn rate', value: `${businessKpis.churnRate}%`, trend: '−0.8% vs. poprzedni', up: false },
            { label: 'Średnie LTV', value: formatCurrency(businessKpis.avgLtv), trend: 'Na zawodnika', up: true },
            { label: 'Nowi w tym miesiącu', value: businessKpis.newThisMonth, trend: '', up: true },
            { label: 'Zaległości', value: formatCurrency(businessKpis.overdueAmount), trend: '2 faktury', up: false },
          ].map(kpi => (
            <Card key={kpi.label} className="p-5">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{kpi.label}</div>
              <div className="text-2xl font-bold mb-1">{kpi.value}</div>
              {kpi.trend && <div className="text-xs" style={{ color: kpi.up ? '#2ECC71' : '#E74C3C' }}>{kpi.trend}</div>}
            </Card>
          ))}
        </div>

        {/* Revenue chart */}
        <Card className="p-6">
          <h3 className="font-semibold mb-6">Przychody miesięczne (ostatnie 6 miesięcy)</h3>
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
                  <div className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                    {rev.month.split(' ')[0].slice(0, 3)}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Athletes activity chart */}
        <Card className="p-6">
          <h3 className="font-semibold mb-6">Zawodnicy wg statusu</h3>
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
                {(() => {
                  const statuses = [
                    { count: athletes.filter(a => a.status === 'ok').length, color: '#2ECC71' },
                    { count: athletes.filter(a => a.status === 'warning').length, color: '#F1C40F' },
                    { count: athletes.filter(a => a.status === 'alert').length, color: '#E74C3C' },
                  ]
                  const total = statuses.reduce((s, st) => s + st.count, 0)
                  let offset = 0
                  return statuses.map((st, i) => {
                    const pct = (st.count / total) * 100
                    const dash = pct * 31.416 / 100
                    const el = (
                      <circle key={i} cx="16" cy="16" r="10"
                        fill="none" stroke={st.color} strokeWidth="4"
                        strokeDasharray={`${dash} ${31.416 - dash}`}
                        strokeDashoffset={-offset * 31.416 / 100}
                      />
                    )
                    offset += pct
                    return el
                  })
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold">{athletes.length}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>łącznie</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'OK — regularny trening', count: athletes.filter(a => a.status === 'ok').length, color: '#2ECC71' },
                { label: 'Uwaga — nieregularny', count: athletes.filter(a => a.status === 'warning').length, color: '#F1C40F' },
                { label: 'Alert — wymaga kontaktu', count: athletes.filter(a => a.status === 'alert').length, color: '#E74C3C' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                  <span className="font-bold text-sm ml-auto">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Retention alerts */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Alerty retencji</h3>
          {retentionAlerts.length === 0 ? (
            <div className="text-sm text-green-400">✓ Brak aktywnych alertów retencji</div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Zawodnik</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Ostatni kontakt</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Alert</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Ryzyko</th>
                  </tr>
                </thead>
                <tbody>
                  {retentionAlerts.map((athlete, i) => (
                    <tr key={athlete.id} style={{ borderBottom: i < retentionAlerts.length - 1 ? '1px solid var(--bg-subtle)' : 'none' }}>
                      <td className="px-4 py-3 font-medium text-xs">{athlete.name}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {athlete.lastContact === 0 ? 'dziś' : `${athlete.lastContact} dni temu`}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{athlete.alertMessage || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{
                          background: athlete.status === 'alert' ? 'rgba(231,76,60,0.15)' : 'rgba(241,196,15,0.15)',
                          color: athlete.status === 'alert' ? '#E74C3C' : '#F1C40F',
                        }}>
                          {athlete.status === 'alert' ? '🔴 Wysokie' : '🟡 Średnie'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
