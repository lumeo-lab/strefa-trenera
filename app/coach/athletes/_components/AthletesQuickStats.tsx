'use client'

import type { AthletesClientProps } from './types'

type AthleteItem = AthletesClientProps['athletes'][number]

interface AthletesQuickStatsProps {
  displayed: AthleteItem[]
  nextSessionMap: AthletesClientProps['nextSessionMap']
  unpaidInvoiceSet: AthletesClientProps['unpaidInvoiceSet']
  signalMap: AthletesClientProps['signalMap']
  viewMode: 'table' | 'cards'
  onViewModeChange: (mode: 'table' | 'cards') => void
}

export function AthletesQuickStats({
  displayed,
  nextSessionMap,
  unpaidInvoiceSet,
  signalMap,
  viewMode,
  onViewModeChange,
}: AthletesQuickStatsProps) {
  const alertCount = displayed.filter(a => a.status === 'alert' || a.status === 'warning').length
  const noPlanCount = displayed.filter(a => !nextSessionMap[a.id]).length
  const unpaidCount = displayed.filter(a => unpaidInvoiceSet[a.id]).length
  const redSignalCount = displayed.filter(a => signalMap[a.id] === 'red').length
  const parts: string[] = [`${displayed.length} zawodników`]
  if (alertCount > 0) parts.push(`${alertCount} z alertem`)
  if (redSignalCount > 0) parts.push(`${redSignalCount} czerwony sygnał`)
  if (noPlanCount > 0) parts.push(`${noPlanCount} bez planu`)
  if (unpaidCount > 0) parts.push(`${unpaidCount} nieopłaconych`)

  return (
    <div className="flex items-center justify-between mb-3 px-1">
      {parts.length > 1 ? (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{parts.join(' · ')}</span>
      ) : <span />}
      <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: 'var(--bg-elevated)' }}>
        <button
          onClick={() => onViewModeChange('table')}
          className="px-2 py-1 rounded-md text-xs cursor-pointer transition-all"
          style={{ background: viewMode === 'table' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'table' ? 'var(--text-primary)' : 'var(--text-muted)' }}
          title="Widok tabeli"
          aria-label="Widok tabeli"
          aria-pressed={viewMode === 'table'}
        >
          ☰
        </button>
        <button
          onClick={() => onViewModeChange('cards')}
          className="px-2 py-1 rounded-md text-xs cursor-pointer transition-all"
          style={{ background: viewMode === 'cards' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'cards' ? 'var(--text-primary)' : 'var(--text-muted)' }}
          title="Widok kart"
          aria-label="Widok kart"
          aria-pressed={viewMode === 'cards'}
        >
          ▦
        </button>
      </div>
    </div>
  )
}
