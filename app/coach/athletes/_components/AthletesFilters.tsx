'use client'

import { useCallback, useRef, useState } from 'react'
import { useClickOutside } from '@/lib/hooks/useClickOutside'
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
  operationalCounts: Record<string, number>
  onStatusFilterChange: (value: string) => void
  onPackageFilterChange: (value: string) => void
  onToggleStatusFilterOpen: () => void
  onOpenStatusModal: () => void
  onResetSort: () => void
}

const OPERATIONAL_FILTERS = [
  { key: 'attention', label: 'Wymagają uwagi', icon: '⚠️' },
  { key: 'red_signal', label: 'Czerwony sygnał', icon: '🔴' },
  { key: 'no_plan', label: 'Bez planu', icon: '📅' },
  { key: 'unanswered', label: 'Nieodpisane', icon: '💬' },
  { key: 'unpaid', label: 'Nieopłacone', icon: '💳' },
  { key: 'low_compliance', label: 'Niska realizacja', icon: '📉' },
]

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
  operationalCounts,
  onStatusFilterChange,
  onPackageFilterChange,
  onToggleStatusFilterOpen,
  onOpenStatusModal,
  onResetSort,
}: AthletesFiltersProps) {
  const [opMenuOpen, setOpMenuOpen] = useState(false)
  const opMenuRef = useRef<HTMLDivElement>(null)
  useClickOutside(opMenuRef, useCallback(() => setOpMenuOpen(false), []), opMenuOpen)

  const visibleStatuses = statusFilterOpen
    ? allStatuses
    : (() => {
      const base = allStatuses.slice(0, 5)
      if (statusFilter !== 'all' && !OPERATIONAL_FILTERS.some(f => f.key === statusFilter) && !base.some((status) => status.key === statusFilter)) {
        const active = allStatuses.find((status) => status.key === statusFilter)
        if (active) return [...base.slice(0, 4), active]
      }
      return base
    })()
  const hiddenStatusesCount = Math.max(0, allStatuses.length - visibleStatuses.length)

  const activeOpFilter = OPERATIONAL_FILTERS.find(f => f.key === statusFilter)

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

        {/* Operational filter dropdown */}
        <div className="relative" ref={opMenuRef}>
          <button
            onClick={() => setOpMenuOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all"
            style={{
              background: activeOpFilter ? 'rgba(231,76,60,0.12)' : 'var(--bg-elevated)',
              color: activeOpFilter ? '#E74C3C' : 'var(--text-muted)',
              border: activeOpFilter ? '1px solid rgba(231,76,60,0.3)' : '1px solid var(--border)',
            }}
          >
            {activeOpFilter ? `${activeOpFilter.icon} ${activeOpFilter.label} (${operationalCounts[activeOpFilter.key] ?? 0})` : '⚡ Problemowe'}
            <span className="opacity-50 ml-0.5">▾</span>
          </button>
          {opMenuOpen && (
            <div
              className="absolute top-full left-0 mt-1 z-50 rounded-xl py-1 shadow-lg"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', minWidth: 220 }}
            >
              {OPERATIONAL_FILTERS.map(f => {
                const count = operationalCounts[f.key] ?? 0
                return (
                  <button
                    key={f.key}
                    onClick={() => { onStatusFilterChange(f.key); setOpMenuOpen(false) }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 text-sm text-left cursor-pointer transition-colors hover:bg-[var(--bg-hover)]"
                    style={{ color: statusFilter === f.key ? '#E74C3C' : 'var(--text-primary)' }}
                  >
                    <span className="flex items-center gap-2">
                      <span>{f.icon}</span>
                      <span>{f.label}</span>
                    </span>
                    <span className="text-xs font-medium" style={{ color: count > 0 ? '#E74C3C' : 'var(--text-muted)' }}>{count}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="w-px h-4 shrink-0" style={{ background: 'var(--border)' }} />

        {/* Status filters */}
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
