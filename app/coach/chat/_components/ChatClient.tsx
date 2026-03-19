'use client'

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SelectField } from '@/components/ui/SelectField'
import { formatDate, getInitials } from '@/lib/utils'
import { loadThreadMessages, markCoachThreadRead, sendMessage } from '@/lib/actions/messages'
import { usePushSubscription } from '@/lib/usePushSubscription'
import type { MessageRow } from '@/lib/supabase/database.types'

type ChatAthlete = {
  id: string
  name: string
  avatar: string
  goal: string
  package: string
  slug: string
}

type ThreadSummary = {
  athlete: ChatAthlete
  lastMessage: { id: string; sender_type: string; content: string; created_at: string } | null
  unreadCount: number
}

type ThreadFilter = 'all' | 'unread' | 'needs_reply'

/** Thread awaits coach reply: last message is from athlete */
function awaitingReply(t: ThreadSummary): boolean {
  return !!t.lastMessage && t.lastMessage.sender_type === 'athlete'
}

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

/** Format date separator label */
function dateSeparatorLabel(isoDate: string): string {
  const d = new Date(isoDate)
  const now = new Date()

  if (d.toDateString() === now.toDateString()) return 'Dzisiaj'

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Wczoraj'

  return formatDate(isoDate, { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Get date string (YYYY-MM-DD) from ISO timestamp */
function dateKey(isoDate: string): string {
  return isoDate.slice(0, 10)
}

// Optimistic message placeholder
type OptimisticMessage = MessageRow & { _optimistic?: boolean }

export function ChatClient({ threadSummaries, coachId, coachName, initialAthleteId, initialFilter }: {
  threadSummaries: ThreadSummary[]
  coachId: string
  coachName: string
  initialAthleteId?: string
  initialFilter?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlAthleteId = searchParams.get('athlete')

  const [selectedAthleteId, setSelectedAthleteId] = useState(urlAthleteId ?? initialAthleteId ?? threadSummaries[0]?.athlete.id ?? '')
  const selectedAthleteRef = useRef(selectedAthleteId)
  selectedAthleteRef.current = selectedAthleteId
  const [threadMessages, setThreadMessages] = useState<OptimisticMessage[]>([])
  const [loadedAthleteId, setLoadedAthleteId] = useState('')
  const [loadingThread, setLoadingThread] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ThreadFilter>(() => {
    const f = initialFilter ?? searchParams.get('filter')
    if (f === 'unread' || f === 'needs_reply') return f
    return 'all'
  })
  const [pageVisible, setPageVisible] = useState(true)
  const [localSummaries, setLocalSummaries] = useState<ThreadSummary[]>(threadSummaries)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { permission, subscribe } = usePushSubscription(coachId, 'coach')

  // Sync from server
  useEffect(() => {
    setLocalSummaries(threadSummaries)
  }, [threadSummaries])

  // URL sync: update selectedAthleteId from URL
  useEffect(() => {
    if (urlAthleteId && urlAthleteId !== selectedAthleteId) {
      setSelectedAthleteId(urlAthleteId)
    }
  }, [urlAthleteId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof document === 'undefined') return

    const syncVisibility = () => {
      setPageVisible(document.visibilityState === 'visible')
    }

    syncVisibility()
    document.addEventListener('visibilitychange', syncVisibility)
    return () => document.removeEventListener('visibilitychange', syncVisibility)
  }, [])

  // Load thread messages when selected athlete changes
  const loadMessages = useCallback(async (athleteId: string) => {
    if (!athleteId) return
    setLoadingThread(true)
    setLoadError(false)
    try {
      const msgs = await loadThreadMessages(athleteId)
      // Race condition guard: only update if athlete didn't change
      if (selectedAthleteRef.current === athleteId) {
        setThreadMessages(msgs)
        setLoadedAthleteId(athleteId)
      }
    } catch {
      setLoadError(true)
    } finally {
      setLoadingThread(false)
    }
  }, [])

  // Load messages when selected athlete changes
  useEffect(() => {
    if (!selectedAthleteId) return
    void loadMessages(selectedAthleteId)
  }, [selectedAthleteId, loadMessages])

  // Poll: refresh sidebar summaries + current thread every 15s, only when tab is visible
  useEffect(() => {
    if (!pageVisible) return

    const interval = setInterval(() => {
      startTransition(() => router.refresh())
      if (selectedAthleteId) void loadMessages(selectedAthleteId)
    }, 15000)

    return () => clearInterval(interval)
  }, [pageVisible, router, selectedAthleteId, loadMessages])

  // Refresh immediately when tab becomes visible again
  useEffect(() => {
    if (pageVisible && selectedAthleteId) {
      startTransition(() => router.refresh())
      void loadMessages(selectedAthleteId)
    }
  }, [pageVisible]) // eslint-disable-line react-hooks/exhaustive-deps

  // Mark athlete messages as read after the trainer has actively viewed the thread for a moment
  useEffect(() => {
    if (!selectedAthleteId) return
    if (loadedAthleteId !== selectedAthleteId) return
    const hasUnreadFromAthlete = threadMessages.some(m => m.sender_type === 'athlete' && !m.read)
    if (!hasUnreadFromAthlete) return
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return

    const timeout = window.setTimeout(() => {
      // Optimistic: mark as read locally
      setLocalSummaries(prev => prev.map(t =>
        t.athlete.id === selectedAthleteId ? { ...t, unreadCount: 0 } : t
      ))
      void markCoachThreadRead(selectedAthleteId)
    }, 1200)

    return () => window.clearTimeout(timeout)
  }, [loadedAthleteId, threadMessages, selectedAthleteId])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [threadMessages.length])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }, [input])

  // Sort & filter threads
  const sortedThreads = useMemo(() => {
    return [...localSummaries].sort((a, b) => {
      // Unread first
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1
      // Awaiting reply second
      const aWaiting = awaitingReply(a)
      const bWaiting = awaitingReply(b)
      if (aWaiting && !bWaiting) return -1
      if (!aWaiting && bWaiting) return 1
      // Then by last message time
      const aTime = a.lastMessage?.created_at ?? ''
      const bTime = b.lastMessage?.created_at ?? ''
      if (aTime > bTime) return -1
      if (aTime < bTime) return 1
      return a.athlete.name.localeCompare(b.athlete.name, 'pl')
    })
  }, [localSummaries])

  const filteredThreads = useMemo(() => {
    let list = sortedThreads
    if (filter === 'unread') list = list.filter(t => t.unreadCount > 0)
    else if (filter === 'needs_reply') list = list.filter(t => awaitingReply(t))

    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(t => t.athlete.name.toLowerCase().includes(q))
  }, [sortedThreads, search, filter])

  const totalUnread = useMemo(() => localSummaries.reduce((s, t) => s + t.unreadCount, 0), [localSummaries])
  const needsReplyCount = useMemo(() => localSummaries.filter(t => awaitingReply(t)).length, [localSummaries])
  const selectedAthlete = localSummaries.find(t => t.athlete.id === selectedAthleteId)?.athlete

  function selectAthlete(id: string) {
    setSelectedAthleteId(id)
    setSendError(false)
    setLoadError(false)
    // Update URL without full navigation
    const url = new URL(window.location.href)
    url.searchParams.set('athlete', id)
    if (filter !== 'all') url.searchParams.set('filter', filter)
    else url.searchParams.delete('filter')
    window.history.replaceState(null, '', url.toString())
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  async function handleSend() {
    if (!input.trim() || !selectedAthleteId || sending) return
    const content = input.trim()
    setSending(true)
    setSendError(false)
    setInput('')

    // Optimistic: add message locally
    const optimisticMsg: OptimisticMessage = {
      id: `opt_${Date.now()}`,
      coach_id: coachId,
      athlete_id: selectedAthleteId,
      sender_type: 'coach',
      content,
      read: true,
      created_at: new Date().toISOString(),
      _optimistic: true,
    }
    setThreadMessages(prev => [...prev, optimisticMsg])

    // Optimistic: update sidebar summary
    setLocalSummaries(prev => prev.map(t =>
      t.athlete.id === selectedAthleteId
        ? {
            ...t,
            lastMessage: { id: optimisticMsg.id, sender_type: 'coach', content, created_at: optimisticMsg.created_at },
          }
        : t
    ))

    try {
      const fd = new FormData()
      fd.set('athlete_id', selectedAthleteId)
      fd.set('content', content)
      fd.set('coach_name', coachName)
      const result = await sendMessage(null, fd)
      if (result && 'error' in result) {
        // Remove optimistic message, restore input
        setThreadMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
        setInput(content)
        setSendError(true)
      } else {
        // Replace optimistic with real data
        await loadMessages(selectedAthleteId)
        startTransition(() => router.refresh())
      }
    } catch {
      setThreadMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      setInput(content)
      setSendError(true)
    } finally {
      setSending(false)
    }
  }

  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const coachInitials = getInitials(coachName) || '?'

  if (threadSummaries.length === 0) {
    return (
      <div>
        <CoachTopbar title="Czat" subtitle="Rozmowy z zawodnikami" />
        <div className="p-4 sm:p-6">
          <EmptyState
            title="Nie ma jeszcze rozmów do pokazania"
            description="Czat pojawi się tutaj, gdy dodasz zawodnika i rozpocznie się pierwsza wiadomość po jednej ze stron."
          />
        </div>
      </div>
    )
  }

  // Build date separators for messages
  const messagesWithSeparators: Array<{ type: 'separator'; label: string; key: string } | { type: 'message'; msg: OptimisticMessage }> = []
  let lastDate = ''
  for (const msg of threadMessages) {
    const msgDate = dateKey(msg.created_at)
    if (msgDate !== lastDate) {
      messagesWithSeparators.push({ type: 'separator', label: dateSeparatorLabel(msg.created_at), key: `sep_${msgDate}` })
      lastDate = msgDate
    }
    messagesWithSeparators.push({ type: 'message', msg })
  }

  return (
    <div className="sticky top-0 flex h-dvh flex-col overflow-hidden -mb-64">
      <CoachTopbar title="Czat" subtitle={totalUnread > 0 ? `${totalUnread} nieprzeczytanych` : `${threadSummaries.length} zawodników`} />

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Sidebar: thread list ── */}
        <div className="w-72 border-r flex flex-col shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          {/* Filters + search */}
          <div className="px-3 py-3 border-b space-y-3" style={{ borderColor: 'var(--border)' }}>
            <SelectField value={filter} onChange={(value) => setFilter(value as ThreadFilter)}>
              <option value="all">Wszystkie rozmowy ({localSummaries.length})</option>
              <option value="needs_reply">Wymaga odpowiedzi{needsReplyCount > 0 ? ` (${needsReplyCount})` : ''}</option>
              <option value="unread">Nieprzeczytane{totalUnread > 0 ? ` (${totalUnread})` : ''}</option>
            </SelectField>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Szukaj zawodnika..."
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Thread list */}
          <div className="overflow-y-auto flex-1">
            {filteredThreads.length === 0 && (
              <div className="p-3">
                <EmptyState
                  title="Brak rozmów w tym widoku"
                  description="Zmień filtr lub wyczyść wyszukiwanie."
                />
              </div>
            )}
            {filteredThreads.map(({ athlete, lastMessage, unreadCount }) => {
              const isActive = athlete.id === selectedAthleteId
              const waiting = lastMessage && lastMessage.sender_type === 'athlete' && unreadCount === 0
              return (
                <button key={athlete.id} onClick={() => selectAthlete(athlete.id)}
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

        {/* ── Chat area ── */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--bg-base)' }}>
          {/* Thread header */}
          <div className="flex items-center gap-3 px-6 py-3 border-b shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            {selectedAthlete && (
              <>
                <Avatar initials={selectedAthlete.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{selectedAthlete.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {selectedAthlete.package}{selectedAthlete.goal ? ` · ${selectedAthlete.goal}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/coach/athletes/${selectedAthlete.id}?tab=feedback`}
                    className="px-3 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}
                  >
                    Feedback
                  </Link>
                  <Link
                    href={`/coach/athletes/${selectedAthlete.id}`}
                    className="px-3 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}
                  >
                    Profil
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Push notification prompt */}
          {permission === 'default' && (
            <div className="px-6 pt-3 shrink-0">
              <button onClick={subscribe}
                className="px-4 py-2.5 rounded-xl text-sm cursor-pointer w-full text-left transition-opacity hover:opacity-80"
                style={{ background: 'rgba(255,92,27,0.1)', border: '1px solid rgba(255,92,27,0.3)', color: '#FF5C1B' }}>
                🔔 Włącz powiadomienia o nowych wiadomościach
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
            {/* Limit 200 info */}
            {threadMessages.length >= 200 && (
              <div className="text-center text-xs py-2 rounded-xl mb-2" style={{ color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}>
                Wyświetlono ostatnie 200 wiadomości
              </div>
            )}

            {loadingThread && threadMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: '#FF5C1B' }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Wczytywanie rozmowy...</span>
              </div>
            )}
            {loadError && (
              <EmptyState
                title="Nie udało się wczytać rozmowy"
                description="Sprawdź połączenie i spróbuj ponownie."
                actionLabel="Spróbuj ponownie"
                onAction={() => loadMessages(selectedAthleteId)}
              />
            )}
            {!loadingThread && !loadError && threadMessages.length === 0 && (
              <EmptyState
                title="Ta rozmowa jest jeszcze pusta"
                description="Wyślij pierwszą wiadomość, a wątek zacznie się budować tutaj."
              />
            )}
            {!loadingThread && !loadError && threadMessages.length === 0 && (
              <div ref={bottomRef} />
            )}
            {threadMessages.length > 0 && messagesWithSeparators.map(item => {
              if (item.type === 'separator') {
                return (
                  <div key={item.key} className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    <span className="text-xs font-medium shrink-0" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  </div>
                )
              }
              const msg = item.msg
              const isCoach = msg.sender_type === 'coach'
              const isOptimistic = msg._optimistic
              return (
                <div key={msg.id} className={`flex gap-3 ${isCoach ? 'flex-row-reverse' : ''}`} style={{ opacity: isOptimistic ? 0.6 : 1 }}>
                  <Avatar initials={isCoach ? coachInitials : (selectedAthlete?.avatar || '?')} size="sm" />
                  <div className={`flex flex-col gap-1 ${isCoach ? 'items-end' : 'items-start'}`} style={{ maxWidth: '65%' }}>
                    <div className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                      style={{
                        background: isCoach ? '#FF5C1B' : 'var(--bg-elevated)',
                        color: isCoach ? 'white' : 'var(--text-primary)',
                        borderRadius: isCoach ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      }}>
                      {msg.content}
                    </div>
                    <div className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
                      {isOptimistic ? 'Wysyłanie...' : formatDate(msg.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}
            {threadMessages.length > 0 && <div ref={bottomRef} />}
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            {sendError && (
              <div className="text-xs mb-2 px-1 flex items-center gap-2" style={{ color: '#E74C3C' }}>
                <span>Nie udało się wysłać wiadomości.</span>
                <button onClick={handleSend} className="underline cursor-pointer hover:opacity-80">Spróbuj ponownie</button>
              </div>
            )}
            <div className="flex items-end gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => { setInput(e.target.value); setSendError(false) }}
                onKeyDown={handleTextareaKeyDown}
                placeholder={`Napisz do ${selectedAthlete?.name ?? 'zawodnika'}…`}
                rows={1}
                className="flex-1 px-4 py-3 rounded-2xl text-sm resize-none overflow-hidden"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', maxHeight: 120 }}
              />
              <Button onClick={handleSend} disabled={!input.trim() || sending}>
                {sending ? '…' : 'Wyślij'}
              </Button>
            </div>
            <div className="text-xs mt-1.5 px-1" style={{ color: 'var(--text-muted)' }}>
              Enter — wyślij · Shift+Enter — nowa linia
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
