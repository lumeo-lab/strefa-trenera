'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SelectField } from '@/components/ui/SelectField'
import { plural } from '@/lib/utils'
import { getPriorityGroupLabel } from '@/lib/feedback-priority'
import type { PriorityLevel } from '@/lib/feedback-priority'
import { FeedbackSidebarItem } from './FeedbackSidebarItem'
import type { FeedbackWithPriority, Filter, ViewMode } from './types'

// ── Group separator ─────────────────────────────────────────────────────────

function GroupSeparator({ label, count }: { label: string; count: number }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider sticky top-0 z-10"
      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
    >
      <span>{label}</span>
      <span className="opacity-60">({count})</span>
    </div>
  )
}

// ── Build grouped list ──────────────────────────────────────────────────────

type ListEntry =
  | { type: 'separator'; label: string; count: number; key: string }
  | { type: 'item'; fb: FeedbackWithPriority }

function buildPriorityGroups(feedbacks: FeedbackWithPriority[]): ListEntry[] {
  const groups: Record<PriorityLevel, FeedbackWithPriority[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  }
  for (const fb of feedbacks) {
    groups[fb.priority.level].push(fb)
  }

  const entries: ListEntry[] = []
  const order: PriorityLevel[] = ['critical', 'high', 'medium', 'low']
  for (const level of order) {
    const items = groups[level]
    if (items.length === 0) continue
    entries.push({ type: 'separator', label: getPriorityGroupLabel(level), count: items.length, key: `sep-${level}` })
    for (const fb of items) {
      entries.push({ type: 'item', fb })
    }
  }
  return entries
}

function buildChronologicalGroups(feedbacks: FeedbackWithPriority[]): ListEntry[] {
  // Pre-count dates in O(n)
  const dateCounts = new Map<string, number>()
  for (const fb of feedbacks) {
    dateCounts.set(fb.date, (dateCounts.get(fb.date) ?? 0) + 1)
  }

  const entries: ListEntry[] = []
  let currentDate = ''
  for (const fb of feedbacks) {
    const date = fb.date
    if (date !== currentDate) {
      currentDate = date
      const label = formatDateGroupLabel(date)
      entries.push({ type: 'separator', label, count: dateCounts.get(date) ?? 0, key: `sep-${date}` })
    }
    entries.push({ type: 'item', fb })
  }
  return entries
}

function formatDateGroupLabel(isoDate: string): string {
  // Use local date comparison (Europe/Warsaw)
  const now = new Date()
  const todayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw' }).format(now)
  const yesterday = new Date(now.getTime() - 86400000)
  const yesterdayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw' }).format(yesterday)

  if (isoDate === todayStr) return 'Dziś'
  if (isoDate === yesterdayStr) return 'Wczoraj'

  const d = new Date(isoDate + 'T12:00:00') // noon to avoid timezone edge
  return d.toLocaleDateString('pl', { day: 'numeric', month: 'short' })
}

// ── Main component ──────────────────────────────────────────────────────────

export function FeedbackSidebar({
  feedbacks,
  selectedId,
  onSelect,
  filter,
  onFilterChange,
  athleteFilter,
  onAthleteFilterChange,
  viewMode,
  onViewModeChange,
  athletes,
  filterButtons,
  search,
  onSearchChange,
  filteredUnreadIds,
  bulkMarking,
  onBulkMarkRead,
  totalCount,
  loadedCount,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  feedbacks: FeedbackWithPriority[]
  selectedId: string | null
  onSelect: (id: string) => void
  filter: Filter
  onFilterChange: (f: Filter) => void
  athleteFilter: string
  onAthleteFilterChange: (v: string) => void
  viewMode: ViewMode
  onViewModeChange: (v: ViewMode) => void
  athletes: { id: string; name: string; avatar: string | null }[]
  filterButtons: { id: Filter; label: string; count: number }[]
  search: string
  onSearchChange: (v: string) => void
  filteredUnreadIds: string[]
  bulkMarking: boolean
  onBulkMarkRead: (ids: string[]) => void
  totalCount: number
  loadedCount: number
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
}) {
  const entries = useMemo(() =>
    viewMode === 'priority'
      ? buildPriorityGroups(feedbacks)
      : buildChronologicalGroups(feedbacks),
    [feedbacks, viewMode],
  )

  return (
    <div
      className="w-[460px] border-r flex flex-col shrink-0"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
    >
      {/* Header */}
      <div className="px-3 py-3 border-b space-y-2" style={{ borderColor: 'var(--border)' }}>
        {/* Row 1: search + results count */}
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Szukaj w feedbackach..."
            aria-label="Szukaj w feedbackach"
            className="flex-1 px-3 py-2 rounded-xl text-sm"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
            style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}
          >
            {feedbacks.length} {plural(feedbacks.length, 'wynik', 'wyniki', 'wyników')}
          </span>
        </div>

        {/* Row 2: filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterButtons.map((f) => {
            const isActive = filter === f.id
            return (
              <button
                key={f.id}
                onClick={() => onFilterChange(f.id)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap"
                style={isActive
                  ? { background: '#FF5C1B', color: 'white' }
                  : { background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                }
              >
                {f.label} {f.count > 0 && <span className="opacity-75">({f.count})</span>}
              </button>
            )
          })}
        </div>

        {/* Row 3: athlete + sort */}
        <div className="flex items-center gap-2">
          <SelectField
            value={athleteFilter}
            onChange={(value) => onAthleteFilterChange(value)}
            className="flex-1 min-w-0"
          >
            <option value="all">Wszyscy ({athletes.length})</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            value={viewMode}
            onChange={(value) => onViewModeChange(value as ViewMode)}
            className="shrink-0"
          >
            <option value="priority">Priorytet</option>
            <option value="chronological">Chronologicznie</option>
          </SelectField>
        </div>

        {/* Bulk mark read */}
        {filteredUnreadIds.length > 0 && (
          <button
            onClick={() => onBulkMarkRead(filteredUnreadIds)}
            disabled={bulkMarking}
            className="w-full text-xs py-1.5 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
            style={{ color: '#FF5C1B', background: 'rgba(255,92,27,0.06)' }}
          >
            {bulkMarking
              ? 'Oznaczanie...'
              : `Oznacz ${filteredUnreadIds.length} jako przeczytane`}
          </button>
        )}
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {feedbacks.length === 0 ? (
          <div className="p-3">
            <EmptyState
              title="Brak feedbacków"
              description={search ? 'Brak wyników dla tego wyszukiwania. Zmień frazę lub wyczyść filtry.' : 'Zmień filtry lub poczekaj na nowe feedbacki od zawodników.'}
            />
          </div>
        ) : (
          <>
            {entries.map((entry) =>
              entry.type === 'separator' ? (
                <GroupSeparator key={entry.key} label={entry.label} count={entry.count} />
              ) : (
                <FeedbackSidebarItem
                  key={entry.fb.id}
                  fb={entry.fb}
                  isSelected={selectedId === entry.fb.id}
                  onSelect={() => onSelect(entry.fb.id)}
                />
              )
            )}

            {/* Load more / pagination info */}
            <div className="px-4 py-3 text-center space-y-2">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {loadedCount < totalCount
                  ? `Załadowano ${loadedCount} z ${totalCount} ${plural(totalCount, 'feedbacku', 'feedbacków', 'feedbacków')}`
                  : `${totalCount} ${plural(totalCount, 'feedback', 'feedbacki', 'feedbacków')}`
                }
              </p>
              {hasMore && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onLoadMore}
                  disabled={loadingMore}
                  className="w-full"
                >
                  {loadingMore ? 'Ładowanie...' : 'Załaduj więcej'}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
