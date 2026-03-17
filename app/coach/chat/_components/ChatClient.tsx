'use client'

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { formatDateTime, getInitials, timeAgo } from '@/lib/utils'
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

type ThreadFilter = 'all' | 'unread'

function SelectField({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl px-3 py-2 pr-11 text-sm cursor-pointer appearance-none"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      >
        {children}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        ▾
      </span>
    </div>
  )
}

export function ChatClient({ threadSummaries, coachId, coachName, initialAthleteId }: {
  threadSummaries: ThreadSummary[]
  coachId: string
  coachName: string
  initialAthleteId?: string
}) {
  const router = useRouter()
  const [selectedAthleteId, setSelectedAthleteId] = useState(initialAthleteId ?? threadSummaries[0]?.athlete.id ?? '')
  const [threadMessages, setThreadMessages] = useState<MessageRow[]>([])
  const [loadedAthleteId, setLoadedAthleteId] = useState('')
  const [loadingThread, setLoadingThread] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ThreadFilter>('all')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { permission, subscribe } = usePushSubscription(coachId, 'coach')

  useEffect(() => {
    if (initialAthleteId) setSelectedAthleteId(initialAthleteId)
  }, [initialAthleteId])

  // Load thread messages when selected athlete changes
  const loadMessages = useCallback(async (athleteId: string) => {
    if (!athleteId) return
    setLoadingThread(true)
    try {
      const msgs = await loadThreadMessages(athleteId)
      setThreadMessages(msgs)
      setLoadedAthleteId(athleteId)
    } finally {
      setLoadingThread(false)
    }
  }, [])

  // Load messages when selected athlete changes
  useEffect(() => {
    if (!selectedAthleteId) return
    void loadMessages(selectedAthleteId)
  }, [selectedAthleteId, loadMessages])

  // Poll: refresh sidebar summaries + current thread every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => router.refresh())
      if (selectedAthleteId) void loadMessages(selectedAthleteId)
    }, 5000)
    return () => clearInterval(interval)
  }, [router, selectedAthleteId, loadMessages])

  // Mark athlete messages as read after the trainer has actively viewed the thread for a moment
  useEffect(() => {
    if (!selectedAthleteId) return
    if (loadedAthleteId !== selectedAthleteId) return
    const hasUnreadFromAthlete = threadMessages.some(m => m.sender_type === 'athlete' && !m.read)
    if (!hasUnreadFromAthlete) return
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return

    const timeout = window.setTimeout(() => {
      void markCoachThreadRead(selectedAthleteId)
    }, 1200)

    return () => window.clearTimeout(timeout)
  }, [loadedAthleteId, threadMessages, selectedAthleteId])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [threadMessages.length])

  // Sort & filter threads
  const sortedThreads = useMemo(() => {
    return [...threadSummaries].sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1
      const aTime = a.lastMessage?.created_at ?? ''
      const bTime = b.lastMessage?.created_at ?? ''
      if (aTime > bTime) return -1
      if (aTime < bTime) return 1
      return a.athlete.name.localeCompare(b.athlete.name, 'pl')
    })
  }, [threadSummaries])

  const filteredThreads = useMemo(() => {
    const byFilter = sortedThreads.filter((thread) => filter === 'unread' ? thread.unreadCount > 0 : true)

    if (!search.trim()) return byFilter
    const q = search.toLowerCase()
    return byFilter.filter(t => t.athlete.name.toLowerCase().includes(q))
  }, [sortedThreads, search, filter])

  const totalUnread = useMemo(() => threadSummaries.reduce((s, t) => s + t.unreadCount, 0), [threadSummaries])
  const selectedAthlete = threadSummaries.find(t => t.athlete.id === selectedAthleteId)?.athlete

  function selectAthlete(id: string) {
    setSelectedAthleteId(id)
    setSendError(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  async function handleSend() {
    if (!input.trim() || !selectedAthleteId || sending) return
    const content = input.trim()
    setSending(true)
    setSendError(false)
    setInput('')
    try {
      const fd = new FormData()
      fd.set('athlete_id', selectedAthleteId)
      fd.set('content', content)
      fd.set('coach_name', coachName)
      const result = await sendMessage(null, fd)
      if (result && 'error' in result) {
        setInput(content)
        setSendError(true)
      } else {
        // Reload thread and sidebar
        await loadMessages(selectedAthleteId)
        startTransition(() => router.refresh())
      }
    } catch {
      setInput(content)
      setSendError(true)
    } finally {
      setSending(false)
    }
  }

  const coachInitials = getInitials(coachName) || '?'

  if (threadSummaries.length === 0) {
    return (
      <div>
        <CoachTopbar title="Czat" subtitle="Rozmowy z zawodnikami" />
        <div className="flex items-center justify-center h-64 text-sm" style={{ color: 'var(--text-muted)' }}>
          Brak zawodników. Dodaj zawodnika, aby rozpocząć czat.
        </div>
      </div>
    )
  }

  return (
    <div className="sticky top-0 flex h-dvh flex-col overflow-hidden -mb-64">
      <CoachTopbar title="Czat" subtitle={totalUnread > 0 ? `${totalUnread} nieprzeczytanych` : `${threadSummaries.length} zawodników`} />

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Sidebar: thread list ── */}
        <div className="w-72 border-r flex flex-col shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          {/* Search */}
          <div className="px-3 py-3 border-b space-y-3" style={{ borderColor: 'var(--border)' }}>
            <SelectField value={filter} onChange={(value) => setFilter(value as ThreadFilter)}>
              <option value="all">Wszystkie rozmowy</option>
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
              <div className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
                Brak wyników
              </div>
            )}
            {filteredThreads.map(({ athlete, lastMessage, unreadCount }) => {
              const isActive = athlete.id === selectedAthleteId
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
                          {timeAgo(lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    <div className={`text-xs truncate mt-0.5 ${unreadCount > 0 ? 'font-semibold' : ''}`}
                      style={{ color: unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {lastMessage
                        ? `${lastMessage.sender_type === 'coach' ? 'Ty: ' : ''}${lastMessage.content.slice(0, 40)}${lastMessage.content.length > 40 ? '…' : ''}`
                        : 'Brak wiadomości'}
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
                <Link
                  href={`/coach/athletes/${selectedAthlete.id}`}
                  className="px-3 py-2 rounded-xl text-xs font-medium transition-opacity"
                  style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}
                >
                  Otwórz profil
                </Link>
              </>
            )}
          </div>

          {/* Push notification prompt */}
          {permission === 'default' && (
            <div className="px-6 pt-3 shrink-0">
              <button onClick={subscribe}
                className="px-4 py-2.5 rounded-xl text-sm cursor-pointer w-full text-left"
                style={{ background: 'rgba(255,92,27,0.1)', border: '1px solid rgba(255,92,27,0.3)', color: '#FF5C1B' }}>
                🔔 Włącz powiadomienia o nowych wiadomościach
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
            {loadingThread && threadMessages.length === 0 && (
              <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
                Wczytywanie...
              </div>
            )}
            {!loadingThread && threadMessages.length === 0 && (
              <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
                Brak wiadomości. Napisz pierwszą!
              </div>
            )}
            {threadMessages.map(msg => {
              const isCoach = msg.sender_type === 'coach'
              return (
                <div key={msg.id} className={`flex gap-3 ${isCoach ? 'flex-row-reverse' : ''}`}>
                  <Avatar initials={isCoach ? coachInitials : (selectedAthlete?.avatar || '?')} size="sm" />
                  <div className={`flex flex-col gap-1 ${isCoach ? 'items-end' : 'items-start'}`} style={{ maxWidth: '65%' }}>
                    <div className="px-4 py-3 text-sm leading-relaxed"
                      style={{
                        background: isCoach ? '#FF5C1B' : 'var(--bg-elevated)',
                        color: isCoach ? 'white' : 'var(--text-primary)',
                        borderRadius: isCoach ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      }}>
                      {msg.content}
                    </div>
                    <div className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>{formatDateTime(msg.created_at)}</div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            {sendError && (
              <div className="text-xs mb-2 px-1" style={{ color: '#E74C3C' }}>
                Nie udało się wysłać wiadomości. Spróbuj ponownie.
              </div>
            )}
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                value={input}
                onChange={e => { setInput(e.target.value); setSendError(false) }}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={`Napisz do ${selectedAthlete?.name ?? 'zawodnika'}…`}
                className="flex-1 px-4 py-3 rounded-2xl text-sm"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
              />
              <Button onClick={handleSend} disabled={!input.trim() || sending}>
                {sending ? '…' : 'Wyślij'}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
