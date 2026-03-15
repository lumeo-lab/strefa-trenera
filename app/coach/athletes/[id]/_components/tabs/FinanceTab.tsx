'use client'

import { useState, useRef, useEffect, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatDate, formatCurrency } from '@/lib/utils'
import { InvoiceStatus, DbRow } from '@/lib/types'
import { createInvoice, updateInvoiceStatus } from '@/lib/actions/invoices'
import { InvoiceStatusDropdown } from '@/components/ui/InvoiceStatusDropdown'
import { INPUT_STYLE } from '@/lib/styles'

const inputStyle = INPUT_STYLE

interface FinanceTabProps {
  athleteId: string
  athletePackage: string | null
  invoices: DbRow[]
}

export function FinanceTab({ athleteId, athletePackage, invoices: athleteInvoices }: FinanceTabProps) {
  const router = useRouter()
  const [localInvoices, setLocalInvoices] = useState(athleteInvoices)
  useEffect(() => setLocalInvoices(athleteInvoices), [athleteInvoices])
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [invoiceDraft, setInvoiceDraft] = useState({ description: '', amount: '', dueDate: '' })
  const [invoiceSaving, setInvoiceSaving] = useState(false)
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null)
  const invoiceFileRef = useRef<HTMLInputElement>(null)

  function closeInvoiceModal() {
    setInvoiceModalOpen(false)
    setInvoiceDraft({ description: '', amount: '', dueDate: '' })
    if (invoiceFileRef.current) invoiceFileRef.current.value = ''
  }

  async function changeInvoiceStatus(invId: string, next: InvoiceStatus) {
    const prev = localInvoices.find(i => i.id === invId)?.status as InvoiceStatus
    setLocalInvoices(ls => ls.map(i => i.id === invId ? { ...i, status: next } : i))
    setStatusChangingId(invId)
    try {
      const result = await updateInvoiceStatus(invId, next, athleteId)
      if (result?.error) {
        setLocalInvoices(ls => ls.map(i => i.id === invId ? { ...i, status: prev } : i))
      } else {
        startTransition(() => router.refresh())
      }
    } finally {
      setStatusChangingId(null)
    }
  }

  async function saveInvoice() {
    if (!invoiceDraft.amount || invoiceSaving) return
    setInvoiceSaving(true)
    try {
      const fd = new FormData()
      fd.set('athlete_id', athleteId)
      fd.set('description', invoiceDraft.description)
      fd.set('amount', invoiceDraft.amount)
      if (invoiceDraft.dueDate) fd.set('due_date', invoiceDraft.dueDate)
      if (athletePackage) fd.set('package', athletePackage)
      const file = invoiceFileRef.current?.files?.[0]
      if (file) fd.set('attachment', file)
      await createInvoice(null, fd)
      closeInvoiceModal()
      startTransition(() => router.refresh())
    } finally {
      setInvoiceSaving(false)
    }
  }

  const invoiceTotals = localInvoices.reduce(
    (acc, inv) => {
      if (inv.status === 'paid') acc.paid += inv.amount
      else if (inv.status === 'pending') acc.pending += inv.amount
      else if (inv.status === 'overdue') acc.overdue += inv.amount
      return acc
    },
    { paid: 0, pending: 0, overdue: 0 }
  )

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setInvoiceModalOpen(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
            style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
            + Nowa faktura
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Opłacono łącznie', value: formatCurrency(invoiceTotals.paid), color: 'text-green-400' },
            { label: 'Oczekujące', value: formatCurrency(invoiceTotals.pending), color: 'text-yellow-400' },
            { label: 'Przeterminowane', value: formatCurrency(invoiceTotals.overdue), color: 'text-red-400' },
            { label: 'Do zapłaty', value: formatCurrency(invoiceTotals.pending + invoiceTotals.overdue), color: invoiceTotals.pending + invoiceTotals.overdue > 0 ? 'text-red-400' : 'text-green-400' },
          ].map(kpi => (
            <Card key={kpi.label} className="p-4 text-center">
              <div className={`text-xl font-bold mb-1 ${kpi.color}`}>{kpi.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{kpi.label}</div>
            </Card>
          ))}
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                {['Nr faktury', 'Opis', 'Data', 'Termin', 'Kwota', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {localInvoices.map((inv, i) => (
                <tr key={inv.id} style={{ borderBottom: i < localInvoices.length - 1 ? '1px solid var(--bg-subtle)' : 'none' }}>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{inv.number}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{inv.description || '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(inv.date, { day: 'numeric', month: 'short' })}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: inv.status === 'overdue' ? '#E74C3C' : 'var(--text-muted)' }}>{formatDate(inv.due_date, { day: 'numeric', month: 'short' })}</td>
                  <td className="px-4 py-3 text-xs font-semibold">{formatCurrency(inv.amount)}</td>
                  <td className="px-4 py-3">
                    <InvoiceStatusDropdown
                      status={inv.status as InvoiceStatus}
                      onChange={next => changeInvoiceStatus(inv.id, next)}
                      loading={statusChangingId === inv.id}
                    />
                  </td>
                </tr>
              ))}
              {localInvoices.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Brak faktur</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      <Modal
        open={invoiceModalOpen}
        onClose={closeInvoiceModal}
        title="Nowa faktura"
        footer={
          <Button className="w-full" onClick={saveInvoice} disabled={!invoiceDraft.amount || invoiceSaving}>
            {invoiceSaving ? 'Zapisywanie...' : 'Wystaw fakturę'}
          </Button>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Opis</label>
            <input value={invoiceDraft.description} onChange={e => setInvoiceDraft(d => ({ ...d, description: e.target.value }))}
              placeholder="np. Trening personalny — marzec 2026"
              className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Kwota (PLN) *</label>
              <input type="number" min="0" step="0.01" value={invoiceDraft.amount}
                onChange={e => setInvoiceDraft(d => ({ ...d, amount: e.target.value }))}
                placeholder="np. 500"
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Termin płatności</label>
              <input type="date" value={invoiceDraft.dueDate} onChange={e => setInvoiceDraft(d => ({ ...d, dueDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Załącznik (opcjonalnie, PDF / JPG / PNG)</label>
            <input
              ref={invoiceFileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full text-xs cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            />
          </div>
          <div className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
            Pakiet: <span style={{ color: 'var(--text-primary)' }}>{athletePackage || '—'}</span>
            {!invoiceDraft.dueDate && <span className="ml-3">Brak terminu → +14 dni od dziś</span>}
          </div>
        </div>
      </Modal>
    </>
  )
}
