'use client'

import type { StatusDef } from '@/lib/useCustomStatuses'

interface AthletesFiltersProps {
  athletesCount: number
  statusCounts: Record<string, number>
  allStatuses: StatusDef[]
  packageOptions: string[]
  statusFilter: string
  packageFilter: string
  statusFilterOpen: boolean
  sortKeyActive: boolean
  showPackageFilter: boolean
  onStatusFilterChange: (value: string) => void
  onPackageFilterChange: (value: string) => void
  onToggleStatusFilterOpen: () => void
  onOpenStatusModal: () => void
  onResetSort: () => void
}

export function AthletesFilters({
  athletesCount,
  statusCounts,
  allStatuses,
  packageOptions,
  statusFilter,
  packageFilter,
  statusFilterOpen,
  sortKeyActive,
  showPackageFilter,
  onStatusFilterChange,
  onPackageFilterChange,
  onToggleStatusFilterOpen,
  onOpenStatusModal,
  onResetSort,
}: AthletesFiltersProps) {
  const visibleStatuses = statusFilterOpen
    ? allStatuses
    : (() => {
      const base = allStatuses.slice(0, 5)
      if (statusFilter !== 'all' && !base.some((status) => status.key === statusFilter)) {
        const active = allStatuses.find((status) => status.key === statusFilter)
        if (active) return [...base.slice(0, 4), active]
      }
      return base
    })()
  const hiddenStatusesCount = Math.max(0, allStatuses.length - visibleStatuses.length)

  return (
    <div className="mb-5 rounded-2xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] shrink-0" style={{ color: 'var(--text-muted)' }}>
          Filtry
        </span>
        <button
          onClick={() => onStatusFilterChange('all')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all"
          style={{
            background: statusFilter === 'all' ? 'rgba(255,92,27,0.12)' : 'var(--bg-elevated)',
            color: statusFilter === 'all' ? '#FF5C1B' : 'var(--text-muted)',
            border: statusFilter === 'all' ? '1px solid rgba(255,92,27,0.3)' : '1px solid var(--border)',
          }}
        >
          Wszyscy <span className="opacity-60">{athletesCount}</span>
        </button>
        {visibleStatuses.map((status) => {
          const count = statusCounts[status.key] ?? 0
          if (count === 0 && statusFilter !== status.key) return null
          return (
            <button
              key={status.key}
              onClick={() => onStatusFilterChange(status.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all"
              style={{
                background: statusFilter === status.key ? 'rgba(255,92,27,0.12)' : 'var(--bg-elevated)',
                color: statusFilter === status.key ? '#FF5C1B' : 'var(--text-muted)',
                border: statusFilter === status.key ? '1px solid rgba(255,92,27,0.3)' : '1px solid var(--border)',
              }}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: status.color }} />
              {status.label}
              <span className="opacity-60">{count}</span>
            </button>
          )
        })}
        {allStatuses.length > 5 && (
          <button
            onClick={onToggleStatusFilterOpen}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs cursor-pointer"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            {statusFilterOpen ? 'Zwiń statusy' : `Pokaż więcej${hiddenStatusesCount > 0 ? ` (${hiddenStatusesCount})` : ''}`}
          </button>
        )}
        {showPackageFilter && (
          <select
            value={packageFilter}
            onChange={(e) => onPackageFilterChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs cursor-pointer"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            <option value="all">Wszystkie pakiety</option>
            {packageOptions.map((pkg) => (
              <option key={pkg} value={pkg}>{pkg}</option>
            ))}
          </select>
        )}
        <button
          onClick={onOpenStatusModal}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs cursor-pointer ml-auto"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          title="Edytuj statusy"
        >
          ⚙ Statusy
        </button>
        {sortKeyActive && (
          <button
            onClick={onResetSort}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs cursor-pointer"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            ↺ Wróć do własnej kolejności
          </button>
        )}
      </div>
    </div>
  )
}
