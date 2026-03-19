'use client'

import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { SelectField } from '@/components/ui/SelectField'
import { formatDate } from '@/lib/utils'
import type { ThreadFilter, ThreadSummary } from './ChatClient'

/** Format time for sidebar: short and contextual */
function sidebarTime(isoDate: string): string {
  const now = new Date()
  const d = new Date(isoDate)
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'teraz'
  if (diffMin < 60) return `${diffMin} min`

  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Wczoraj'

  return formatDate(isoDate, { day: 'numeric', month: 'short' })
}

export function ChatSidebar({
  threadSummaries,
  filter,
  search,
  selectedAthleteId,
  totalUnread,
  needsReplyCount,
  totalCount,
  onFilterChange,
  onSearchChange,
  onSelectAthlete,
}: {
  threadSummaries: ThreadSummary[]
  filter: ThreadFilter
  search: string
  selectedAthleteId: string
  totalUnread: number
  needsReplyCount: number
  totalCount: number
  onFilterChange: (filter: ThreadFilter) => void
  onSearchChange: (search: string) => void
  onSelectAthlete: (id: string) => void
}) {
  return (
    <div className="w-72 border-r flex flex-col shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
      {/* Filters + search */}
      <div className="px-3 py-3 border-b space-y-3" style={{ borderColor: 'var(--border)' }}>
        <SelectField value={filter} onChange={(value) => onFilterChange(value as ThreadFilter)}>
          <option value="all">Wszystkie rozmowy ({totalCount})</option>
          <option value="needs_reply">Wymaga odpowiedzi{needsReplyCount > 0 ? ` (${needsReplyCount})` : ''}</option>
          <option value="unread">Nieprzeczytane{totalUnread > 0 ? ` (${totalUnread})` : ''}</option>
        </SelectField>
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Szukaj zawodnika..."
          className="w-full px-3 py-2 rounded-xl text-sm"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Thread list */}
      <div className="overflow-y-auto flex-1">
        {threadSummaries.length === 0 && (
          <div className="p-3">
            <EmptyState
              title="Brak rozmów w tym widoku"
              description="Zmień filtr lub wyczyść wyszukiwanie."
            />
          </div>
        )}
        {threadSummaries.map(({ athlete, lastMessage, unreadCount }) => {
          const isActive = athlete.id === selectedAthleteId
          const waiting = lastMessage && lastMessage.sender_type === 'athlete' && unreadCount === 0
          return (
            <button key={athlete.id} onClick={() => onSelectAthlete(athlete.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all cursor-pointer"
              style={{
                background: isActive ? 'rgba(255,92,27,0.08)' : undefined,
                borderLeft: isActive ? '3px solid #FF5C1B' : '3px solid transparent',
              }}>
              <div className="relative shrink-0">
                <Avatar initials={athlete.avatar} size="sm" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex items-center justify-center text-white font-bold rounded-full"
                    style={{ minWidth: 18, height: 18, fontSize: 10, background: '#FF5C1B', padding: '0 4px' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm truncate ${unreadCount > 0 ? 'font-bold' : 'font-medium'}`}>
                    {athlete.name}
                  </span>
                  {lastMessage && (
                    <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {sidebarTime(lastMessage.created_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-xs truncate flex-1 ${unreadCount > 0 ? 'font-semibold' : ''}`}
                    style={{ color: unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {lastMessage
                      ? `${lastMessage.sender_type === 'coach' ? 'Ty: ' : ''}${lastMessage.content.slice(0, 50)}${lastMessage.content.length > 50 ? '…' : ''}`
                      : 'Brak wiadomości'}
                  </span>
                  {waiting && (
                    <span className="text-[10px] shrink-0 px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
                      Czeka
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
