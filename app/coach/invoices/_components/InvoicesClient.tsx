'use client'

import { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import { useStatusMessage } from '@/lib/hooks/useStatusMessage'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusMessage } from '@/components/ui/StatusMessage'
import { InvoiceStatusDropdown } from '@/components/ui/InvoiceStatusDropdown'
import { getBusinessToday } from '@/lib/date'
import { formatCurrency, formatDate, invoiceStatusLabel } from '@/lib/utils'
import { getInvoiceAttachmentUrl, updateInvoiceStatus } from '@/lib/actions/invoices'
import { InvoiceStatus } from '@/lib/types'
import type { InvoiceRow } from '@/lib/supabase/database.types'
import { SELECT_STYLE } from '@/lib/styles'
import { InvoiceCreateModal } from './InvoiceCreateModal'
import { InvoiceEditModal } from './InvoiceEditModal'

type InvoiceWithJoins = InvoiceRow & {
  athletes: { id: string; name: string; package: string } | null
}

type AthleteOption = {
  id: string
  name: string
  package: string
  package_price: number
}

type Filter = 'all' | 'pending' | 'paid' | 'overdue'
type SortKey = 'number' | 'athlete' | 'date' | 'due_date' | 'amount' | 'status'

function isInvoiceOverdue(invoice: InvoiceWithJoins, today: string) {
  if (invoice.status === 'paid' || invoice.status === 'cancelled') return false
  if (invoice.status === 'overdue') return true
  return !!invoice.due_date && invoice.due_date < today
}

function isInvoicePending(invoice: InvoiceWithJoins, today: string) {
  return invoice.status !== 'paid' && invoice.status !== 'cancelled' && !isInvoiceOverdue(invoice, today)
}

function overdueMeta(dueDate: string | null, today: string) {
  if (!dueDate || dueDate >= today) return null
  const due = new Date(`${dueDate}T12:00:00Z`)
  const now = new Date(`${today}T12:00:00Z`)
  const diff = Math.floor((now.getTime() - due.getTime()) / 86400000)
  if (diff <= 0) return null
  return `${diff} ${diff === 1 ? 'dzień' : 'dni'} po terminie`
}

