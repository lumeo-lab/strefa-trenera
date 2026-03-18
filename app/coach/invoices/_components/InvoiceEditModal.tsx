'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { INPUT_STYLE } from '@/lib/styles'
import { invoiceStatusLabel } from '@/lib/utils'
import { deleteInvoice, updateInvoice } from '@/lib/actions/invoices'
import type { InvoiceStatus } from '@/lib/types'

const inputStyle = INPUT_STYLE
const labelStyle = { color: 'var(--text-muted)' }
const STATUS_OPTIONS: InvoiceStatus[] = ['pending', 'paid', 'overdue', 'cancelled']

interface InvoiceEditModalProps {
  open: boolean
  onClose: () => void
  invoiceId: string
  invoiceNumber: string
  initialValues: { description: string; amount: string; dueDate: string; status: string }
  onSaved: () => void
  onDeleted: () => void
  onError: (msg: string) => void
}

export function InvoiceEditModal({ open, onClose, invoiceId, invoiceNumber, initialValues, onSaved, onDeleted, onError }: InvoiceEditModalProps) {
  const [form, setForm] = useState(initialValues)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function handleClose() {
    onClose()
    setConfirmingDelete(false)
    setError(null)
  }

  async function handleUpdate() {
    if (saving) return
    setSaving(true)
    setError(null)
    const result = await updateInvoice(invoiceId, {
      description: form.description || undefined,
      amount: parseFloat(form.amount),
      due_date: form.dueDate || undefined,
      status: form.status,
    })
    if (result && 'error' in result) {
      const msg = result.error ?? 'Nie udało się zapisać zmian'
      setError(msg)
      onError(msg)
      setSaving(false)
      return
    }
    handleClose()
    setSaving(false)
    onSaved()
  }

  async function handleDelete() {
    if (saving) return
    setSaving(true)
    setError(null)
    const result = await deleteInvoice(invoiceId)
    if (result && 'error' in result) {
      const msg = result.error ?? 'Nie udało się usunąć faktury'
      setError(msg)
      onError(msg)
      setSaving(false)
      return
    }
    handleClose()
    setSaving(false)
    onDeleted()
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Faktura ${invoiceNumber}`}>
      <div className="space-y-4">
        <div>
          <label className="text-xs mb-1.5 block" style={labelStyle}>Opis</label>
          <input value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs mb-1.5 block" style={labelStyle}>Kwota (zł)</label>
            <input type="number" min="0.01" step="0.01" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={labelStyle}>Termin płatności</label>
            <input type="date" value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
          </div>
        </div>
        <div>
          <label className="text-xs mb-1.5 block" style={labelStyle}>Status</label>
          <select value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl text-sm cursor-pointer" style={inputStyle}>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{invoiceStatusLabel(s)}</option>
            ))}
          </select>
        </div>
        {error && (
          <div className="text-xs text-red-400">{error}</div>
        )}
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose}>Anuluj</Button>
          <Button onClick={handleUpdate} disabled={!form.amount || saving}>
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
  )
}
