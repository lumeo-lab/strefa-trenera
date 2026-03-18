'use client'

import type { RefObject } from 'react'
import { Button } from '@/components/ui/Button'
import { COLUMN_DEFS, type ColumnKey } from './types'

interface AthletesToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  activeColumns: ColumnKey[]
  colPickerOpen: boolean
  colPickerRef: RefObject<HTMLDivElement | null>
  onToggleColumns: () => void
  onSaveColumns: (columns: ColumnKey[]) => void
  onAddAthlete: () => void
  onExport: () => void
  defaultColumns: ColumnKey[]
}

export function AthletesToolbar({
  search,
  onSearchChange,
  activeColumns,
  colPickerOpen,
  colPickerRef,
  onToggleColumns,
  onSaveColumns,
  onAddAthlete,
  onExport,
  defaultColumns,
}: AthletesToolbarProps) {
  const orderedColumnDefs = [
    ...activeColumns
      .map((key) => COLUMN_DEFS.find((column) => column.key === key))
      .filter((column): column is (typeof COLUMN_DEFS)[number] => !!column),
    ...COLUMN_DEFS.filter((column) => !activeColumns.includes(column.key)),
  ]

  return (
    <div className="flex items-center gap-3 mb-3">
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Szukaj zawodnika, email, telefon..."
        className="max-w-sm px-4 py-2.5 rounded-xl text-sm flex-1"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
      />

      <Button size="sm" onClick={onAddAthlete}>
        + Dodaj zawodnika
      </Button>

      <button
        onClick={onExport}
        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm cursor-pointer whitespace-nowrap ml-auto"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-mid)', color: 'var(--text-muted)' }}
      >
        📥 Export Excel
      </button>

      <div className="relative" ref={colPickerRef}>
        <button
          onClick={onToggleColumns}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm cursor-pointer whitespace-nowrap"
          style={{
            background: colPickerOpen ? 'var(--bg-elevated)' : 'var(--bg-card)',
            border: '1px solid var(--border-mid)',
            color: 'var(--text-muted)',
          }}
        >
          ⚙ Edytuj tabelę
          <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(255,92,27,0.15)', color: '#FF5C1B' }}>
            {activeColumns.length + 2}
          </span>
        </button>

        {colPickerOpen && (
          <div
            className="absolute top-full right-0 mt-1 rounded-2xl p-3"
            style={{
              zIndex: 9999,
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              minWidth: 270,
            }}
          >
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Widoczne kolumny</div>
            {['Zawodnik', 'Status'].map((label) => (
              <div key={label} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg select-none" style={{ opacity: 0.45 }}>
                <div className="w-4 h-4 rounded flex items-center justify-center shrink-0 text-xs" style={{ background: 'rgba(255,92,27,0.15)', color: '#FF5C1B' }}>✓</div>
                <span className="text-sm">{label}</span>
                <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>zawsze</span>
              </div>
            ))} 

            <div style={{ borderTop: '1px solid var(--border)', margin: '6px 0' }} />
            <div className="space-y-0.5">
              {orderedColumnDefs.map((column) => {
                const activeIndex = activeColumns.indexOf(column.key)
                const isActive = activeIndex !== -1
                return (
                <div
                  key={column.key}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                  style={{ transition: 'background 0.1s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  onClick={() => {
                    const next = isActive
                      ? activeColumns.filter((key) => key !== column.key)
                      : [...activeColumns, column.key]
                    onSaveColumns(next)
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...activeColumns, column.key]
                        : activeColumns.filter((key) => key !== column.key)
                      onSaveColumns(next)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="accent-orange-500 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-sm">{column.label}</div>
                    <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{column.desc}</div>
                  </div>
                  {isActive && (
                    <div className="ml-auto flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (activeIndex <= 0) return
                          const next = [...activeColumns]
                          ;[next[activeIndex - 1], next[activeIndex]] = [next[activeIndex], next[activeIndex - 1]]
                          onSaveColumns(next)
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        disabled={activeIndex <= 0}
                        className="h-7 w-7 rounded-lg text-xs cursor-pointer disabled:opacity-30"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                        title="Przesuń wyżej"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (activeIndex === -1 || activeIndex >= activeColumns.length - 1) return
                          const next = [...activeColumns]
                          ;[next[activeIndex], next[activeIndex + 1]] = [next[activeIndex + 1], next[activeIndex]]
                          onSaveColumns(next)
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        disabled={activeIndex === -1 || activeIndex >= activeColumns.length - 1}
                        className="h-7 w-7 rounded-lg text-xs cursor-pointer disabled:opacity-30"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                        title="Przesuń niżej"
                      >
                        ↓
                      </button>
                    </div>
                  )}
                </div>
                )
              })}
            </div>
            <button
              onClick={() => onSaveColumns(defaultColumns)}
              className="w-full mt-2 pt-2 text-xs text-left cursor-pointer"
              style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              ↺ Przywróć domyślne
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
