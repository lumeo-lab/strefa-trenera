'use client'

import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import type { StatusDef } from '@/lib/useCustomStatuses'
import { daysAgo, daysUntil, formatCurrency, formatDate, sesjaLabel, sessionTypeLabel, tenureLabel } from '@/lib/utils'
import { SIGNAL_COLORS, SIGNAL_LABELS } from './types'
import type { Athlete, ColumnKey, SortKey } from './types'

function SortHeader({ label, sk, sortKey, sortDir, onSort }: { label: string; sk: SortKey; sortKey: SortKey; sortDir: 'asc' | 'desc'; onSort: (key: SortKey) => void }) {
  const isActive = sortKey === sk
  return (
    <th
      className="text-center px-5 py-4 font-medium cursor-pointer select-none hover:opacity-80 transition-opacity"
      style={{ color: isActive ? '#FF5C1B' : 'var(--text-muted)' }}
      onClick={() => onSort(sk)}
    >
      {label}{isActive && <span className="ml-1 text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </th>
  )
}

function EmptyValue() {
  return <div className="w-full text-center" style={{ color: 'var(--text-muted)' }}>—</div>
}

interface AthletesTableProps {
  displayed: Athlete[]
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  activeColumns: ColumnKey[]
  lastSessionMap: Record<string, { date: string; type: string; title: string }>
  nextSessionMap: Record<string, { date: string; type: string; title: string }>
  nextRaceMap: Record<string, { name: string; date: string; distance: string | null }>
  signalMap: Record<string, string>
  lastFeedbackDateMap: Record<string, string>
  complianceMap: Record<string, { completed: number; total: number }>
  weeklyLoadMap: Record<string, number>
  weeklySessionCountMap: Record<string, number>
  unreadMessagesMap: Record<string, number>
  unreadFeedbackMap: Record<string, number>
  unpaidInvoiceSet: Record<string, boolean>
  draggingId: string | null
  dragOverId: string | null
  editingStatusFor: string | null
  actionMenuFor: string | null
  onSort: (key: SortKey) => void
  onDragStart: (athleteId: string) => void
  onDragOver: (athleteId: string) => void
  onDrop: (athleteId: string) => void
  onDragEnd: () => void
  onToggleStatusMenu: (athleteId: string, rect: DOMRect) => void
  onToggleActionMenu: (athleteId: string, rect: DOMRect) => void
  getStatusDef: (key: string) => StatusDef
}

export function AthletesTable({
  displayed,
  sortKey,
  sortDir,
  activeColumns,
  lastSessionMap,
  nextSessionMap,
  nextRaceMap,
  signalMap,
  lastFeedbackDateMap,
  complianceMap,
  weeklyLoadMap,
  weeklySessionCountMap,
  unreadMessagesMap,
  unreadFeedbackMap,
  unpaidInvoiceSet,
  draggingId,
  dragOverId,
  editingStatusFor,
  actionMenuFor,
  onSort,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onToggleStatusMenu,
  onToggleActionMenu,
  getStatusDef,
}: AthletesTableProps) {
  const orderedColumns = activeColumns.filter((key) => activeColumns.includes(key))

  function renderColumnHeader(key: ColumnKey) {
    switch (key) {
      case 'last_session':
        return <SortHeader key={key} sortKey={sortKey} sortDir={sortDir} onSort={onSort} label="Ostatni trening" sk="last_session" />
      case 'next_session':
        return <SortHeader key={key} sortKey={sortKey} sortDir={sortDir} onSort={onSort} label="Następna sesja" sk="next_session" />
      case 'signal':
        return <SortHeader key={key} sortKey={sortKey} sortDir={sortDir} onSort={onSort} label="Sygnał" sk="signal" />
      case 'compliance':
        return <SortHeader key={key} sortKey={sortKey} sortDir={sortDir} onSort={onSort} label="Realizacja 30 dni" sk="compliance" />
      case 'weekly_load':
        return <SortHeader key={key} sortKey={sortKey} sortDir={sortDir} onSort={onSort} label="Obciążenie 7 dni" sk="weekly_load" />
      case 'next_race':
        return <SortHeader key={key} sortKey={sortKey} sortDir={sortDir} onSort={onSort} label="Następne zawody" sk="next_race" />
      case 'package':
        return <SortHeader key={key} sortKey={sortKey} sortDir={sortDir} onSort={onSort} label="Pakiet" sk="package" />
      case 'join_date':
        return <SortHeader key={key} sortKey={sortKey} sortDir={sortDir} onSort={onSort} label="Data dołączenia" sk="join_date" />
      case 'phone':
        return <th key={key} className="text-center px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>Telefon</th>
      case 'age':
        return <th key={key} className="text-center px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>Wiek</th>
      case 'city':
        return <th key={key} className="text-center px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>Miasto</th>
    }
  }

  return (
    <>
      {sortKey && (
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Sortowanie jest aktywne. Przeciąganie wróci po wyłączeniu sortowania.
        </p>
      )}
      <div className="rounded-2xl overflow-x-auto" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <table className="w-full text-sm" style={{ minWidth: 900 }}>
          <thead>
            <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
              <th className="px-3 py-4 w-8" style={{ color: sortKey ? 'var(--border)' : 'var(--text-muted)' }} title={sortKey ? 'Przeciąganie jest wyłączone podczas sortowania' : 'Przeciągnij, aby zmienić kolejność'}>
                ⠿
              </th>
              <SortHeader sortKey={sortKey} sortDir={sortDir} onSort={onSort} label="Zawodnik" sk="name" />
              <SortHeader sortKey={sortKey} sortDir={sortDir} onSort={onSort} label="Status" sk="status" />
              {orderedColumns.map((key) => renderColumnHeader(key))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((athlete, i) => {
              const lastSession = lastSessionMap[athlete.id]
              const nextSession = nextSessionMap[athlete.id]
              const signal = signalMap[athlete.id]
              const nextRace = nextRaceMap[athlete.id]
              const compliance = complianceMap[athlete.id]
              const isDraggingOver = dragOverId === athlete.id && draggingId !== athlete.id
              const statusDef = getStatusDef(athlete.status)
              const unreadMsg = unreadMessagesMap[athlete.id] ?? 0
              const unreadFb = unreadFeedbackMap[athlete.id] ?? 0
              const weeklyCount = weeklySessionCountMap[athlete.id] ?? 0
              const weeklyKm = weeklyLoadMap[athlete.id] ?? 0
              const hasAlert = athlete.status === 'alert' || athlete.status === 'warning'
              const hasRedSignal = signal === 'red'
              const hasUnpaid = unpaidInvoiceSet[athlete.id]
              const isProblematic = hasAlert || hasRedSignal || hasUnpaid

              return (
                <tr
                  key={athlete.id}
                  draggable={!sortKey}
                  onDragStart={() => onDragStart(athlete.id)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    onDragOver(athlete.id)
                  }}
                  onDrop={() => onDrop(athlete.id)}
                  onDragEnd={onDragEnd}
                  style={{
                    borderBottom: i < displayed.length - 1 ? '1px solid var(--border)' : 'none',
                    borderLeft: isProblematic ? `3px solid ${hasRedSignal || hasAlert ? '#E74C3C' : '#F1C40F'}` : '3px solid transparent',
                    background: isDraggingOver ? 'rgba(255,92,27,0.06)' : draggingId === athlete.id ? 'rgba(255,92,27,0.03)' : i % 2 === 0 ? 'var(--bg-elevated)' : 'var(--bg-card)',
                    opacity: draggingId === athlete.id ? 0.5 : 1,
                    outline: isDraggingOver ? '2px solid rgba(255,92,27,0.4)' : 'none',
                    transition: 'background 0.1s',
                  }}
                >
                  <td
                    className="pl-3 pr-1 py-4 text-center select-none"
                    style={{ color: sortKey ? 'var(--border)' : 'var(--text-muted)', fontSize: 16, cursor: sortKey ? 'not-allowed' : 'grab' }}
                    title={sortKey ? 'Wyłącz sortowanie, aby przeciągać wiersze' : 'Przeciągnij, aby zmienić kolejność'}
                  >
                    ⠿
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3 text-left">
                      <Avatar initials={athlete.avatar} size="sm" />
                      <div className="min-w-0">
                        <div className="font-medium flex items-center gap-1.5">
                          <Link href={`/coach/athletes/${athlete.id}`} className="truncate hover:text-orange-400 transition-colors">
                            {athlete.name}
                          </Link>
                          {!!unreadMsg && (
                            <span title={`${unreadMsg} wiadomości`} className="inline-flex items-center justify-center rounded-full text-white font-bold shrink-0" style={{ background: '#FF5C1B', minWidth: 16, height: 16, fontSize: 9, padding: '0 4px' }}>
                              {unreadMsg}
                            </span>
                          )}
                          {!!unreadFb && (
                            <span title={`${unreadFb} feedback`} className="inline-flex items-center justify-center rounded-full text-white font-bold shrink-0" style={{ background: '#3B82F6', minWidth: 16, height: 16, fontSize: 9, padding: '0 4px' }}>
                              {unreadFb}
                            </span>
                          )}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{athlete.email ?? '—'}</div>
                        {athlete.goal && <div className="text-xs mt-0.5 truncate max-w-52" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>{athlete.goal}</div>}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleActionMenu(athlete.id, e.currentTarget.getBoundingClientRect())
                          }}
                          className="mt-1.5 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] cursor-pointer transition-opacity hover:opacity-80"
                          style={{
                            background: actionMenuFor === athlete.id ? 'rgba(255,92,27,0.1)' : 'var(--bg-elevated)',
                            color: actionMenuFor === athlete.id ? '#FF5C1B' : 'var(--text-muted)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          Akcje <span className="opacity-50">▾</span>
                        </button>
                      </div>
                    </div>
                  </td>

                  <td
                    className="px-5 py-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleStatusMenu(athlete.id, e.currentTarget.getBoundingClientRect())
                    }}
                  >
                    <div className="flex items-center justify-center gap-2 cursor-pointer select-none hover:opacity-70 transition-opacity">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: statusDef.color }} />
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{statusDef.label}</span>
                      <span className="text-xs opacity-30">{editingStatusFor === athlete.id ? '▴' : '▾'}</span>
                    </div>
                  </td>

                  {orderedColumns.map((key) => {
                    switch (key) {
                      case 'last_session':
                        return (
                          <td key={key} className="px-5 py-3">
                            {lastSession ? (() => {
                              const { text, color } = daysAgo(lastSession.date)
                              const showDate = !['dziś', 'wczoraj'].includes(text)
                              return (
                                <div className="space-y-0.5 leading-tight text-center">
                                  <div className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>
                                    {sessionTypeLabel(lastSession.type as Parameters<typeof sessionTypeLabel>[0])}
                                  </div>
                                  <div className="text-sm font-semibold" style={{ color }}>{text}</div>
                                  {showDate && <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{formatDate(lastSession.date, { day: 'numeric', month: 'short' })}</div>}
                                </div>
                              )
                            })() : <EmptyValue />}
                          </td>
                        )
                      case 'next_session':
                        return (
                          <td key={key} className="px-5 py-3">
                            {nextSession ? (() => {
                              const { text, color } = daysUntil(nextSession.date)
                              const showDate = !['dziś', 'jutro'].includes(text)
                              return (
                                <div className="space-y-0.5 leading-tight text-center">
                                  <div className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>
                                    {sessionTypeLabel(nextSession.type as Parameters<typeof sessionTypeLabel>[0])}
                                  </div>
                                  <div className="text-sm font-semibold" style={{ color }}>{text}</div>
                                  {showDate && <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{formatDate(nextSession.date, { day: 'numeric', month: 'short' })}</div>}
                                </div>
                              )
                            })() : (
                              <div className="space-y-0.5 leading-tight text-center">
                                <div className="text-sm font-semibold" style={{ color: '#F1C40F' }}>Brak planu</div>
                                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Brak zaplanowanej sesji</div>
                              </div>
                            )}
                          </td>
                        )
                      case 'signal':
                        return (
                          <td key={key} className="px-5 py-3">
                            {signal ? (
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SIGNAL_COLORS[signal] ?? '#6B7280' }} />
                                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{SIGNAL_LABELS[signal] ?? signal}</span>
                                </div>
                                {lastFeedbackDateMap[athlete.id] && (() => {
                                  const { text } = daysAgo(lastFeedbackDateMap[athlete.id])
                                  return <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{text}</div>
                                })()}
                              </div>
                            ) : <EmptyValue />}
                          </td>
                        )
                      case 'compliance':
                        return (
                          <td key={key} className="px-5 py-3">
                            {compliance ? (() => {
                              const pct = Math.round((compliance.completed / compliance.total) * 100)
                              const color = pct >= 80 ? '#2ECC71' : pct >= 60 ? '#F1C40F' : '#E74C3C'
                              return (
                                <div className="text-center">
                                  <div className="text-sm font-semibold" style={{ color }}>{pct}%</div>
                                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{compliance.completed} z {compliance.total} sesji</div>
                                </div>
                              )
                            })() : <EmptyValue />}
                          </td>
                        )
                      case 'weekly_load':
                        return (
                          <td key={key} className="px-5 py-3">
                            {weeklyKm > 0 || weeklyCount > 0 ? (
                              <div className="text-center">
                                <div className="text-sm font-medium">{weeklyKm > 0 ? `${weeklyKm.toFixed(0)} km` : <span style={{ color: 'var(--text-muted)' }}>—</span>}</div>
                                {weeklyCount > 0 && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{sesjaLabel(weeklyCount)}</div>}
                              </div>
                            ) : <EmptyValue />}
                          </td>
                        )
                      case 'next_race':
                        return (
                          <td key={key} className="px-5 py-3">
                      {nextRace ? (() => {
                        const { text, color } = daysUntil(nextRace.date)
                        const raceMeta = [formatDate(nextRace.date, { day: 'numeric', month: 'short' }), nextRace.distance].filter(Boolean).join(' • ')
                        return (
                          <div className="space-y-0.5 leading-tight text-center">
                            <div className="text-[11px] font-medium uppercase tracking-[0.08em] truncate max-w-44 mx-auto" style={{ color: 'var(--text-muted)' }}>
                              {nextRace.name}
                            </div>
                            <div className="text-sm font-semibold" style={{ color }}>{text}</div>
                            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{raceMeta || 'Zaplanowany start'}</div>
                          </div>
                        )
                      })() : <EmptyValue />}
                          </td>
                        )
                      case 'package':
                        return (
                          <td key={key} className="px-5 py-3">
                            <div className="flex flex-col items-center justify-center gap-1">
                              {athlete.package ? (
                                <>
                                  <div className="text-sm font-medium text-center">
                                    {athlete.package}
                                  </div>
                                  {(athlete.package_price ?? 0) > 0 && (
                                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                      {formatCurrency(athlete.package_price)}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <EmptyValue />
                              )}
                              {unpaidInvoiceSet[athlete.id] && (
                                <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: 'rgba(231,76,60,0.12)', color: '#E74C3C' }}>
                                  Nieopłacone
                                </span>
                              )}
                            </div>
                          </td>
                        )
                      case 'join_date':
                        return (
                          <td key={key} className="px-5 py-3 text-center">
                            {athlete.join_date ? (
                              <div className="text-center">
                                <div className="text-sm" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                  {formatDate(athlete.join_date, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                                <div className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                                  {tenureLabel(athlete.join_date)}
                                </div>
                              </div>
                            ) : <EmptyValue />}
                          </td>
                        )
                      case 'phone':
                        return (
                          <td key={key} className="px-5 py-3 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                            {athlete.phone ? <a href={`tel:${athlete.phone}`} className="hover:text-orange-400 transition-colors">{athlete.phone}</a> : <EmptyValue />}
                          </td>
                        )
                      case 'age':
                        return <td key={key} className="px-5 py-3 text-sm text-center" style={{ whiteSpace: 'nowrap' }}>{athlete.age !== null ? `${athlete.age} lat` : <EmptyValue />}</td>
                      case 'city':
                        return <td key={key} className="px-5 py-3 text-sm text-center" style={{ color: 'var(--text-muted)' }}>{athlete.city || <EmptyValue />}</td>
                    }
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
