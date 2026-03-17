'use client'

import { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { InvoiceStatusDropdown } from '@/components/ui/InvoiceStatusDropdown'
import { getBusinessToday } from '@/lib/date'
import { formatCurrency, formatDate, invoiceStatusLabel } from '@/lib/utils'
import { createInvoice, deleteInvoice, getInvoiceAttachmentUrl, updateInvoice, updateInvoiceStatus } from '@/lib/actions/invoices'
import { InvoiceStatus } from '@/lib/types'
import type { InvoiceRow } from '@/lib/supabase/database.types'
import { INPUT_STYLE } from '@/lib/styles'

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

const STATUS_OPTIONS: InvoiceStatus[] = ['pending', 'paid', 'overdue', 'cancelled']

const inputStyle = INPUT_STYLE
const labelStyle = { color: 'var(--text-muted)' }

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

export function InvoicesClient({ invoices, athletes }: { invoices: InvoiceWithJoins[]; athletes: AthleteOption[] }) {
  const router = useRouter()
  const today = getBusinessToday()

  // ── Filter & sort ────────────────────────────────────────────────
  const [filter, setFilter] = useState<Filter>('all')
  const [athleteFilter, setAthleteFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [statusMessage, setStatusMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  // ── Local invoice state (optimistic status updates) ───────────────
  const [localInvoices, setLocalInvoices] = useState(invoices)
  useEffect(() => setLocalInvoices(invoices), [invoices])
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
    setStatusMessage(null)
    try {
      const result = await updateInvoiceStatus(invId, next, athleteId)
      if (result?.error) {
        setLocalInvoices(ls => ls.map(i => i.id === invId ? { ...i, status: prev } : i))
        setStatusMessage({ tone: 'error', text: result.error ?? 'Nie udało się zmienić statusu faktury.' })
      } else {
        setStatusMessage({ tone: 'success', text: `Status faktury został zmieniony na „${invoiceStatusLabel(next)}”.` })
        startTransition(() => router.refresh())
      }
    } finally {
      setStatusChangingId(null)
    }
  }

  async function handleDownloadAttachment(invId: string) {
    if (downloadingId) return
    setDownloadingId(invId)
    setStatusMessage(null)
    try {
      const result = await getInvoiceAttachmentUrl(invId)
      if (result?.success && result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer')
      } else {
        setStatusMessage({ tone: 'error', text: result?.error ?? 'Nie udało się pobrać załącznika.' })
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

  // ── Create modal ─────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState({
    athleteId: athletes[0]?.id ?? '',
    description: '',
    amount: athletes[0]?.package_price ? String(athletes[0].package_price) : '',
    dueDate: '',
  })
  const fileRef = useRef<HTMLInputElement>(null)

  // Auto-fill amount when athlete changes in create form
  function handleCreateAthleteChange(athleteId: string) {
    const ath = athletes.find(a => a.id === athleteId)
    setCreateForm(f => ({
      ...f,
      athleteId,
      amount: ath?.package_price ? String(ath.package_price) : f.amount,
    }))
  }

  async function handleCreate() {
    if (!createForm.athleteId || !createForm.amount || submitting) return
    setSubmitting(true)
    setCreateError(null)
    const fd = new FormData()
    fd.set('athlete_id', createForm.athleteId)
    fd.set('description', createForm.description)
    fd.set('amount', createForm.amount)
    if (createForm.dueDate) fd.set('due_date', createForm.dueDate)
    const selectedAthlete = athletes.find(a => a.id === createForm.athleteId)
    if (selectedAthlete) fd.set('package', selectedAthlete.package)
    const file = fileRef.current?.files?.[0]
    if (file) fd.set('attachment', file)
    const result = await createInvoice(null, fd)
    if (result && 'error' in result) {
      setCreateError(result.error ?? 'Nie udało się utworzyć faktury')
      setSubmitting(false)
      return
    }
    setCreateOpen(false)
    setCreateForm({ athleteId: athletes[0]?.id ?? '', description: '', amount: athletes[0]?.package_price ? String(athletes[0].package_price) : '', dueDate: '' })
    setCreateError(null)
    setStatusMessage({ tone: 'success', text: 'Faktura została utworzona.' })
    if (fileRef.current) fileRef.current.value = ''
    setSubmitting(false)
    startTransition(() => router.refresh())
  }

  // ── Edit modal ───────────────────────────────────────────────────
  const [editingInvoice, setEditingInvoice] = useState<InvoiceWithJoins | null>(null)
  const [editForm, setEditForm] = useState({ description: '', amount: '', dueDate: '', status: '' })
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function openEdit(inv: InvoiceWithJoins) {
    setEditingInvoice(inv)
    setEditForm({
      description: inv.description ?? '',
      amount: String(inv.amount),
      dueDate: inv.due_date ?? '',
      status: inv.status,
    })
    setConfirmingDelete(false)
    setEditError(null)
  }

  function closeEdit() {
    setEditingInvoice(null)
    setConfirmingDelete(false)
    setEditError(null)
  }

  const [editError, setEditError] = useState<string | null>(null)

  async function handleUpdate() {
    if (!editingInvoice || saving) return
    setSaving(true)
    setEditError(null)
    const result = await updateInvoice(editingInvoice.id, {
      description: editForm.description || undefined,
      amount: parseFloat(editForm.amount),
      due_date: editForm.dueDate || undefined,
      status: editForm.status,
    })
    if (result && 'error' in result) {
      setEditError(result.error ?? 'Nie udało się zapisać zmian')
      setSaving(false)
      return
    }
    closeEdit()
    setStatusMessage({ tone: 'success', text: 'Zmiany faktury zostały zapisane.' })
    setSaving(false)
    startTransition(() => router.refresh())
  }

  async function handleDelete() {
    if (!editingInvoice || saving) return
    setSaving(true)
    setEditError(null)
    const result = await deleteInvoice(editingInvoice.id)
    if (result && 'error' in result) {
      setEditError(result.error ?? 'Nie udało się usunąć faktury')
      setSaving(false)
      return
    }
    closeEdit()
    setStatusMessage({ tone: 'success', text: 'Faktura została usunięta.' })
    setSaving(false)
    startTransition(() => router.refresh())
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

  return (
    <div>
      <CoachTopbar
        title="Faktury"
        actions={<Button size="sm" onClick={() => setCreateOpen(true)}>+ Nowa faktura</Button>}
      />
      <div className="p-6">
        {statusMessage && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm"
            style={{
              background: statusMessage.tone === 'success' ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)',
              border: `1px solid ${statusMessage.tone === 'success' ? 'rgba(46,204,113,0.25)' : 'rgba(231,76,60,0.25)'}`,
              color: statusMessage.tone === 'success' ? '#2ECC71' : '#E74C3C',
            }}
          >
            {statusMessage.text}
          </div>
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
            <div className="grid gap-3 md:grid-cols-[minmax(280px,1fr)_260px] xl:w-[560px]">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Szukaj po numerze, zawodniku lub opisie..."
                className="px-3 py-2 rounded-xl text-sm w-full"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              <select
                value={athleteFilter}
                onChange={e => setAthleteFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm cursor-pointer"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
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
      <Modal open={!!confirmCancelId} onClose={() => setConfirmCancelId(null)} title="Anulowanie faktury">
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Czy na pewno chcesz anulować tę fakturę? Status zmieni się na &quot;Anulowana&quot;.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setConfirmCancelId(null)}>Nie, wróć</Button>
          <Button variant="danger" onClick={() => {
            if (!confirmCancelId) return
            const inv = localInvoices.find(i => i.id === confirmCancelId)
            void doStatusChange(confirmCancelId, inv?.athlete_id, 'cancelled')
          }}>
            Tak, anuluj fakturę
          </Button>
        </div>
      </Modal>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setCreateError(null) }} title="Nowa faktura">
        <div className="space-y-4">
          <div>
            <label className="text-xs mb-1.5 block" style={labelStyle}>Zawodnik</label>
            <select value={createForm.athleteId}
              onChange={e => handleCreateAthleteChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle}>
              {athletes.map(a => <option key={a.id} value={a.id}>{a.name} — {a.package} ({formatCurrency(a.package_price)})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={labelStyle}>Opis</label>
            <input value={createForm.description}
              onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
              placeholder="np. Plan Pro — Marzec 2026"
              className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block" style={labelStyle}>Kwota (zł) *</label>
              <input type="number" value={createForm.amount}
                onChange={e => setCreateForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="np. 599"
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={labelStyle}>Termin płatności</label>
              <input type="date" value={createForm.dueDate}
                onChange={e => setCreateForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={labelStyle}>Załącznik (opcjonalnie, PDF / JPG / PNG)</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full text-xs cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            />
          </div>
          {createError && (
            <div className="text-xs text-red-400">{createError}</div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setCreateOpen(false); setCreateError(null) }}>Anuluj</Button>
            <Button onClick={handleCreate} disabled={!createForm.amount || submitting}>
              {submitting ? 'Tworzenie...' : 'Utwórz fakturę'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editingInvoice} onClose={closeEdit} title={`Faktura ${editingInvoice?.number ?? ''}`}>
        <div className="space-y-4">
          <div>
            <label className="text-xs mb-1.5 block" style={labelStyle}>Opis</label>
            <input value={editForm.description}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block" style={labelStyle}>Kwota (zł)</label>
              <input type="number" min="0.01" step="0.01" value={editForm.amount}
                onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={labelStyle}>Termin płatności</label>
              <input type="date" value={editForm.dueDate}
                onChange={e => setEditForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={labelStyle}>Status</label>
            <select value={editForm.status}
              onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-sm cursor-pointer" style={inputStyle}>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{invoiceStatusLabel(s)}</option>
              ))}
            </select>
          </div>
          {editError && (
            <div className="text-xs text-red-400">{editError}</div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={closeEdit}>Anuluj</Button>
            <Button onClick={handleUpdate} disabled={!editForm.amount || saving}>
              {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </Button>
          </div>
          {/* Delete zone */}
          <div className="pt-3 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
            {!confirmingDelete ? (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="text-xs cursor-pointer hover:opacity-80"
                style={{ color: '#E74C3C', background: 'none', border: 'none' }}
              >
                Usuń fakturę
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Na pewno usunąć?</span>
                <Button variant="danger" size="sm" onClick={handleDelete} disabled={saving}>
                  {saving ? '...' : 'Tak, usuń'}
                </Button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="text-xs cursor-pointer"
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none' }}
                >
                  Anuluj
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
