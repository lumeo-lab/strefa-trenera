'use client'

import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { InvoiceStatus } from '@/lib/types'
import { createInvoice, getInvoiceAttachmentUrl, updateInvoiceStatus } from '@/lib/actions/invoices'
import { InvoiceStatusDropdown } from '@/components/ui/InvoiceStatusDropdown'
import { INPUT_STYLE } from '@/lib/styles'
import type { CoachInvoiceRow } from '../types'

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
    setInvoiceDraft({ description: '', amount: '', dueDate: '' })
    setInvoiceError(null)
    if (invoiceFileRef.current) invoiceFileRef.current.value = ''
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
      closeInvoiceModal()
      await loadInvoices()
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
  const latestInvoice = localInvoices
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
  const nextDueInvoice = localInvoices
    .filter((invoice) => invoice.status === 'pending' || invoice.status === 'overdue')
    .slice()
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0] ?? null
  const withAttachmentCount = localInvoices.filter((invoice) => !!invoice.attachment_url).length

  return (
    <>
      <div className="space-y-4">
        {statusMessage && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              background: statusMessage.tone === 'success' ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)',
              border: `1px solid ${statusMessage.tone === 'success' ? 'rgba(46,204,113,0.25)' : 'rgba(231,76,60,0.25)'}`,
              color: statusMessage.tone === 'success' ? '#2ECC71' : '#E74C3C',
            }}
          >
            {statusMessage.text}
          </div>
        )}
        {loadError && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', color: '#E74C3C' }}>
            {loadError}
          </div>
        )}
        <div className="flex justify-end">
          <button onClick={() => setInvoiceModalOpen(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
            style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
            + Nowa faktura
          </button>
        </div>
        <Card className="p-5">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Do zapłaty
              </div>
              <div className="text-lg font-semibold" style={{ color: invoiceTotals.pending + invoiceTotals.overdue > 0 ? '#FCA5A5' : 'var(--text-primary)' }}>
                {formatCurrency(invoiceTotals.pending + invoiceTotals.overdue)}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Oczekujące: {formatCurrency(invoiceTotals.pending)} • Przeterminowane: {formatCurrency(invoiceTotals.overdue)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Ostatnia faktura
              </div>
              <div className="text-lg font-semibold">
                {latestInvoice ? latestInvoice.number : '—'}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {latestInvoice ? formatDate(latestInvoice.date, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Brak wystawionych faktur'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Najbliższy termin
              </div>
              <div className="text-lg font-semibold">
                {nextDueInvoice ? formatDate(nextDueInvoice.due_date, { day: 'numeric', month: 'short' }) : '—'}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {nextDueInvoice ? `${nextDueInvoice.number} • ${formatCurrency(nextDueInvoice.amount)}` : 'Brak otwartych płatności'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Dokumenty
              </div>
              <div className="text-lg font-semibold">
                {withAttachmentCount}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {withAttachmentCount === 1 ? 'faktura ma załącznik' : withAttachmentCount < 5 ? 'faktury mają załączniki' : 'faktur ma załączniki'}
              </div>
            </div>
          </div>
        </Card>
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                {['Nr faktury', 'Opis', 'Data', 'Termin', 'Kwota', 'Plik', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingInvoices && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Ładowanie faktur...</td></tr>
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
                </tr>
              ))}
              {!loadingInvoices && localInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <div className="text-3xl mb-2">🧾</div>
                    <div className="text-sm font-medium mb-1">Brak faktur dla tego zawodnika</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Wystaw pierwszą fakturę, aby śledzić płatności i terminy.
                    </div>
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
          {invoiceError && (
            <div className="text-xs px-1 text-red-400">{invoiceError}</div>
          )}
        </div>
      </Modal>
    </>
  )
}
