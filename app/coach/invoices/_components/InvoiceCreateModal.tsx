'use client'

import { useRef, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { INPUT_STYLE } from '@/lib/styles'
import { formatCurrency } from '@/lib/utils'
import { createInvoice } from '@/lib/actions/invoices'

const inputStyle = INPUT_STYLE
const labelStyle = { color: 'var(--text-muted)' }

type AthleteOption = {
  id: string
  name: string
  package: string
  package_price: number
}

interface InvoiceCreateModalProps {
  open: boolean
  onClose: () => void
  athletes: AthleteOption[]
  onCreated: () => void
  onError: (msg: string) => void
}

export function InvoiceCreateModal({ open, onClose, athletes, onCreated, onError }: InvoiceCreateModalProps) {
  const [form, setForm] = useState({
    athleteId: athletes[0]?.id ?? '',
    description: '',
    amount: athletes[0]?.package_price ? String(athletes[0].package_price) : '',
    dueDate: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleAthleteChange(athleteId: string) {
    const ath = athletes.find(a => a.id === athleteId)
    setForm(f => ({
      ...f,
      athleteId,
      amount: ath?.package_price ? String(ath.package_price) : f.amount,
    }))
  }

  function handleClose() {
    onClose()
    setError(null)
  }

  async function handleCreate() {
    if (!form.athleteId || !form.amount || submitting) return
    setSubmitting(true)
    setError(null)
    const fd = new FormData()
    fd.set('athlete_id', form.athleteId)
    fd.set('description', form.description)
    fd.set('amount', form.amount)
    if (form.dueDate) fd.set('due_date', form.dueDate)
    const selectedAthlete = athletes.find(a => a.id === form.athleteId)
    if (selectedAthlete) fd.set('package', selectedAthlete.package)
    const file = fileRef.current?.files?.[0]
    if (file) fd.set('attachment', file)
    const result = await createInvoice(null, fd)
    if (result && 'error' in result) {
      setError(result.error ?? 'Nie udało się utworzyć faktury')
      onError(result.error ?? 'Nie udało się utworzyć faktury')
      setSubmitting(false)
      return
    }
    handleClose()
    setForm({ athleteId: athletes[0]?.id ?? '', description: '', amount: athletes[0]?.package_price ? String(athletes[0].package_price) : '', dueDate: '' })
    if (fileRef.current) fileRef.current.value = ''
    setSubmitting(false)
    onCreated()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nowa faktura">
      <div className="space-y-4">
        <div>
          <label className="text-xs mb-1.5 block" style={labelStyle}>Zawodnik</label>
          <select value={form.athleteId}
            onChange={e => handleAthleteChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle}>
            {athletes.map(a => <option key={a.id} value={a.id}>{a.name} — {a.package} ({formatCurrency(a.package_price)})</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs mb-1.5 block" style={labelStyle}>Opis</label>
          <input value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="np. Plan Pro — Marzec 2026"
            className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs mb-1.5 block" style={labelStyle}>Kwota (zł) *</label>
            <input type="number" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="np. 599"
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
          <label className="text-xs mb-1.5 block" style={labelStyle}>Załącznik (opcjonalnie, PDF / JPG / PNG)</label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="w-full text-xs cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          />
        </div>
        {error && (
          <div className="text-xs text-red-400">{error}</div>
        )}
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose}>Anuluj</Button>
          <Button onClick={handleCreate} disabled={!form.amount || submitting}>
            {submitting ? 'Tworzenie...' : 'Utwórz fakturę'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
