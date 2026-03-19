'use client'

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, getInitials } from '@/lib/utils'
import { loadThreadMessages, markCoachThreadRead, sendMessage } from '@/lib/actions/messages'
import { updateSearchParams } from '@/lib/url-helpers'
import { usePushSubscription } from '@/lib/usePushSubscription'
import type { MessageRow } from '@/lib/supabase/database.types'
import { ChatSidebar } from './ChatSidebar'
import { ChatThread } from './ChatThread'

// ── Exported types used by child components ──

export type ChatAthlete = {
  id: string
  name: string
  avatar: string
  goal: string
  package: string
  slug: string
}

export type ThreadSummary = {
  athlete: ChatAthlete
  lastMessage: { id: string; sender_type: string; content: string; created_at: string } | null
  unreadCount: number
}

export type ThreadFilter = 'all' | 'unread' | 'needs_reply'

// Optimistic message placeholder
export type OptimisticMessage = MessageRow & { _optimistic?: boolean }

export type MessageWithSeparator =
  | { type: 'separator'; label: string; key: string }
  | { type: 'message'; msg: OptimisticMessage }

// ── Helper functions ──

/** Thread awaits coach reply: last message is from athlete */
function awaitingReply(t: ThreadSummary): boolean {
  return !!t.lastMessage && t.lastMessage.sender_type === 'athlete'
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

// ── Main coordinator component ──

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
    updateSearchParams({
      athlete: id,
      filter: filter !== 'all' ? filter : undefined,
    })
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

  function handleInputChange(value: string) {
    setInput(value)
    setSendError(false)
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
  const messagesWithSeparators: MessageWithSeparator[] = []
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
        <ChatSidebar
          threadSummaries={filteredThreads}
          filter={filter}
          search={search}
          selectedAthleteId={selectedAthleteId}
          totalUnread={totalUnread}
          needsReplyCount={needsReplyCount}
          totalCount={localSummaries.length}
          onFilterChange={setFilter}
          onSearchChange={setSearch}
          onSelectAthlete={selectAthlete}
        />

        <ChatThread
          selectedAthlete={selectedAthlete}
          messagesWithSeparators={messagesWithSeparators}
          messageCount={threadMessages.length}
          coachInitials={coachInitials}
          loading={loadingThread}
          loadError={loadError}
          permission={permission}
          sendError={sendError}
          input={input}
          sending={sending}
          onSend={handleSend}
          onInputChange={handleInputChange}
          onKeyDown={handleTextareaKeyDown}
          onSubscribe={subscribe}
          onRetry={() => loadMessages(selectedAthleteId)}
          textareaRef={textareaRef}
          bottomRef={bottomRef}
        />
      </div>
    </div>
  )
}
