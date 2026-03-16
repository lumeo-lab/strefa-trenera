import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { getBusinessToday } from '@/lib/date'

export const metadata: Metadata = { title: 'Analityka | Strefa Trenera' }

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const coachId = user?.id ?? ''

  const today = getBusinessToday()
  const currentYM = today.slice(0, 7) // YYYY-MM
  const prevMonth = (() => {
    const [y, m] = currentYM.split('-').map(Number)
    const pm = m === 1 ? 12 : m - 1
    const py = m === 1 ? y - 1 : y
    return `${py}-${String(pm).padStart(2, '0')}`
  })()

  const [{ data: athletes }, { data: invoices }, { data: sessions }] = await Promise.all([
    supabase.from('athletes').select('id, name, status, package, package_price, join_date').eq('coach_id', coachId),
    supabase.from('invoices').select('amount, status, date').eq('coach_id', coachId).order('date'),
    supabase.from('training_sessions').select('id, date, completed, actual_distance, athlete_id').eq('coach_id', coachId).gte('date', `${prevMonth}-01`),
  ])

  const allAthletes = athletes ?? []
  const allInvoices = invoices ?? []
  const allSessions = sessions ?? []

  // ── Financial KPIs ──────────────────────────────────────────────
  const activeAthletes = allAthletes.filter(a => a.status !== 'inactive')
  const mrr = activeAthletes.reduce((s, a) => s + a.package_price, 0)
  const overdueAmount = allInvoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0)
  const pendingAmount = allInvoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0)
  const totalPaid = allInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)

  // Previous month revenue for trend
  const prevMonthPaid = allInvoices.filter(i => i.status === 'paid' && i.date.startsWith(prevMonth)).reduce((s, i) => s + i.amount, 0)
  const currentMonthPaid = allInvoices.filter(i => i.status === 'paid' && i.date.startsWith(currentYM)).reduce((s, i) => s + i.amount, 0)
  const revenueDelta = currentMonthPaid - prevMonthPaid

  // ── Training KPIs ──────────────────────────────────────────────
  const currentMonthSessions = allSessions.filter(s => s.date.startsWith(currentYM))
  const prevMonthSessions = allSessions.filter(s => s.date.startsWith(prevMonth))
  const sessionsPlanned = currentMonthSessions.length
  const sessionsCompleted = currentMonthSessions.filter(s => s.completed).length
  const completionRate = sessionsPlanned > 0 ? Math.round((sessionsCompleted / sessionsPlanned) * 100) : 0
  const totalKm = currentMonthSessions.filter(s => s.completed && s.actual_distance).reduce((s, sess) => s + (sess.actual_distance ?? 0), 0)
  const prevCompletionRate = prevMonthSessions.length > 0
    ? Math.round((prevMonthSessions.filter(s => s.completed).length / prevMonthSessions.length) * 100)
    : 0
  const completionDelta = completionRate - prevCompletionRate

  // ── Retention alerts ───────────────────────────────────────────
  const retentionAlerts = allAthletes.filter(a => a.status === 'warning' || a.status === 'alert')

  // ── Revenue chart (last 6 months, always include current month) ─
  const revenueByMonth: Record<string, number> = {}
  // Ensure current month is always present
  revenueByMonth[currentYM] = 0
  for (const inv of allInvoices.filter(i => i.status === 'paid')) {
    const month = inv.date.slice(0, 7)
    revenueByMonth[month] = (revenueByMonth[month] || 0) + inv.amount
  }
  const sortedMonths = Object.keys(revenueByMonth).sort().slice(-6)
  const revenueHistory = sortedMonths.map(m => {
    const [y, mo] = m.split('-').map(Number)
    const label = new Date(y, mo - 1, 1).toLocaleDateString('pl-PL', { month: 'short' })
    return { month: label, amount: revenueByMonth[m], key: m }
  })
  const maxRevenue = Math.max(...revenueHistory.map(r => r.amount), 1)

  // ── Package distribution ───────────────────────────────────────
  const packageMap = new Map<string, number>()
  for (const a of allAthletes) {
    if (a.package) packageMap.set(a.package, (packageMap.get(a.package) ?? 0) + 1)
  }
  const packageDistribution = Array.from(packageMap.entries()).sort((a, b) => b[1] - a[1])

  const currentMonthLabel = new Date().toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })

  function trendText(delta: number, unit: string): string {
    if (delta === 0) return `Bez zmian vs poprzedni miesiąc`
    const sign = delta > 0 ? '+' : ''
    return `${sign}${delta}${unit} vs poprzedni miesiąc`
  }

  return (
    <div>
      <CoachTopbar title="Analityka" subtitle={currentMonthLabel} />

      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* ── Financial KPIs ── */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>Finanse</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Przychód miesięczny (MRR)</div>
              <div className="text-2xl font-bold mb-1">{formatCurrency(mrr)}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{activeAthletes.length} aktywnych zawodników</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Ten miesiąc (opłacone)</div>
              <div className="text-2xl font-bold mb-1">{formatCurrency(currentMonthPaid)}</div>
              <div className="text-xs" style={{ color: revenueDelta >= 0 ? '#2ECC71' : '#E74C3C' }}>
                {trendText(revenueDelta, ' zł')}
              </div>
            </Card>
            <Card className="p-5">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Łączne przychody</div>
              <div className="text-2xl font-bold mb-1">{formatCurrency(totalPaid)}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Wszystkie opłacone faktury</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Oczekujące</div>
              <div className="text-2xl font-bold mb-1" style={{ color: pendingAmount > 0 ? '#F1C40F' : 'var(--text-primary)' }}>
                {formatCurrency(pendingAmount)}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Do opłacenia</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Zaległości</div>
              <div className="text-2xl font-bold mb-1" style={{ color: overdueAmount > 0 ? '#E74C3C' : '#2ECC71' }}>
                {formatCurrency(overdueAmount)}
              </div>
              <div className="text-xs" style={{ color: overdueAmount > 0 ? '#E74C3C' : '#2ECC71' }}>
                {overdueAmount > 0 ? 'Przeterminowane faktury' : 'Brak zaległości'}
              </div>
            </Card>
            <Card className="p-5">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Alerty retencji</div>
              <div className="text-2xl font-bold mb-1" style={{ color: retentionAlerts.length > 0 ? '#E74C3C' : '#2ECC71' }}>
                {retentionAlerts.length}
              </div>
              <div className="text-xs" style={{ color: retentionAlerts.length > 0 ? '#E74C3C' : '#2ECC71' }}>
                {retentionAlerts.length > 0 ? 'Wymagają uwagi' : 'Wszyscy w normie'}
              </div>
            </Card>
          </div>
        </div>

        {/* ── Training KPIs ── */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>Treningi (bieżący miesiąc)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Zaplanowane</div>
              <div className="text-2xl font-bold mb-1">{sessionsPlanned}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>sesji w tym miesiącu</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Zrealizowane</div>
              <div className="text-2xl font-bold mb-1">{sessionsCompleted}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>z {sessionsPlanned} zaplanowanych</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Realizacja</div>
              <div className="text-2xl font-bold mb-1" style={{ color: completionRate >= 70 ? '#2ECC71' : completionRate >= 40 ? '#F1C40F' : '#E74C3C' }}>
                {completionRate}%
              </div>
              <div className="text-xs" style={{ color: completionDelta >= 0 ? '#2ECC71' : '#E74C3C' }}>
                {trendText(completionDelta, '%')}
              </div>
            </Card>
            <Card className="p-5">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Łącznie km</div>
              <div className="text-2xl font-bold mb-1">{Math.round(totalKm * 10) / 10}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>przebiegniętych w tym miesiącu</div>
            </Card>
          </div>
        </div>

        {/* ── Revenue chart ── */}
        <Card className="p-6">
          <h3 className="font-semibold mb-6">Przychody miesięczne (opłacone faktury)</h3>
          {revenueHistory.length > 0 ? (
            <div className="flex items-end gap-4 h-48">
              {revenueHistory.map((rev, i) => {
                const height = maxRevenue > 0 ? (rev.amount / maxRevenue) * 100 : 0
                const isLast = i === revenueHistory.length - 1
                return (
                  <div key={rev.key} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs font-semibold" style={{ color: isLast ? '#FF5C1B' : 'var(--text-muted)' }}>
                      {formatCurrency(rev.amount)}
                    </div>
                    <div className="w-full rounded-t-xl transition-all" style={{
                      height: `${Math.max(height, 2)}%`,
                      background: isLast ? 'linear-gradient(180deg, #FF5C1B, #FF7A42)' : 'var(--border-mid)',
                      minHeight: '4px',
                    }} />
                    <div className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{rev.month}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Brak danych</div>
          )}
        </Card>

        {/* ── Retention alerts ── */}
        {retentionAlerts.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold mb-4 text-red-400">Zawodnicy wymagający uwagi</h3>
            <div className="space-y-2">
              {retentionAlerts.map(a => (
                <Link key={a.id} href={`/coach/athletes/${a.id}`}
                  className="flex items-center justify-between p-3 rounded-xl transition-opacity hover:opacity-80"
                  style={{ background: 'var(--bg-elevated)' }}>
                  <div>
                    <div className="font-medium text-sm">{a.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.package}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${a.status === 'alert' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                    {a.status === 'alert' ? 'Alert' : 'Uwaga'}
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* ── Package distribution ── */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Zawodnicy według pakietów</h3>
          {packageDistribution.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>Brak zawodników z przypisanym pakietem</p>
          ) : (
            <div className={`grid gap-4 ${packageDistribution.length <= 2 ? 'grid-cols-2' : packageDistribution.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
              {packageDistribution.map(([pkg, count]) => (
                <div key={pkg} className="text-center p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="text-2xl font-bold mb-1">{count}</div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{pkg}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {allAthletes.length > 0 ? Math.round((count / allAthletes.length) * 100) : 0}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
