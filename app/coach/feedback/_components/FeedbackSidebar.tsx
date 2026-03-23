'use client'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SelectField } from '@/components/ui/SelectField'
import { plural } from '@/lib/utils'
import { FeedbackSidebarItem } from './FeedbackSidebarItem'
import type { FeedbackWithJoins } from './FeedbackClient'

type Filter = 'all' | 'today' | 'unread' | 'needs_action' | 'needs_reply'
type ViewMode = 'chronological' | 'urgency'

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
}: {
  feedbacks: FeedbackWithJoins[]
  selectedId: string | null
  onSelect: (id: string) => void
  filter: Filter
  onFilterChange: (f: Filter) => void
  athleteFilter: string
  onAthleteFilterChange: (v: string) => void
  viewMode: ViewMode
  onViewModeChange: (v: ViewMode) => void
  athletes: { id: string; name: string; avatar: string }[]
  filterButtons: { id: Filter; label: string; count: number }[]
  search: string
  onSearchChange: (v: string) => void
  filteredUnreadIds: string[]
  bulkMarking: boolean
  onBulkMarkRead: (ids: string[]) => void
}) {
  return (
    <div
      className="w-[380px] border-r flex flex-col shrink-0"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
    >
      {/* Header with filters */}
      <div className="px-3 py-3 border-b space-y-2" style={{ borderColor: 'var(--border)' }}>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Szukaj w feedbackach..."
          aria-label="Szukaj w feedbackach"
          className="w-full px-3 py-2 rounded-xl text-sm"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />

        <div className="flex gap-2">
          <SelectField
            value={filter}
            onChange={(value) => onFilterChange(value as Filter)}
            className="flex-1 min-w-0"
          >
            {filterButtons.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label} ({f.count})
              </option>
            ))}
          </SelectField>

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
        </div>

        <div className="flex items-center justify-between gap-2">
          <SelectField
            value={viewMode}
            onChange={(value) => onViewModeChange(value as ViewMode)}
            className="min-w-0"
          >
            <option value="chronological">Chronologicznie</option>
            <option value="urgency">Wg pilności</option>
          </SelectField>

          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
            style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}
          >
            {feedbacks.length} {plural(feedbacks.length, 'wynik', 'wyniki', 'wyników')}
          </span>
        </div>

        {filteredUnreadIds.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onBulkMarkRead(filteredUnreadIds)}
            disabled={bulkMarking}
            className="w-full"
          >
            {bulkMarking
              ? 'Oznaczanie...'
              : `Oznacz ${filteredUnreadIds.length} jako przeczytane`}
          </Button>
        )}
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {feedbacks.length === 0 ? (
          <div className="p-3">
            <EmptyState
              title="Brak feedbacków"
              description="Zmień filtry lub wyczyść wyszukiwanie."
            />
          </div>
        ) : (
          feedbacks.map((fb) => (
            <FeedbackSidebarItem
              key={fb.id}
              fb={fb}
              isSelected={selectedId === fb.id}
              onSelect={() => onSelect(fb.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
