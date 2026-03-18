'use client'

import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { InvoiceStatus } from '@/lib/types'
import { createInvoice, getInvoiceAttachmentUrl, updateInvoice, updateInvoiceStatus } from '@/lib/actions/invoices'
import { InvoiceStatusDropdown } from '@/components/ui/InvoiceStatusDropdown'
import { INPUT_STYLE } from '@/lib/styles'
import type { CoachInvoiceRow } from '../types'
import { ProfileEmptyState, ProfileStatusNotice } from '../ProfileStates'

const inputStyle = INPUT_STYLE

interface FinanceTabProps {
  athleteId: string
  athletePackage: string | null
  invoices: CoachInvoiceRow[]
}

export function FinanceTab({ athleteId, athletePackage, invoices: athleteInvoices }: FinanceTabProps) {
  const router = useRouter()
  const [localInvoices, setLocalInvoices] = useState(athleteInvoices)
  const [loadingInvoices, setLoadingInvoices] = useState(athleteInvoices.length === 0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null)
  const [invoiceDraft, setInvoiceDraft] = useState({ description: '', amount: '', dueDate: '' })
  const [invoiceSaving, setInvoiceSaving] = useState(false)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [attachmentLoadingId, setAttachmentLoadingId] = useState<string | null>(null)
  const invoiceFileRef = useRef<HTMLInputElement>(null)

  const loadInvoices = useCallback(async () => {
    setLoadingInvoices(true)
    setLoadError(null)
    try {
      const res = await fetch(`/api/coach/athletes/${athleteId}/sections?section=invoices`, { cache: 'no-store' })
      const data = await res.json().catch(() => null) as { items?: CoachInvoiceRow[]; error?: string } | null
      if (!res.ok) {
        throw new Error(data?.error || 'Nie udało się pobrać faktur.')
      }
      setLocalInvoices(data?.items ?? [])
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Nie udało się pobrać faktur.')
    } finally {
      setLoadingInvoices(false)
    }
  }, [athleteId])

  useEffect(() => {
    void loadInvoices()
  }, [loadInvoices])

  function closeInvoiceModal() {
    setInvoiceModalOpen(false)
    setEditingInvoiceId(null)
    setInvoiceDraft({ description: '', amount: '', dueDate: '' })
    setInvoiceError(null)
    if (invoiceFileRef.current) invoiceFileRef.current.value = ''
  }

  function openCreateInvoice() {
    setEditingInvoiceId(null)
    setInvoiceDraft({ description: '', amount: '', dueDate: '' })
    setInvoiceError(null)
    if (invoiceFileRef.current) invoiceFileRef.current.value = ''
    setInvoiceModalOpen(true)
  }

  function openEditInvoice(invoice: CoachInvoiceRow) {
    setEditingInvoiceId(invoice.id)
    setInvoiceDraft({
      description: invoice.description ?? '',
      amount: String(invoice.amount),
      dueDate: invoice.due_date ?? '',
    })
    setInvoiceError(null)
    if (invoiceFileRef.current) invoiceFileRef.current.value = ''
    setInvoiceModalOpen(true)
  }

  async function changeInvoiceStatus(invId: string, next: InvoiceStatus) {
    const prev = localInvoices.find(i => i.id === invId)?.status as InvoiceStatus
    setStatusMessage(null)
    setLocalInvoices(ls => ls.map(i => i.id === invId ? { ...i, status: next } : i))
    setStatusChangingId(invId)
    try {
      const result = await updateInvoiceStatus(invId, next, athleteId)
      if (result?.error) {
        setLocalInvoices(ls => ls.map(i => i.id === invId ? { ...i, status: prev } : i))
        setStatusMessage({ tone: 'error', text: result.error ?? 'Nie udało się zmienić statusu faktury.' })
      } else {
        setStatusMessage({ tone: 'success', text: 'Status faktury został zaktualizowany.' })
        await loadInvoices()
        startTransition(() => router.refresh())
      }
    } finally {
      setStatusChangingId(null)
    }
  }

  async function openAttachment(invoiceId: string) {
    if (attachmentLoadingId) return
    setAttachmentLoadingId(invoiceId)
    setStatusMessage(null)
    try {
      const result = await getInvoiceAttachmentUrl(invoiceId)
      if (result && 'error' in result) {
        setStatusMessage({ tone: 'error', text: result.error ?? 'Nie udało się otworzyć załącznika.' })
        return
      }
      if (result?.success && result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer')
      }
    } finally {
      setAttachmentLoadingId(null)
    }
  }

  async function saveInvoice() {
    if (!invoiceDraft.amount || invoiceSaving) return
    setInvoiceSaving(true)
    setInvoiceError(null)
    setStatusMessage(null)
    try {
      if (editingInvoiceId) {
        const result = await updateInvoice(editingInvoiceId, {
          description: invoiceDraft.description,
          amount: Number(invoiceDraft.amount),
          due_date: invoiceDraft.dueDate,
        }, athleteId)
        if (result && 'error' in result) {
          setInvoiceError(result.error ?? 'Nie udało się zaktualizować faktury')
          return
        }
        setStatusMessage({ tone: 'success', text: 'Faktura została zaktualizowana.' })
      } else {
        const fd = new FormData()
        fd.set('athlete_id', athleteId)
        fd.set('description', invoiceDraft.description)
        fd.set('amount', invoiceDraft.amount)
        if (invoiceDraft.dueDate) fd.set('due_date', invoiceDraft.dueDate)
        if (athletePackage) fd.set('package', athletePackage)
        const file = invoiceFileRef.current?.files?.[0]
        if (file) fd.set('attachment', file)
        const result = await createInvoice(null, fd)
        if (result && 'error' in result) {
          setInvoiceError(result.error ?? 'Nie udało się utworzyć faktury')
          return
        }
        setStatusMessage({ tone: 'success', text: 'Faktura została utworzona.' })
      }
      closeInvoiceModal()
      await loadInvoices()
      startTransition(() => router.refresh())
    } finally {
      setInvoiceSaving(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {statusMessage && (
          <ProfileStatusNotice tone={statusMessage.tone} text={statusMessage.text} />
        )}
        {loadError && (
          <ProfileStatusNotice
            tone="error"
            text={loadError}
            action={
              <button
                type="button"
                onClick={() => void loadInvoices()}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                style={{ background: 'rgba(231,76,60,0.12)', color: '#E74C3C', border: '1px solid rgba(231,76,60,0.2)' }}
              >
                Spróbuj ponownie
              </button>
            }
          />
        )}
        <div className="flex justify-end">
          <button onClick={openCreateInvoice}
            className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
            style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
            + Nowa faktura
          </button>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                {['Nr faktury', 'Opis', 'Data', 'Termin', 'Kwota', 'Plik', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingInvoices && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <ProfileEmptyState
                      icon="⏳"
                      title="Ładowanie faktur"
                      description="Pobieram historię rozliczeń i załączniki dla tego zawodnika."
                    />
                  </td>
                </tr>
              )}
              {localInvoices.map((inv, i) => (
                <tr key={inv.id} style={{ borderBottom: i < localInvoices.length - 1 ? '1px solid var(--bg-subtle)' : 'none' }}>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{inv.number}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{inv.description || '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(inv.date, { day: 'numeric', month: 'short' })}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: inv.status === 'overdue' ? '#E74C3C' : 'var(--text-muted)' }}>{formatDate(inv.due_date, { day: 'numeric', month: 'short' })}</td>
                  <td className="px-4 py-3 text-xs font-semibold">{formatCurrency(inv.amount)}</td>
                  <td className="px-4 py-3 text-xs">
                    {inv.attachment_url ? (
                      <button
                        type="button"
                        onClick={() => openAttachment(inv.id)}
                        disabled={attachmentLoadingId === inv.id}
                        className="px-2.5 py-1 rounded-lg cursor-pointer"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                      >
                        {attachmentLoadingId === inv.id ? 'Otwieranie...' : 'Otwórz'}
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <InvoiceStatusDropdown
                      status={inv.status as InvoiceStatus}
                      onChange={next => changeInvoiceStatus(inv.id, next)}
                      loading={statusChangingId === inv.id}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEditInvoice(inv)}
                      className="text-xs px-2.5 py-1 rounded-lg cursor-pointer"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))}
              {!loadingInvoices && localInvoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <ProfileEmptyState
                      icon="🧾"
                      title="Brak faktur dla tego zawodnika"
                      description="Wystaw pierwszą fakturę, aby śledzić płatności, terminy i dokumenty w jednym miejscu."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      <Modal
        open={invoiceModalOpen}
        onClose={closeInvoiceModal}
        title={editingInvoiceId ? 'Edytuj fakturę' : 'Nowa faktura'}
        footer={
          <Button className="w-full" onClick={saveInvoice} disabled={!invoiceDraft.amount || invoiceSaving}>
            {invoiceSaving ? 'Zapisywanie...' : editingInvoiceId ? 'Zapisz zmiany' : 'Wystaw fakturę'}
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
              disabled={!!editingInvoiceId}
              className="w-full text-xs cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            />
            {editingInvoiceId && (
              <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Edycja istniejącej faktury nie zmienia załącznika. W razie potrzeby dodaj nową fakturę z poprawnym plikiem.
              </div>
            )}
          </div>
          <div className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
            Pakiet: <span style={{ color: 'var(--text-primary)' }}>{athletePackage || '—'}</span>
            {!invoiceDraft.dueDate && <span className="ml-3">Brak terminu → +14 dni od dziś</span>}
          </div>
          {invoiceError && (
            <div className="text-xs px-1 text-red-400">{invoiceError}</div>
          )}
        </div>
      </Modal>
    </>
  )
}
