'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatDate, formatCurrency, invoiceStatusColor, invoiceStatusLabel } from '@/lib/utils'
import { createInvoice } from '@/lib/actions/invoices'
import { InvoiceStatus } from '@/lib/types'

type Filter = 'all' | InvoiceStatus

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function InvoicesClient({ invoices, athletes }: { invoices: any[]; athletes: any[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ athleteId: athletes[0]?.id ?? '', description: '', amount: '', dueDate: '' })

  const filtered = invoices.filter(inv => filter === 'all' || inv.status === filter)

  const totals = {
    paid: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
    pending: invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0),
    overdue: invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0),
  }

  async function handleCreate() {
    if (!form.athleteId || !form.amount || submitting) return
    setSubmitting(true)
    const fd = new FormData()
    fd.set('athlete_id', form.athleteId)
    fd.set('description', form.description)
    fd.set('amount', form.amount)
    if (form.dueDate) fd.set('due_date', form.dueDate)
    const selectedAthlete = athletes.find(a => a.id === form.athleteId)
    if (selectedAthlete) fd.set('package', selectedAthlete.package)
    await createInvoice(null, fd)
    setModalOpen(false)
    setForm({ athleteId: athletes[0]?.id ?? '', description: '', amount: '', dueDate: '' })
    setSubmitting(false)
    startTransition(() => router.refresh())
  }

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Wszystkie' },
    { id: 'pending', label: 'Oczekujące' },
    { id: 'paid', label: 'Opłacone' },
    { id: 'overdue', label: 'Przeterminowane' },
    { id: 'cancelled', label: 'Anulowane' },
  ]

  return (
    <div>
      <CoachTopbar
        title="Faktury"
        actions={<Button size="sm" onClick={() => setModalOpen(true)}>+ Nowa faktura</Button>}
      />
      <div className="p-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Opłacone</div>
            <div className="text-xl font-bold text-green-400">{formatCurrency(totals.paid)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Oczekujące</div>
            <div className="text-xl font-bold text-yellow-400">{formatCurrency(totals.pending)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Przeterminowane</div>
            <div className="text-xl font-bold text-red-400">{formatCurrency(totals.overdue)}</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
              style={{
                background: filter === f.id ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)',
                color: filter === f.id ? '#FF5C1B' : 'var(--text-muted)',
                border: filter === f.id ? '1px solid rgba(255,92,27,0.3)' : '1px solid var(--border)',
              }}>
              {f.label} ({invoices.filter(i => f.id === 'all' || i.status === f.id).length})
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                {['Nr faktury', 'Zawodnik', 'Opis', 'Data', 'Termin', 'Kwota', 'Status'].map(h => (
                  <th key={h} className="text-left px-5 py-4 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Brak faktur</td></tr>
              )}
              {filtered.map((inv, i) => (
                <tr key={inv.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--bg-subtle)' : 'none' }}>
                  <td className="px-5 py-4 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{inv.number}</td>
                  <td className="px-5 py-4 text-xs font-medium">{inv.athletes?.name || '—'}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>{inv.description || '—'}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(inv.date, { day: 'numeric', month: 'short' })}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: inv.status === 'overdue' ? '#E74C3C' : 'var(--text-muted)' }}>
                    {formatDate(inv.due_date, { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold">{formatCurrency(inv.amount)}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${invoiceStatusColor(inv.status)}`}>
                      {invoiceStatusLabel(inv.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nowa faktura">
        <div className="space-y-4">
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Zawodnik</label>
            <select value={form.athleteId} onChange={e => setForm(f => ({ ...f, athleteId: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}>
              {athletes.map(a => <option key={a.id} value={a.id}>{a.name} — {a.package}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Opis</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="np. Plan Pro — Marzec 2026"
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Kwota (zł) *</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="np. 599"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Termin płatności</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Anuluj</Button>
            <Button onClick={handleCreate} disabled={!form.amount || submitting}>{submitting ? 'Tworzenie...' : 'Utwórz fakturę'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
