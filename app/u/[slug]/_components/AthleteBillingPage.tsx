'use client'

import Link from 'next/link'
import { AthleteSession } from '@/lib/athlete-auth'
import type { AthleteInvoiceRow } from '@/lib/athlete-data'
import { AthleteBottomNav } from './AthleteBottomNav'
import { formatDate } from '@/lib/utils'

interface Props {
  athlete: AthleteSession
  invoices: AthleteInvoiceRow[]
}

function invoiceStatusStyle(status: string): { bg: string; color: string; label: string } {
  switch (status) {
    case 'paid': return { bg: 'rgba(46,204,113,0.1)', color: '#2ECC71', label: 'Opłacona' }
    case 'overdue': return { bg: 'rgba(248,113,113,0.08)', color: '#f87171', label: 'Zaległa' }
    case 'cancelled': return { bg: 'var(--bg-subtle)', color: 'var(--text-muted)', label: 'Anulowana' }
    default: return { bg: 'rgba(245,158,11,0.08)', color: '#f59e0b', label: 'Do zapłaty' }
  }
}

export function AthleteBillingPage({ athlete, invoices }: Props) {
  const pending = invoices.filter(i => i.status === 'pending' || i.status === 'overdue')
  const settled = invoices.filter(i => i.status !== 'pending' && i.status !== 'overdue')

  const totalOwed = pending.reduce((sum, i) => sum + (i.amount || 0), 0)

  return (
    <div style={{ color: 'var(--text-primary)', paddingBottom: '90px' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 border-b" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/u/${athlete.slug}/profile`} className="text-sm" style={{ color: 'var(--text-muted)' }}>← Profil</Link>
        </div>
        <h1 className="text-xl font-bold">Rozliczenia</h1>
      </div>

      <div className="p-5 space-y-5">
        {invoices.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <div className="text-4xl mb-3">💳</div>
            <div className="font-medium mb-1">Brak rozliczeń</div>
            <div className="text-sm">Twoje faktury pojawią się tutaj</div>
          </div>
        )}

        {/* Summary if pending */}
        {totalOwed > 0 && (
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="text-xs mb-1" style={{ color: '#f59e0b' }}>Do zapłaty</div>
            <div className="text-2xl font-bold">{totalOwed.toFixed(2)} zł</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {pending.length} {pending.length === 1 ? 'faktura' : pending.length < 5 ? 'faktury' : 'faktur'}
            </div>
          </div>
        )}

        {/* Pending invoices */}
        {pending.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: '#f59e0b' }}>
              Do zapłaty ({pending.length})
            </div>
            <div className="space-y-2">
              {pending.map(inv => <InvoiceCard key={inv.id} invoice={inv} />)}
            </div>
          </div>
        )}

        {/* Settled invoices */}
        {settled.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
              Historia ({settled.length})
            </div>
            <div className="space-y-2">
              {settled.map(inv => <InvoiceCard key={inv.id} invoice={inv} />)}
            </div>
          </div>
        )}
      </div>

      <AthleteBottomNav slug={athlete.slug} athleteName={athlete.name} athleteAvatar={athlete.avatar} />
    </div>
  )
}

function InvoiceCard({ invoice }: { invoice: AthleteInvoiceRow }) {
  const st = invoiceStatusStyle(invoice.status)
  return (
    <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1 min-w-0">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {invoice.number && <span className="font-medium">{invoice.number} · </span>}
            {formatDate(invoice.date, { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          {invoice.description && <div className="text-sm font-medium mt-0.5 truncate">{invoice.description}</div>}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 font-medium" style={{ background: st.bg, color: st.color }}>
          {st.label}
        </span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="text-lg font-bold">{invoice.amount?.toFixed(2)} zł</div>
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          {invoice.due_date && (
            <span>Termin: {formatDate(invoice.due_date, { day: 'numeric', month: 'short' })}</span>
          )}
          {invoice.attachment_url && (
            <a href={invoice.attachment_url} target="_blank" rel="noopener noreferrer"
              className="underline" style={{ color: '#FF5C1B' }}>
              📎 Pobierz
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