export function InvoicesClient({
  invoices,
  athletes,
  initialAthleteId = '',
}: {
  invoices: InvoiceWithJoins[]
  athletes: AthleteOption[]
  initialAthleteId?: string
}) {
  const router = useRouter()
  const today = getBusinessToday()
  const filtersContainerRef = useRef<HTMLDivElement>(null)
  const filtersMeasureRef = useRef<HTMLDivElement>(null)

  // ── Filter & sort ────────────────────────────────────────────────
  const [filter, setFilter] = useState<Filter>('all')
  const [athleteFilter, setAthleteFilter] = useState<string>(initialAthleteId || 'all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const { statusMessage, showStatus, clearStatus } = useStatusMessage()
  const [compactFilters, setCompactFilters] = useState(false)

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  // ── Local invoice state (optimistic status updates) ───────────────
  const [localInvoices, setLocalInvoices] = useState(invoices)
  useEffect(() => setLocalInvoices(invoices), [invoices])
  useEffect(() => {
    setAthleteFilter(initialAthleteId || 'all')
  }, [initialAthleteId])
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  async function handleStatusChange(invId: string, athleteId: string | undefined, next: InvoiceStatus) {
    // Confirm before cancelling
    if (next === 'cancelled') {
      setConfirmCancelId(invId)
      return
    }
    await doStatusChange(invId, athleteId, next)
  }

  async function doStatusChange(invId: string, athleteId: string | undefined, next: InvoiceStatus) {
    const prev = localInvoices.find(i => i.id === invId)?.status as InvoiceStatus
    setLocalInvoices(ls => ls.map(i => i.id === invId ? { ...i, status: next } : i))
    setStatusChangingId(invId)
    setConfirmCancelId(null)
    clearStatus()
    try {
      const result = await updateInvoiceStatus(invId, next, athleteId)
      if (result && 'error' in result) {
        setLocalInvoices(ls => ls.map(i => i.id === invId ? { ...i, status: prev } : i))
        showStatus('error', result.error ?? 'Nie udało się zmienić statusu faktury.')
      } else {
        showStatus('success', `Status faktury został zmieniony na „${invoiceStatusLabel(next)}”.`)
        startTransition(() => router.refresh())
      }
    } finally {
      setStatusChangingId(null)
    }
  }

  async function handleDownloadAttachment(invId: string) {
    if (downloadingId) return
    setDownloadingId(invId)
    clearStatus()
    try {
      const result = await getInvoiceAttachmentUrl(invId)
      if (result?.success && result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer')
      } else {
        showStatus('error', 'Nie udało się pobrać załącznika.')
      }
    } finally {
      setDownloadingId(null)
    }
  }

  // ── Derived data ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = localInvoices
    if (athleteFilter !== 'all') list = list.filter(inv => inv.athlete_id === athleteFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((inv) =>
        inv.number.toLowerCase().includes(q) ||
        (inv.description ?? '').toLowerCase().includes(q) ||
        (inv.athletes?.name ?? '').toLowerCase().includes(q)
      )
    }
    if (filter === 'pending') list = list.filter(inv => isInvoicePending(inv, today))
    else if (filter === 'paid') list = list.filter(inv => inv.status === 'paid')
    else if (filter === 'overdue') list = list.filter(inv => isInvoiceOverdue(inv, today))
    return list
  }, [localInvoices, filter, athleteFilter, search, today])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      let av: string | number = '', bv: string | number = ''
      if (sortKey === 'athlete') { av = a.athletes?.name ?? ''; bv = b.athletes?.name ?? '' }
      else if (sortKey === 'amount') { av = a.amount ?? 0; bv = b.amount ?? 0 }
      else { av = a[sortKey] ?? ''; bv = b[sortKey] ?? '' }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortKey, sortDir])

  // KPIs based on filtered view
  const totals = useMemo(() => ({
    paid: filtered.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
    pending: filtered.filter(i => isInvoicePending(i, today)).reduce((s, i) => s + i.amount, 0),
    overdue: filtered.filter(i => isInvoiceOverdue(i, today)).reduce((s, i) => s + i.amount, 0),
  }), [filtered, today])
  const totalDue = totals.pending + totals.overdue

  // Unique athletes that have invoices (for dropdown)
  const invoiceAthletes = useMemo(() => {
    const map = new Map<string, string>()
    for (const inv of localInvoices) {
      if (inv.athletes && !map.has(inv.athletes.id)) {
        map.set(inv.athletes.id, inv.athletes.name)
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], 'pl'))
  }, [localInvoices])

  // ── Modals ──────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<InvoiceWithJoins | null>(null)

  function openEdit(inv: InvoiceWithJoins) {
    setEditingInvoice(inv)
  }

  // ── Columns ──────────────────────────────────────────────────────
  const columns: { label: string; key: SortKey | null }[] = [
    { label: 'Nr faktury', key: 'number' },
    { label: 'Zawodnik', key: 'athlete' },
    { label: 'Opis', key: null },
    { label: 'Data', key: 'date' },
    { label: 'Termin / stan', key: 'due_date' },
    { label: 'Kwota', key: 'amount' },
    { label: 'Status', key: 'status' },
    { label: 'Załącznik', key: null },
    { label: '', key: null },
  ]

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Wszystkie' },
    { id: 'pending', label: 'Oczekujące' },
    { id: 'paid', label: 'Opłacone' },
    { id: 'overdue', label: 'Przeterminowane' },
  ]

  // Memoized filter counts (respecting athlete filter)
  const filterCounts = useMemo(() => {
    const base = athleteFilter !== 'all'
      ? localInvoices.filter(i => i.athlete_id === athleteFilter)
      : localInvoices
    const searchable = search.trim()
      ? base.filter((inv) => {
          const q = search.trim().toLowerCase()
          return (
            inv.number.toLowerCase().includes(q) ||
            (inv.description ?? '').toLowerCase().includes(q) ||
            (inv.athletes?.name ?? '').toLowerCase().includes(q)
          )
        })
      : base
    return {
      all: searchable.length,
      pending: searchable.filter(i => isInvoicePending(i, today)).length,
      paid: searchable.filter(i => i.status === 'paid').length,
      overdue: searchable.filter(i => isInvoiceOverdue(i, today)).length,
    }
  }, [localInvoices, athleteFilter, search, today])

  useEffect(() => {
    const container = filtersContainerRef.current
    const measure = filtersMeasureRef.current
    if (!container || !measure) return

    const updateLayout = () => {
      setCompactFilters(measure.scrollWidth > container.clientWidth)
    }

    updateLayout()

    const observer = new ResizeObserver(updateLayout)
    observer.observe(container)
    observer.observe(measure)
    window.addEventListener('resize', updateLayout)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateLayout)
    }
  }, [filterCounts.all, filterCounts.pending, filterCounts.paid, filterCounts.overdue])

  return (
    <div>
      <CoachTopbar
        title="Faktury"
        actions={<Button size="sm" onClick={() => setCreateOpen(true)}>+ Nowa faktura</Button>}
      />
      <div className="p-6">
        {statusMessage && (
          <StatusMessage tone={statusMessage.tone} text={statusMessage.text} className="mb-6" />
        )}

        {/* KPIs */}
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
          <Card className="p-4">
            <div className="text-xs mb-1 uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Przeterminowane</div>
            <div className="text-2xl font-bold text-red-400">{formatCurrency(totals.overdue)}</div>
            <div className="text-xs mt-1" style={{ color: totals.overdue > 0 ? '#E74C3C' : 'var(--text-muted)' }}>
              {totals.overdue > 0 ? 'Wymagają kontaktu' : 'Brak zaległości'}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs mb-1 uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Łącznie do zapłaty</div>
            <div className="text-2xl font-bold" style={{ color: totalDue > 0 ? '#FF5C1B' : 'var(--text-primary)' }}>{formatCurrency(totalDue)}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Oczekujące + po terminie</div>
          </Card>
        </div>

        {/* Filters row */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div ref={filtersContainerRef} className="relative min-w-0 xl:flex-1">
              <div ref={filtersMeasureRef} className="pointer-events-none invisible absolute flex gap-2 whitespace-nowrap">
                {filters.map(f => (
                  <span
                    key={f.id}
                    className="px-4 py-2 rounded-xl text-sm font-medium border"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {f.label} ({filterCounts[f.id]})
                  </span>
                ))}
              </div>
              {compactFilters ? (
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value as Filter)}
                  className="w-full max-w-[260px] rounded-xl px-3 py-2 text-sm cursor-pointer"
                  style={SELECT_STYLE}
                >
                  {filters.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.label} ({filterCounts[f.id]})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {filters.map(f => (
                    <button key={f.id} onClick={() => setFilter(f.id)}
                      className="px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
                      style={{
                        background: filter === f.id ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)',
                        color: filter === f.id ? '#FF5C1B' : 'var(--text-muted)',
                        border: filter === f.id ? '1px solid rgba(255,92,27,0.3)' : '1px solid var(--border)',
                      }}>
                      {f.label} ({filterCounts[f.id]})
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(280px,1fr)_260px] xl:w-[560px]">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Szukaj po numerze, zawodniku lub opisie..."
                className="px-3 py-2 rounded-xl text-sm w-full"
                style={SELECT_STYLE}
              />
              <select
                value={athleteFilter}
                onChange={e => setAthleteFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm cursor-pointer"
                style={SELECT_STYLE}
              >
                <option value="all">Wszyscy zawodnicy ({invoiceAthletes.length})</option>
                {invoiceAthletes.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm min-w-[920px]">
            <thead>
              <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                {columns.map((col) => (
                  <th
                    key={col.label}
                    onClick={() => col.key && handleSort(col.key)}
                    className="text-left px-5 py-4 font-medium text-xs select-none"
                    style={{
                      color: sortKey === col.key && col.key ? '#FF5C1B' : 'var(--text-muted)',
                      cursor: col.key ? 'pointer' : 'default',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col.label}
                    {col.key && (
                      <span className="ml-1" style={{ opacity: sortKey === col.key ? 1 : 0.3 }}>
                        {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    Brak faktur
                  </td>
                </tr>
              )}
              {sorted.map((inv, i) => {
                const overdue = isInvoiceOverdue(inv, today)
                const overdueText = overdueMeta(inv.due_date, today)
                return (
                <tr
                  key={inv.id}
                  className="transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ borderBottom: i < sorted.length - 1 ? '1px solid var(--bg-subtle)' : 'none' }}
                >
                  <td className="px-5 py-4 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{inv.number}</td>
                  <td className="px-5 py-4 text-xs font-medium">
                    {inv.athletes?.id ? (
                      <Link href={`/coach/athletes/${inv.athletes.id}`} className="hover:opacity-75 transition-opacity">
                        {inv.athletes.name}
                      </Link>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>{inv.description || '—'}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(inv.date, { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-5 py-4 text-xs" style={{ color: overdue ? '#E74C3C' : 'var(--text-muted)' }}>
                    <div>{inv.due_date ? formatDate(inv.due_date, { day: 'numeric', month: 'short' }) : '—'}</div>
                    {overdueText && (
                      <div className="mt-1 inline-flex rounded-full px-2 py-0.5 font-medium" style={{ color: '#E74C3C', background: 'rgba(231,76,60,0.12)' }}>
                        {overdueText}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold">{formatCurrency(inv.amount)}</td>
                  <td className="px-5 py-4">
                    <InvoiceStatusDropdown
                      status={inv.status as InvoiceStatus}
                      onChange={next => handleStatusChange(inv.id, inv.athlete_id, next)}
                      loading={statusChangingId === inv.id}
                    />
                  </td>
                  <td className="px-5 py-4 text-xs">
                    {inv.attachment_url
                      ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadAttachment(inv.id)}
                          className="text-orange-400 hover:underline cursor-pointer disabled:opacity-60"
                          disabled={downloadingId === inv.id}
                        >
                          {downloadingId === inv.id ? 'Pobieranie…' : 'Pobierz'}
                        </button>
                      )
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>
                    }
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => openEdit(inv)}
                      className="text-xs px-2 py-1 rounded-lg cursor-pointer transition-opacity hover:opacity-80"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                    >
                      Edytuj
                    </button>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm cancel modal */}
      <ConfirmDialog
        open={!!confirmCancelId}
        onClose={() => setConfirmCancelId(null)}
        onConfirm={() => {
          if (!confirmCancelId) return
          const inv = localInvoices.find(i => i.id === confirmCancelId)
          void doStatusChange(confirmCancelId, inv?.athlete_id, 'cancelled')
        }}
        title="Anulowanie faktury"
        message={'Czy na pewno chcesz anulować tę fakturę? Status zmieni się na „Anulowana".'}
        confirmLabel="Tak, anuluj fakturę"
      />

      <InvoiceCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        athletes={athletes}
        onCreated={() => {
          showStatus('success', 'Faktura została utworzona.')
          startTransition(() => router.refresh())
        }}
        onError={(msg) => showStatus('error', msg)}
      />

      {editingInvoice && (
        <InvoiceEditModal
          open={!!editingInvoice}
          onClose={() => setEditingInvoice(null)}
          invoiceId={editingInvoice.id}
          invoiceNumber={editingInvoice.number}
          initialValues={{
            description: editingInvoice.description ?? '',
            amount: String(editingInvoice.amount),
            dueDate: editingInvoice.due_date ?? '',
            status: editingInvoice.status,
          }}
          onSaved={() => {
            setEditingInvoice(null)
            showStatus('success', 'Zmiany faktury zostały zapisane.')
            startTransition(() => router.refresh())
          }}
          onDeleted={() => {
            setEditingInvoice(null)
            showStatus('success', 'Faktura została usunięta.')
            startTransition(() => router.refresh())
          }}
          onError={(msg) => showStatus('error', msg)}
        />
      )}
    </div>
  )
}
