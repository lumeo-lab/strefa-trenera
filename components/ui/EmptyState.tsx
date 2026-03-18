'use client'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div
      className="text-center py-14 px-6 rounded-2xl"
      style={{ color: 'var(--text-muted)', border: '1px dashed var(--border)', background: 'var(--bg-card)' }}
    >
      {icon && <div className="text-3xl mb-3">{icon}</div>}
      <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</div>
      {description && <div className="text-xs leading-6 max-w-sm mx-auto">{description}</div>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center rounded-xl px-3 py-2 text-sm cursor-pointer"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
