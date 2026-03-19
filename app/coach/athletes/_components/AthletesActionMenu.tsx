'use client'

import Link from 'next/link'

interface AthletesActionMenuProps {
  pos: { top: number; left: number }
  athleteId: string
  athleteSlug?: string
  hasUnreadMessages?: boolean
  hasUnreadFeedback?: boolean
  hasNoPlan?: boolean
  hasUnpaid?: boolean
  hasRedSignal?: boolean
  onClose: () => void
}

export function AthletesActionMenu({
  pos, athleteId, athleteSlug,
  hasUnreadMessages, hasUnreadFeedback, hasNoPlan, hasUnpaid, hasRedSignal,
  onClose,
}: AthletesActionMenuProps) {
  // Contextual actions first, then standard
  const contextual: { href: string; label: string; accent?: boolean }[] = []
  if (hasUnreadMessages) contextual.push({ href: `/coach/chat?athlete=${athleteId}`, label: '💬 Odpowiedz na wiadomość', accent: true })
  if (hasUnreadFeedback || hasRedSignal) contextual.push({ href: `/coach/athletes/${athleteId}?tab=feedback`, label: '📥 Sprawdź feedback', accent: true })
  if (hasNoPlan) contextual.push({ href: `/coach/planner?athlete=${athleteId}`, label: '📅 Uzupełnij plan', accent: true })
  if (hasUnpaid) contextual.push({ href: `/coach/invoices?athlete=${athleteId}&filter=overdue`, label: '💳 Sprawdź płatności', accent: true })

  const standard = [
    { href: `/coach/athletes/${athleteId}`, label: 'Profil' },
    { href: `/coach/planner?athlete=${athleteId}`, label: 'Planer' },
    { href: `/coach/chat?athlete=${athleteId}`, label: 'Czat' },
    { href: `/coach/invoices?athlete=${athleteId}`, label: 'Faktury' },
    { href: `/coach/athletes/${athleteId}?tab=races`, label: 'Zawody' },
  ]

  // Filter out standard items that duplicate contextual
  const contextualHrefs = new Set(contextual.map(c => c.href))
  const filteredStandard = standard.filter(s => !contextualHrefs.has(s.href))

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        background: 'var(--bg-raised)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '4px',
        minWidth: 200,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {contextual.length > 0 && (
        <>
          {contextual.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="block rounded-lg px-3 py-2 text-sm font-medium transition-opacity hover:opacity-80"
              style={{ color: '#FF5C1B' }}
            >
              {item.label}
            </Link>
          ))}
          <div className="my-1 h-px" style={{ background: 'var(--border)' }} />
        </>
      )}
      {filteredStandard.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          className="block rounded-lg px-3 py-2 text-sm transition-opacity hover:opacity-80"
          style={{ color: 'var(--text-primary)' }}
        >
          {item.label}
        </Link>
      ))}
      {athleteSlug && (
        <>
          <div className="my-1 h-px" style={{ background: 'var(--border)' }} />
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/u/${athleteSlug}`)
              onClose()
            }}
            className="block w-full text-left rounded-lg px-3 py-2 text-sm cursor-pointer transition-opacity hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            Kopiuj link zawodnika
          </button>
        </>
      )}
    </div>
  )
}
