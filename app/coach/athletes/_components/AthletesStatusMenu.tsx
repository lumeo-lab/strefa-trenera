'use client'

import type { StatusDef } from '@/lib/useCustomStatuses'

interface AthletesStatusMenuProps {
  pos: { top: number; left: number }
  athleteStatus: string
  allStatuses: StatusDef[]
  updating: boolean
  onSelect: (statusKey: string) => void
}

export function AthletesStatusMenu({ pos, athleteStatus, allStatuses, updating, onSelect }: AthletesStatusMenuProps) {
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
        minWidth: 180,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {allStatuses.map((status) => (
        <button
          key={status.key}
          disabled={updating}
          onClick={() => onSelect(status.key)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left cursor-pointer transition-opacity hover:opacity-70"
          style={{
            background: status.key === athleteStatus ? 'rgba(255,92,27,0.08)' : 'transparent',
            color: status.key === athleteStatus ? '#FF5C1B' : 'var(--text-primary)',
            opacity: updating ? 0.6 : 1,
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: status.color }} />
          {status.label}
          {status.key === athleteStatus && <span className="ml-auto text-xs">✓</span>}
        </button>
      ))}
    </div>
  )
}
