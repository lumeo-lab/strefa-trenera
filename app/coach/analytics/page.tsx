import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getBusinessToday } from '@/lib/date'
import { shiftMonth } from '@/lib/calendar'
import { isInvoiceOverdue, isInvoicePending } from '@/lib/invoice-helpers'

export const metadata: Metadata = { title: 'Analityka | Strefa Trenera' }

type AnalyticsInvoice = {
  amount: number
  status: string
  date: string
  due_date: string | null
  athlete_id: string
}

const DEFAULT_TABLE_LIMIT = 12
const DEFAULT_ATHLETES_LIMIT = 10

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const coachId = user?.id ?? ''

  const today = getBusinessToday()
  const currentYM = today.slice(0, 7)

  const [{ data: athletes }, { data: invoices }] = await Promise.all([
    supabase.from('athletes').select('id, name, status, package, package_price, join_date, archived_at').eq('coach_id', coachId),
    supabase.from('invoices').select('amount, status, date, due_date, athlete_id').eq('coach_id', coachId).order('date'),
  ])

  const allAthletes = athletes ?? []
  const activeAthletes = allAthletes.filter(a => !a.archived_at)
  const allInvoices = (invoices ?? []) as AnalyticsInvoice[]

  // ── Empty state ─────────────────────────────────────────────────
  if (allInvoices.length === 0) {
    return (
      <div>
        <CoachTopbar title="Analityka finansowa" />
        <div className="p-6 max-w-5xl mx-auto">
          <EmptyState
            icon="📊"
            title="Analityka pojawi się gdy zaczniesz wystawiać faktury"
            description="Wystaw pierwszą fakturę w zakładce Faktury — tutaj zobaczysz trendy, przychody i statystyki finansowe."
          />
        </div>
      </div>
    )
  }

  // ── KPIs ──────────────────────────────────────────────────────
  const paidInvoices = allInvoices.filter(i => i.status === 'paid')
  const pendingInvoices = allInvoices.filter(i => isInvoicePending(i, today))
  const overdueInvoices = allInvoices.filter(i => isInvoiceOverdue(i, today))
  const totalPaid = paidInvoices.reduce((s, i) => s + i.amount, 0)
  const pendingAmount = pendingInvoices.reduce((s, i) => s + i.amount, 0)
  const overdueAmount = overdueInvoices.reduce((s, i) => s + i.amount, 0)

  // Current vs previous month
  const prevYM = shiftMonth(currentYM, -1)
  const currentMonthPaid = paidInvoices.filter(i => i.date.startsWith(currentYM)).reduce((s, i) => s + i.amount, 0)
  const prevMonthPaid = paidInvoices.filter(i => i.date.startsWith(prevYM)).reduce((s, i) => s + i.amount, 0)
  const revenueDelta = currentMonthPaid - prevMonthPaid

  // Active paying athletes (paid invoice in last 60 days)
  const sixtyDaysAgo = shiftMonth(currentYM, -2)
  const activePaying = new Set(
    paidInvoices.filter(i => i.date >= sixtyDaysAgo).map(i => i.athlete_id)
  ).size

  // ── Revenue by month (full history) ───────────────────────────
  const revenueByMonth = new Map<string, { paid: number; pending: number; overdue: number; count: number }>()
  revenueByMonth.set(currentYM, { paid: 0, pending: 0, overdue: 0, count: 0 })
  for (const inv of allInvoices) {
    const ym = inv.date.slice(0, 7)
    if (!revenueByMonth.has(ym)) revenueByMonth.set(ym, { paid: 0, pending: 0, overdue: 0, count: 0 })
    const entry = revenueByMonth.get(ym)!
    entry.count++
    if (inv.status === 'paid') entry.paid += inv.amount
    else if (isInvoicePending(inv, today)) entry.pending += inv.amount
    else if (isInvoiceOverdue(inv, today)) entry.overdue += inv.amount
  }

  const allMonthKeys = Array.from(revenueByMonth.keys()).sort()
  const last12Keys = allMonthKeys.slice(-12)
  const chartData = last12Keys.map(ym => {
    const [y, mo] = ym.split('-').map(Number)
    const label = new Date(y, mo - 1, 1).toLocaleDateString('pl-PL', { month: 'short' })
    return { ym, label, ...revenueByMonth.get(ym)! }
  })
  const hasPaidChartData = chartData.some((d) => d.paid > 0)
  const chartMaxPaid = Math.max(...chartData.map(d => d.paid), 1)

  // Grid lines for chart Y axis
  const gridLines = [0.25, 0.5, 0.75, 1].map(p => ({
    value: Math.round(chartMaxPaid * p),
    percent: p * 100,
  }))

  // ── Monthly table (full history, newest first, limited) ────────
  const tableDataAll = allMonthKeys.slice().reverse().map(ym => {
    const [y, mo] = ym.split('-').map(Number)
    const label = new Date(y, mo - 1, 1).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
    return { ym, label, ...revenueByMonth.get(ym)! }
  })
  const tableDataLimited = tableDataAll.slice(0, DEFAULT_TABLE_LIMIT)
  const hasMoreMonths = tableDataAll.length > DEFAULT_TABLE_LIMIT

  // ── Top athletes by revenue ───────────────────────────────────
  const athleteRevenue = new Map<string, { name: string; package: string; joinDate: string; paid: number; invoiceCount: number; avgMonthly: number }>()
  for (const a of allAthletes) {
    const monthsSinceJoin = Math.max(1, Math.ceil((new Date(today).getTime() - new Date(a.join_date).getTime()) / (30.44 * 86400000)))
    athleteRevenue.set(a.id, { name: a.name, package: a.package, joinDate: a.join_date, paid: 0, invoiceCount: 0, avgMonthly: 0 })
    // Will compute avgMonthly after collecting paid totals
    void monthsSinceJoin // used below
  }
  for (const inv of paidInvoices) {
    const entry = athleteRevenue.get(inv.athlete_id)
    if (entry) { entry.paid += inv.amount; entry.invoiceCount++ }
  }
  // Compute avg monthly
  for (const a of allAthletes) {
    const entry = athleteRevenue.get(a.id)
    if (entry && entry.invoiceCount > 0) {
      const monthsSinceJoin = Math.max(1, Math.ceil((new Date(today).getTime() - new Date(a.join_date).getTime()) / (30.44 * 86400000)))
      entry.avgMonthly = entry.paid / monthsSinceJoin
    }
  }

  const topAthletesAll = Array.from(athleteRevenue.entries())
    .map(([id, data]) => ({ id, ...data }))
    .filter(a => a.invoiceCount > 0)
    .sort((a, b) => b.paid - a.paid)
  const topAthletesLimited = topAthletesAll.slice(0, DEFAULT_ATHLETES_LIMIT)
  const hasMoreAthletes = topAthletesAll.length > DEFAULT_ATHLETES_LIMIT
  const topAthletesTotalPaid = topAthletesAll.reduce((s, a) => s + a.paid, 0)
  const topAthletesTotalInvoices = topAthletesAll.reduce((s, a) => s + a.invoiceCount, 0)

  // ── Package distribution ────────────────────────────────────
  const packageStats = new Map<string, { count: number; price: number; totalPaid: number }>()
  for (const a of activeAthletes) {
    if (!a.package) continue
    if (!packageStats.has(a.package)) packageStats.set(a.package, { count: 0, price: a.package_price, totalPaid: 0 })
    const entry = packageStats.get(a.package)!
    entry.count++
  }
  // Add paid revenue per package
  for (const inv of paidInvoices) {
    const athlete = allAthletes.find(a => a.id === inv.athlete_id)
    if (athlete?.package && packageStats.has(athlete.package)) {
      packageStats.get(athlete.package)!.totalPaid += inv.amount
    }
  }
  const packageDistribution = Array.from(packageStats.entries()).sort((a, b) => b[1].count - a[1].count)
  const totalPackageRevenue = packageDistribution.reduce((s, [, v]) => s + v.totalPaid, 0)

  const [currentYear, currentMonth] = currentYM.split('-').map(Number)
  const currentMonthLabel = new Date(currentYear, currentMonth - 1, 1).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })

  return (
    <div>
      <CoachTopbar title="Analityka finansowa" subtitle={currentMonthLabel} />

      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Opłacone w tym miesiącu</div>
            <div className="text-2xl font-bold mb-1" style={{ color: '#2ECC71' }}>{formatCurrency(currentMonthPaid)}</div>
            <div className="text-xs" style={{ color: revenueDelta >= 0 ? '#2ECC71' : '#E74C3C' }}>
              {revenueDelta === 0 ? 'Bez zmian vs poprzedni' : `${revenueDelta > 0 ? '+' : ''}${formatCurrency(revenueDelta)} vs poprzedni`}
            </div>
          </Card>
          <Card className="p-5">
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Opłacone łącznie</div>
            <div className="text-2xl font-bold mb-1" style={{ color: '#2ECC71' }}>{formatCurrency(totalPaid)}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{paidInvoices.length} faktur</div>
          </Card>
          <Card className="p-5">
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Oczekujące</div>
            <div className="text-2xl font-bold mb-1" style={{ color: '#F1C40F' }}>{formatCurrency(pendingAmount)}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{pendingInvoices.length} faktur</div>
          </Card>
          <Card className="p-5">
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Przeterminowane</div>
            <div className="text-2xl font-bold mb-1" style={{ color: '#E74C3C' }}>{formatCurrency(overdueAmount)}</div>
            <div className="text-xs" style={{ color: overdueAmount > 0 ? '#E74C3C' : 'var(--text-muted)' }}>
              {overdueAmount > 0 ? `${overdueInvoices.length} faktur` : 'Brak zaległości'}
            </div>
          </Card>
        </div>

        {/* Active paying summary */}
        <div className="flex items-center gap-4 px-4 py-3 rounded-2xl text-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Aktywni płacący zawodnicy:</span>
          <span className="font-bold">{activePaying}</span>
          {activePaying > 0 && (
            <>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span style={{ color: 'var(--text-muted)' }}>Śr. {formatCurrency(Math.round(totalPaid / activePaying))} / zawodnik</span>
            </>
          )}
        </div>

        {/* ── Revenue chart (last 12 months) ── */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Opłacone faktury per miesiąc</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Ostatnie 12 miesięcy</p>
            </div>
          </div>
          {chartData.length > 0 ? (
            hasPaidChartData ? (
            <div className="relative">
              {/* Y axis grid lines */}
              <div className="absolute inset-0 pointer-events-none" style={{ bottom: '24px', top: '20px' }}>
                {gridLines.map(line => (
                  <div key={line.percent} className="absolute w-full flex items-center" style={{ bottom: `${line.percent}%` }}>
                    <span className="text-[9px] w-12 text-right pr-2 shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {line.value >= 1000 ? `${Math.round(line.value / 1000)}k` : line.value}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)', opacity: 0.5 }} />
                  </div>
                ))}
              </div>
              <div className={`flex items-end gap-3 h-48 pl-14 ${chartData.length === 1 ? 'justify-center' : ''}`}>
                {chartData.map((d, i) => {
                  const height = chartMaxPaid > 0 ? (d.paid / chartMaxPaid) * 100 : 0
                  const isLast = i === chartData.length - 1
                  const isCurrent = d.ym === currentYM
                  return (
                    <div key={d.ym} className={`flex h-full flex-col items-center gap-1.5 min-w-0 ${chartData.length === 1 ? 'w-full max-w-[180px]' : 'flex-1'}`}>
                      <div className="text-xs font-semibold truncate w-full text-center" style={{ color: isCurrent ? '#FF5C1B' : 'var(--text-muted)', fontSize: '10px' }}>
                        {d.paid > 0 ? formatCurrency(d.paid) : '—'}
                      </div>
                      <div className="flex w-full flex-1 items-end">
                        <div className="w-full rounded-t-lg transition-all" style={{
                          height: `${Math.max(height, chartData.length === 1 ? 72 : 8)}%`,
                          background: isCurrent ? 'linear-gradient(180deg, #FF5C1B, #FF7A42)' : isLast ? 'var(--border-mid)' : 'var(--border)',
                          minHeight: '10px',
                        }} />
                      </div>
                      <div className="text-xs capitalize truncate w-full text-center" style={{ color: isCurrent ? '#FF5C1B' : 'var(--text-muted)', fontSize: '10px' }}>
                        {d.label}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            ) : (
              <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                Brak opłaconych faktur do pokazania na wykresie.
              </div>
            )
          ) : (
            <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Brak danych</div>
          )}
        </Card>

        {/* ── Monthly breakdown table ── */}
        {tableDataAll.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Przegląd miesięczny</h3>
            <div className="rounded-xl overflow-hidden overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Miesiąc</th>
                    <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: '#2ECC71' }}>Opłacone</th>
                    <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: '#F1C40F' }}>Oczekujące</th>
                    <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: '#E74C3C' }}>Przeterminowane</th>
                    <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Faktur</th>
                  </tr>
                </thead>
                <tbody>
                  {tableDataLimited.map((row, i) => {
                    const isCurrent = row.ym === currentYM
                    return (
                      <tr key={row.ym} style={{
                        borderBottom: i < tableDataLimited.length - 1 ? '1px solid var(--bg-subtle)' : 'none',
                        background: isCurrent ? 'rgba(255,92,27,0.04)' : undefined,
                      }}>
                        <td className="px-4 py-3 text-xs font-medium capitalize">
                          {row.label}
                          {isCurrent && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>bieżący</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-right font-semibold" style={{ color: '#2ECC71' }}>
                          {row.paid > 0 ? formatCurrency(row.paid) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-right" style={{ color: row.pending > 0 ? '#F1C40F' : 'var(--text-muted)' }}>
                          {row.pending > 0 ? formatCurrency(row.pending) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-right" style={{ color: row.overdue > 0 ? '#E74C3C' : 'var(--text-muted)' }}>
                          {row.overdue > 0 ? formatCurrency(row.overdue) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-right" style={{ color: 'var(--text-muted)' }}>{row.count}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--border)' }}>
                    <td className="px-4 py-3 text-xs font-bold">Razem</td>
                    <td className="px-4 py-3 text-xs text-right font-bold" style={{ color: '#2ECC71' }}>{formatCurrency(totalPaid)}</td>
                    <td className="px-4 py-3 text-xs text-right font-bold" style={{ color: '#F1C40F' }}>{formatCurrency(pendingAmount)}</td>
                    <td className="px-4 py-3 text-xs text-right font-bold" style={{ color: '#E74C3C' }}>{formatCurrency(overdueAmount)}</td>
                    <td className="px-4 py-3 text-xs text-right font-bold" style={{ color: 'var(--text-muted)' }}>{allInvoices.length}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {hasMoreMonths && (
              <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
                Wyświetlono {DEFAULT_TABLE_LIMIT} z {tableDataAll.length} miesięcy
              </p>
            )}
          </Card>
        )}

        {/* ── Top athletes by revenue ── */}
        {topAthletesAll.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Największy łączny opłacony przychód</h3>
            <div className="rounded-xl overflow-hidden overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>#</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Zawodnik</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Pakiet</th>
                    <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Łączny przychód</th>
                    <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Śr. / mies.</th>
                    <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Faktur</th>
                    <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Współpraca od</th>
                  </tr>
                </thead>
                <tbody>
                  {topAthletesLimited.map((a, i) => (
                    <tr key={a.id} style={{ borderBottom: i < topAthletesLimited.length - 1 ? '1px solid var(--bg-subtle)' : 'none' }}>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td className="px-4 py-3 text-xs font-medium">
                        <Link href={`/coach/athletes/${a.id}`} className="hover:underline">{a.name}</Link>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{a.package}</td>
                      <td className="px-4 py-3 text-xs text-right font-semibold" style={{ color: '#2ECC71' }}>{formatCurrency(a.paid)}</td>
                      <td className="px-4 py-3 text-xs text-right" style={{ color: 'var(--text-muted)' }}>{formatCurrency(Math.round(a.avgMonthly))}</td>
                      <td className="px-4 py-3 text-xs text-right" style={{ color: 'var(--text-muted)' }}>{a.invoiceCount}</td>
                      <td className="px-4 py-3 text-xs text-right" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(a.joinDate, { month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--border)' }}>
                    <td className="px-4 py-3 text-xs font-bold" colSpan={3}>Razem</td>
                    <td className="px-4 py-3 text-xs text-right font-bold" style={{ color: '#2ECC71' }}>{formatCurrency(topAthletesTotalPaid)}</td>
                    <td className="px-4 py-3 text-xs text-right" />
                    <td className="px-4 py-3 text-xs text-right font-bold" style={{ color: 'var(--text-muted)' }}>{topAthletesTotalInvoices}</td>
                    <td className="px-4 py-3 text-xs text-right" />
                  </tr>
                </tfoot>
              </table>
            </div>
            {hasMoreAthletes && (
              <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
                Wyświetlono top {DEFAULT_ATHLETES_LIMIT} z {topAthletesAll.length} zawodników
              </p>
            )}
          </Card>
        )}

        {/* ── Package distribution with revenue ── */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Pakiety</h3>
          {packageDistribution.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>Brak zawodników z przypisanym pakietem</p>
          ) : (
            <div className={`grid gap-4 ${packageDistribution.length <= 2 ? 'grid-cols-2' : packageDistribution.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
              {packageDistribution.map(([pkg, stats]) => (
                <div key={pkg} className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="text-base font-bold mb-0.5">{pkg}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {stats.count} zawodników · {activeAthletes.length > 0 ? Math.round((stats.count / activeAthletes.length) * 100) : 0}%
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {formatCurrency(stats.price)} / mies. za pakiet
                  </div>
                  <div className="text-xs mt-1 font-medium" style={{ color: '#2ECC71' }}>
                    {formatCurrency(stats.totalPaid)} opłacone
                    {totalPackageRevenue > 0 && <span style={{ color: 'var(--text-muted)' }}> · {Math.round((stats.totalPaid / totalPackageRevenue) * 100)}% przychodu</span>}
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
