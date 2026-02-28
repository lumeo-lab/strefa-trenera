'use client'
import { useState } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { invoices as initialInvoices, athletes } from '@/lib/data'
import { Invoice, InvoiceStatus } from '@/lib/types'
import { formatDate, formatCurrency, invoiceStatusColor, invoiceStatusLabel } from '@/lib/utils'

type Filter = 'all' | InvoiceStatus

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState(initialInvoices)
  const [filter, setFilter] = useState<Filter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ athleteId: 'a1', description: '', amount: '', dueDate: '' })

  const filtered = invoices.filter(inv => filter === 'all' || inv.status === filter)
    .sort((a, b) => b.date.localeCompare(a.date))

  const totals = {
    paid: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
    pending: invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0),
    overdue: invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0),
  }

  function handleCreate() {
    const athlete = athletes.find(a => a.id === form.athleteId)
    if (!athlete || !form.amount) return
    const newInv: Invoice = {
      id: `i${Date.now()}`,
      athleteId: form.athleteId,
      number: `FV/2026/${String(invoices.length + 1).padStart(3, '0')}`,
      date: '2026-02-28',
      dueDate: form.dueDate || '2026-03-14',
      amount: parseFloat(form.amount),
      status: 'pending',
      package: athlete.package,
      description: form.description || `Plan ${athlete.package} — ${athlete.name}`,
    }
    setInvoices(prev => [...prev, newInv])
    setModalOpen(false)
    setForm({ athleteId: 'a1', description: '', amount: '', dueDate: '' })
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
            <div className="text-xs mb-1" style={{ color: '#8A92A8' }}>Opłacone</div>
            <div className="text-xl font-bold text-green-400">{formatCurrency(totals.paid)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs mb-1" style={{ color: '#8A92A8' }}>Oczekujące</div>
            <div className="text-xl font-bold text-yellow-400">{formatCurrency(totals.pending)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs mb-1" style={{ color: '#8A92A8' }}>Przeterminowane</div>
            <div className="text-xl font-bold text-red-400">{formatCurrency(totals.overdue)}</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
              style={{
                background: filter === f.id ? 'rgba(255,92,27,0.15)' : 'rgba(255,255,255,0.05)',
                color: filter === f.id ? '#FF5C1B' : '#8A92A8',
                border: filter === f.id ? '1px solid rgba(255,92,27,0.3)' : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {f.label} ({invoices.filter(i => f.id === 'all' || i.status === f.id).length})
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#161920', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <th className="text-left px-5 py-4 font-medium text-xs" style={{ color: '#8A92A8' }}>Nr faktury</th>
                <th className="text-left px-5 py-4 font-medium text-xs" style={{ color: '#8A92A8' }}>Zawodnik</th>
                <th className="text-left px-5 py-4 font-medium text-xs" style={{ color: '#8A92A8' }}>Opis</th>
                <th className="text-left px-5 py-4 font-medium text-xs" style={{ color: '#8A92A8' }}>Data</th>
                <th className="text-left px-5 py-4 font-medium text-xs" style={{ color: '#8A92A8' }}>Termin</th>
                <th className="text-left px-5 py-4 font-medium text-xs" style={{ color: '#8A92A8' }}>Kwota</th>
                <th className="text-left px-5 py-4 font-medium text-xs" style={{ color: '#8A92A8' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => {
                const athlete = athletes.find(a => a.id === inv.athleteId)
                return (
                  <tr key={inv.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td className="px-5 py-4 text-xs font-mono" style={{ color: '#8A92A8' }}>{inv.number}</td>
                    <td className="px-5 py-4 text-xs font-medium">{athlete?.name || '—'}</td>
                    <td className="px-5 py-4 text-xs" style={{ color: '#8A92A8' }}>{inv.description}</td>
                    <td className="px-5 py-4 text-xs" style={{ color: '#8A92A8' }}>{formatDate(inv.date, { day: 'numeric', month: 'short' })}</td>
                    <td className="px-5 py-4 text-xs" style={{ color: inv.status === 'overdue' ? '#E74C3C' : '#8A92A8' }}>
                      {formatDate(inv.dueDate, { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold">{formatCurrency(inv.amount)}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${invoiceStatusColor(inv.status)}`}>
                        {invoiceStatusLabel(inv.status)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nowa faktura">
        <div className="space-y-4">
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#8A92A8' }}>Zawodnik</label>
            <select
              value={form.athleteId}
              onChange={e => setForm(f => ({ ...f, athleteId: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ background: '#1E2330', border: '1px solid rgba(255,255,255,0.1)', color: '#E8EAF0' }}
            >
              {athletes.map(a => <option key={a.id} value={a.id}>{a.name} — {a.package}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#8A92A8' }}>Opis</label>
            <input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="np. Plan Pro — Marzec 2026"
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ background: '#1E2330', border: '1px solid rgba(255,255,255,0.1)', color: '#E8EAF0' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#8A92A8' }}>Kwota (zł) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="np. 599"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: '#1E2330', border: '1px solid rgba(255,255,255,0.1)', color: '#E8EAF0' }}
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#8A92A8' }}>Termin płatności</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: '#1E2330', border: '1px solid rgba(255,255,255,0.1)', color: '#E8EAF0' }}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Anuluj</Button>
            <Button onClick={handleCreate} disabled={!form.amount}>Utwórz fakturę</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
