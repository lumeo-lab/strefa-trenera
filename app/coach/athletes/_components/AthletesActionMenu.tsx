'use client'

import Link from 'next/link'

interface AthletesActionMenuProps {
  pos: { top: number; left: number }
  athleteId: string
  onClose: () => void
}

export function AthletesActionMenu({ pos, athleteId, onClose }: AthletesActionMenuProps) {
  const items = [
    { href: `/coach/athletes/${athleteId}`, label: 'Profil' },
    { href: `/coach/planner?athlete=${athleteId}`, label: 'Planer' },
    { href: `/coach/chat?athlete=${athleteId}`, label: 'Czat' },
    { href: `/coach/invoices?athlete=${athleteId}`, label: 'Faktury' },
  ]

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
        minWidth: 150,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {items.map((item) => (
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
    </div>
  )
}
