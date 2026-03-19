'use client'

import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import type { StatusDef } from '@/lib/useCustomStatuses'
import { daysUntil } from '@/lib/utils'
import { SIGNAL_COLORS, SIGNAL_LABELS } from './types'
import type { Athlete } from './types'

interface AthletesCardsProps {
  displayed: Athlete[]
  signalMap: Record<string, string>
  nextSessionMap: Record<string, { date: string; type: string; title: string }>
  complianceMap: Record<string, { completed: number; total: number }>
  unreadMessagesMap: Record<string, number>
  unreadFeedbackMap: Record<string, number>
  unpaidInvoiceSet: Record<string, boolean>
  nextRaceMap: Record<string, { name: string; date: string; distance: string | null }>
  getStatusDef: (key: string) => StatusDef
}

export function AthletesCards({
  displayed,
  signalMap,
  nextSessionMap,
  complianceMap,
  unreadMessagesMap,
  unreadFeedbackMap,
  unpaidInvoiceSet,
  nextRaceMap,
  getStatusDef,
}: AthletesCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {displayed.map(athlete => {
        const statusDef = getStatusDef(athlete.status)
        const signal = signalMap[athlete.id]
        const nextSession = nextSessionMap[athlete.id]
        const compliance = complianceMap[athlete.id]
        const unreadMsg = unreadMessagesMap[athlete.id] ?? 0
        const unreadFb = unreadFeedbackMap[athlete.id] ?? 0
        const hasUnpaid = unpaidInvoiceSet[athlete.id]
        const nextRace = nextRaceMap[athlete.id]

        return (
          <Link key={athlete.id} href={`/coach/athletes/${athlete.id}`} className="block group">
            <Card className="p-4 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:ring-1 group-hover:ring-[rgba(255,92,27,0.35)]">
              <div className="flex items-start gap-3">
                <Avatar initials={athlete.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{athlete.name}</span>
                    {unreadMsg > 0 && (
                      <span className="inline-flex items-center justify-center rounded-full text-white font-bold shrink-0" style={{ background: '#FF5C1B', minWidth: 16, height: 16, fontSize: 9, padding: '0 4px' }}>
                        {unreadMsg}
                      </span>
                    )}
                    {unreadFb > 0 && (
                      <span className="inline-flex items-center justify-center rounded-full text-white font-bold shrink-0" style={{ background: '#3B82F6', minWidth: 16, height: 16, fontSize: 9, padding: '0 4px' }}>
                        {unreadFb}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: statusDef.color }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{statusDef.label}</span>
                    {athlete.package && (
                      <>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>·</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{athlete.package}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Metrics row */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 pt-3 text-xs" style={{ borderTop: '1px solid var(--border)' }}>
                {signal && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: SIGNAL_COLORS[signal] ?? '#6B7280' }} />
                    <span style={{ color: 'var(--text-muted)' }}>{SIGNAL_LABELS[signal] ?? signal}</span>
                  </div>
                )}
                {nextSession ? (
                  <div style={{ color: 'var(--text-muted)' }}>
                    Następna: {daysUntil(nextSession.date).text}
                  </div>
                ) : (
                  <div style={{ color: '#F1C40F' }}>Brak planu</div>
                )}
                {compliance && compliance.total > 0 && (() => {
                  const pct = Math.round((compliance.completed / compliance.total) * 100)
                  return <div style={{ color: pct >= 80 ? '#2ECC71' : pct >= 60 ? '#F1C40F' : '#E74C3C' }}>Realizacja {pct}%</div>
                })()}
                {hasUnpaid && (
                  <div style={{ color: '#E74C3C' }}>Nieopłacone</div>
                )}
                {nextRace && (
                  <div style={{ color: 'var(--text-muted)' }}>
                    🏁 {nextRace.name} ({daysUntil(nextRace.date).text})
                  </div>
                )}
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
