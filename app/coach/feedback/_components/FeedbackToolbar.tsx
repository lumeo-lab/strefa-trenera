'use client'

import { type Dispatch, type RefObject, type SetStateAction } from 'react'
import { SelectField } from '@/components/ui/SelectField'

type Filter = 'all' | 'today' | 'unread' | 'needs_action' | 'needs_reply'
type ViewMode = 'grouped' | 'chronological' | 'urgency'

interface FeedbackToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  filter: Filter
  onFilterChange: (value: Filter) => void
  athleteFilter: string
  onAthleteFilterChange: (value: string) => void
  viewMode: ViewMode
  onViewModeChange: (value: ViewMode) => void
  athletes: { id: string; name: string; avatar: string }[]
  filterButtons: { id: Filter; label: string; count: number }[]
  filteredCount: number
  legendOpen: boolean
  setLegendOpen: Dispatch<SetStateAction<boolean>>
  legendRef: RefObject<HTMLDivElement | null>
}

export function FeedbackToolbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  athleteFilter,
  onAthleteFilterChange,
  viewMode,
  onViewModeChange,
  athletes,
  filterButtons,
  filteredCount,
  legendOpen,
  setLegendOpen,
  legendRef,
}: FeedbackToolbarProps) {
  return (
    <div className="mb-5 rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '2px solid var(--border-strong)' }}>
      {/* Top row: search + result count + legend */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-sm font-semibold shrink-0">📥 Feedback</span>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Szukaj w feedbackach..."
          className="px-3 py-2 rounded-xl text-sm flex-1"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
        />
        <span className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0" style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
          {filteredCount} {filteredCount === 1 ? 'wynik' : filteredCount < 5 ? 'wyniki' : 'wyników'}
        </span>
        <div className="relative shrink-0" ref={legendRef}>
          <button
            onClick={() => setLegendOpen(o => !o)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs cursor-pointer transition-colors hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            title="Legenda sygnałów"
          >
            ℹ️
          </button>
            {legendOpen && (
              <div className="absolute right-0 top-8 z-50 w-64 rounded-xl p-4 shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Legenda sygnałów</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span>🟢</span>
                    <span>Dobrze / Świetnie</span>
                    <span style={{ color: 'var(--text-muted)' }}>😊 🤩</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🟡</span>
                    <span>Średnio</span>
                    <span style={{ color: 'var(--text-muted)' }}>😐</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🔴</span>
                    <span>Słabo / Fatalnie</span>
                    <span style={{ color: 'var(--text-muted)' }}>😕 😫</span>
                  </div>
                </div>
                <p className="text-xs mt-3 pt-2" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                  Sygnał ustawiany automatycznie na podstawie samopoczucia zawodnika.
                </p>
              </div>
            )}
          </div>
      </div>

      {/* Bottom row: filters */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] shrink-0" style={{ color: 'var(--text-muted)' }}>Filtry</span>
        <SelectField
          value={filter}
          onChange={(value) => onFilterChange(value as Filter)}
          className="min-w-0"
        >
          {filterButtons.map(f => (
            <option key={f.id} value={f.id}>
              {f.label} ({f.count})
            </option>
          ))}
        </SelectField>

        <SelectField
          value={athleteFilter}
          onChange={(value) => onAthleteFilterChange(value)}
          className="min-w-0"
        >
          <option value="all">Zawodnik: wszyscy ({athletes.length})</option>
          {athletes.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </SelectField>

        <SelectField value={viewMode} onChange={(value) => onViewModeChange(value as ViewMode)} className="min-w-0">
          <option value="chronological">Chronologicznie</option>
          <option value="grouped">Po zawodniku</option>
          <option value="urgency">Wg pilności</option>
        </SelectField>
      </div>
    </div>
  )
}
