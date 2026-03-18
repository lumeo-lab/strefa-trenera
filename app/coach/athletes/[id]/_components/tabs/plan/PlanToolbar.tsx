'use client'

import type React from 'react'
import { formatDate } from '@/lib/utils'
import { monthLabel } from '@/lib/calendar'

interface PlanToolbarProps {
  planView: 'week' | 'month'
  setPlanView: React.Dispatch<React.SetStateAction<'week' | 'month'>>
  density: 'full' | 'compact'
  setDensity: React.Dispatch<React.SetStateAction<'full' | 'compact'>>
  showFeedback: boolean
  setShowFeedback: React.Dispatch<React.SetStateAction<boolean>>
  // Week nav
  weekStart: string
  weekEnd: string
  onWeekPrev: () => void
  onWeekNext: () => void
  onWeekToday: () => void
  // Week actions
  copyWeekConfirm: boolean
  setCopyWeekConfirm: (v: boolean) => void
  onCopyWeek: () => void
  copyingWeek: boolean
  onSaveTemplate: () => void
  onUseTemplate: () => void
  // Month nav
  selectedMonth: string
  onMonthPrev: () => void
  onMonthNext: () => void
  onMonthToday: () => void
  monthSessionCount: number
}

export function PlanToolbar({
  planView,
  setPlanView,
  density,
  setDensity,
  showFeedback,
  setShowFeedback,
  weekStart,
  weekEnd,
  onWeekPrev,
  onWeekNext,
  onWeekToday,
  copyWeekConfirm,
  setCopyWeekConfirm,
  onCopyWeek,
  copyingWeek,
  onSaveTemplate,
  onUseTemplate,
  selectedMonth,
  onMonthPrev,
  onMonthNext,
  onMonthToday,
  monthSessionCount,
}: PlanToolbarProps) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="rounded-2xl p-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex gap-1">
            <button
              onClick={() => setPlanView('week')}
              className="flex-1 px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all whitespace-nowrap"
              style={{ background: planView === 'week' ? '#FF5C1B' : 'transparent', color: planView === 'week' ? 'white' : 'var(--text-muted)' }}
            >📅 Tydzień</button>
            <button
              onClick={() => setPlanView('month')}
              className="flex-1 px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all whitespace-nowrap"
              style={{ background: planView === 'month' ? '#FF5C1B' : 'transparent', color: planView === 'month' ? 'white' : 'var(--text-muted)' }}
            >📆 Miesiąc</button>
          </div>
        </div>

        <div className="flex flex-wrap items-stretch gap-3 xl:justify-end">
          <div className="rounded-2xl p-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex gap-1">
              <button
                onClick={() => setDensity('full')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all whitespace-nowrap"
                style={{ background: density === 'full' ? '#FF5C1B' : 'transparent', color: density === 'full' ? 'white' : 'var(--text-muted)' }}
              >
                Widok pełny
              </button>
              <button
                onClick={() => setDensity('compact')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all whitespace-nowrap"
                style={{ background: density === 'compact' ? '#FF5C1B' : 'transparent', color: density === 'compact' ? 'white' : 'var(--text-muted)' }}
              >
                Widok skrócony
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowFeedback((value) => !value)}
            className="px-3 py-1.5 rounded-xl text-sm font-medium cursor-pointer transition-all whitespace-nowrap inline-flex items-center gap-1.5"
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            <span>{showFeedback ? '🙈' : '💬'}</span>
            <span>{showFeedback ? 'Ukryj feedback' : 'Pokaż feedback'}</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl px-3 py-2.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {planView === 'week' ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1">
                <button onClick={onWeekPrev} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>←</button>
                <button onClick={onWeekToday} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Dziś</button>
                <button onClick={onWeekNext} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>→</button>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>Zakres</div>
                <div className="text-sm font-medium">
                  {formatDate(weekStart, { day: 'numeric', month: 'short' })} — {formatDate(weekEnd, { day: 'numeric', month: 'short' })}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {copyWeekConfirm ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Skopiować ten tydzień na kolejny?</span>
                  <button onClick={onCopyWeek} disabled={copyingWeek} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'rgba(255,92,27,0.12)', color: '#FF5C1B', border: '1px solid rgba(255,92,27,0.22)' }}>
                    {copyingWeek ? 'Kopiowanie...' : 'Potwierdź'}
                  </button>
                  <button onClick={() => setCopyWeekConfirm(false)} disabled={copyingWeek} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    Anuluj
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => setCopyWeekConfirm(true)} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                    Skopiuj tydzień
                  </button>
                  <button onClick={onSaveTemplate} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                    Zapisz szablon
                  </button>
                  <button onClick={onUseTemplate} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                    Użyj szablonu
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1">
                <button onClick={onMonthPrev} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>←</button>
                <button onClick={onMonthToday} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Dziś</button>
                <button onClick={onMonthNext} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>→</button>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>Miesiąc</div>
                <div className="text-sm capitalize font-medium">{monthLabel(selectedMonth)}</div>
              </div>
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {monthSessionCount === 0 ? 'Brak zaplanowanych sesji w tym miesiącu.' : `${monthSessionCount} ${monthSessionCount === 1 ? 'sesja' : monthSessionCount < 5 ? 'sesje' : 'sesji'} w tym miesiącu`}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
