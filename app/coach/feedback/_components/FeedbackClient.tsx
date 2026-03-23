'use client'

import { startTransition, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorScreen } from '@/components/ui/ErrorScreen'
import { useStatusMessage } from '@/lib/hooks/useStatusMessage'
import { getBusinessToday } from '@/lib/date'
import { useClickOutside } from '@/lib/hooks/useClickOutside'
import { plural } from '@/lib/utils'
import { updateSearchParams } from '@/lib/url-helpers'
import { loadMoreFeedbacks, markFeedbackRead, markFeedbacksReadBulk, replyFeedback } from '@/lib/actions/feedback'
import { comparePriority, getFeedbackPriority } from '@/lib/feedback-priority'
import { FeedbackSidebar } from './FeedbackSidebar'
import { FeedbackDetailPanel } from './FeedbackDetailPanel'
import type { FeedbackWithJoins, FeedbackWithPriority, Filter, ViewMode } from './types'

// Re-export types for any external consumers
export type { FeedbackWithJoins, FeedbackWithPriority, Filter, ViewMode } from './types'

function needsAction(f: FeedbackWithJoins): boolean {
  return (f.signal === 'red' || f.signal === 'yellow') && (!f.read || !f.coach_reply)
}

const VALID_FILTERS: Filter[] = ['all', 'today', 'unread', 'needs_action', 'needs_reply']
const PREFS_KEY = 'feedback-view-prefs'

// ── Main component ────────────────────────────────────────────────────────────

export function FeedbackClient({
  feedbacks: initialFeedbacks,
  totalCount,
  initialAthleteId = '',
  initialFilter = 'all',
  error,
  noAthletes,
}: {
  feedbacks: FeedbackWithJoins[]
  totalCount: number
  initialAthleteId?: string
  initialFilter?: string
  error?: string
  noAthletes?: boolean
}) {
  if (error || noAthletes) {
    return <FeedbackShell error={error} noAthletes={noAthletes} />
  }

  return (
    <FeedbackClientInner
      initialFeedbacks={initialFeedbacks}
      totalCount={totalCount}
      initialAthleteId={initialAthleteId}
      initialFilter={initialFilter}
    />
  )
}

function FeedbackShell({ error, noAthletes }: { error?: string; noAthletes?: boolean }) {
  const router = useRouter()

  return (
    <div className="sticky top-0 flex h-dvh flex-col overflow-hidden -mb-64">
      <CoachTopbar title="Feedback" />
      <div className="flex items-center justify-center flex-1" style={{ background: 'var(--bg-base)' }}>
        {error ? (
          <ErrorScreen variant="data" description={error} onRetry={() => router.refresh()} />
        ) : noAthletes ? (
          <EmptyState
            icon="👥"
            title="Brak zawodników"
            description="Dodaj zawodnika w zakładce Zawodnicy, aby zobaczyć ich feedbacki."
          />
        ) : null}
      </div>
    </div>
  )
}

function FeedbackClientInner({
  initialFeedbacks,
  totalCount,
  initialAthleteId,
  initialFilter,
}: {
  initialFeedbacks: FeedbackWithJoins[]
  totalCount: number
  initialAthleteId: string
  initialFilter: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const today = getBusinessToday()

  // URL params for deep linking
  const urlView = searchParams.get('view') as ViewMode | null
  const urlHighlight = searchParams.get('highlight')

  const normalizedInitialFilter = (
    VALID_FILTERS.includes(initialFilter as Filter)
      ? initialFilter
      : 'all'
  ) as Filter

  // Hydration-safe: detect client
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false)

  const [filter, setFilter] = useState<Filter>(normalizedInitialFilter)
  const [viewModeOverride, setViewModeOverride] = useState<ViewMode | null>(urlView)

  // Computed: override > persisted > default
  const viewMode: ViewMode = viewModeOverride ?? (hydrated ? (() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY)
      if (stored) {
        const parsed = (JSON.parse(stored) as { viewMode?: string }).viewMode
        if (parsed === 'priority' || parsed === 'chronological') return parsed
        if (parsed === 'urgency' || parsed === 'grouped') {
          localStorage.setItem(PREFS_KEY, JSON.stringify({ viewMode: 'priority' }))
          return 'priority' as ViewMode
        }
      }
    } catch { /* ignore */ }
    return 'priority'
  })() : 'priority')

  const [athleteFilter, setAthleteFilter] = useState<string>(initialAthleteId || 'all')
  const [localFeedbacks, setLocalFeedbacks] = useState<FeedbackWithJoins[]>(initialFeedbacks)
  const [selectedId, setSelectedId] = useState<string | null>(urlHighlight)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [markingReadId, setMarkingReadId] = useState<string | null>(null)
  const [bulkMarking, setBulkMarking] = useState(false)
  const [search, setSearch] = useState('')
  const [legendOpen, setLegendOpen] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const legendRef = useRef<HTMLDivElement>(null)
  const closeLegend = useCallback(() => setLegendOpen(false), [])
  useClickOutside(legendRef, closeLegend, legendOpen)
  const { statusMessage, showStatus, clearStatus } = useStatusMessage()

  // Persist view preferences
  useEffect(() => {
    if (viewModeOverride) {
      try { localStorage.setItem(PREFS_KEY, JSON.stringify({ viewMode })) } catch { /* ignore */ }
    }
  }, [viewModeOverride, viewMode])

  useEffect(() => { setAthleteFilter(initialAthleteId || 'all') }, [initialAthleteId])
  useEffect(() => { setFilter(normalizedInitialFilter) }, [normalizedInitialFilter])
  useEffect(() => { setLocalFeedbacks(initialFeedbacks) }, [initialFeedbacks])

  // Unique athletes for dropdown
  const athletes = useMemo(() => {
    const map = new Map<string, { id: string; name: string; avatar: string | null }>()
    for (const f of localFeedbacks) {
      if (f.athletes && !map.has(f.athletes.id)) map.set(f.athletes.id, f.athletes)
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'pl'))
  }, [localFeedbacks])

  // Compute priorities
  const feedbacksWithPriority: FeedbackWithPriority[] = useMemo(() => {
    const now = new Date()
    return localFeedbacks.map(f => ({ ...f, priority: getFeedbackPriority(f, now) }))
  }, [localFeedbacks])

  // Filter + sort
  const filtered = useMemo(() => {
    let list = feedbacksWithPriority

    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(f => {
        const haystack = [f.notes_structured, f.voice_transcript, f.transcript, f.coach_reply, f.athletes?.name].filter(Boolean).join(' ').toLowerCase()
        return haystack.includes(q)
      })
    }

    if (athleteFilter !== 'all') list = list.filter(f => f.athletes?.id === athleteFilter)

    if (filter === 'today') list = list.filter(f => f.date === today)
    else if (filter === 'unread') list = list.filter(f => !f.read)
    else if (filter === 'needs_action') list = list.filter(f => needsAction(f))
    else if (filter === 'needs_reply') list = list.filter(f => !f.coach_reply)

    if (viewMode === 'priority') {
      list = [...list].sort((a, b) => comparePriority(
        { score: a.priority.score, created_at: a.created_at },
        { score: b.priority.score, created_at: b.created_at },
      ))
    }

    return list
  }, [feedbacksWithPriority, athleteFilter, filter, viewMode, today, search])

  const unreadCount = useMemo(() => localFeedbacks.filter(f => !f.read).length, [localFeedbacks])
  const urgentCount = useMemo(() => feedbacksWithPriority.filter(f => f.priority.level === 'critical' || f.priority.level === 'high').length, [feedbacksWithPriority])
  const filteredUnreadIds = useMemo(() => filtered.filter(f => !f.read).map(f => f.id), [filtered])

  const selectedFeedback = useMemo(
    () => filtered.find(f => f.id === selectedId) ?? null,
    [filtered, selectedId],
  )

  // Auto-select first item when selection is gone
  useEffect(() => {
    if (filtered.length > 0 && (!selectedId || !filtered.some(f => f.id === selectedId))) {
      setSelectedId(filtered[0].id)
    }
  }, [filtered]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── URL sync: push state changes to URL ───────────────────────────────────
  useEffect(() => {
    if (!hydrated) return
    updateSearchParams({
      filter: filter !== 'all' ? filter : undefined,
      athlete: athleteFilter !== 'all' ? athleteFilter : undefined,
      view: viewModeOverride ?? undefined,
      selected: selectedId ?? undefined,
    })
  }, [filter, athleteFilter, viewModeOverride, selectedId, hydrated])

  // ── Next unread helper ────────────────────────────────────────────────────
  const nextUnreadId = useMemo(() => {
    const currentIdx = filtered.findIndex(f => f.id === selectedId)
    // Search forward from current position
    for (let i = currentIdx + 1; i < filtered.length; i++) {
      if (!filtered[i].read) return filtered[i].id
    }
    // Wrap around from start
    for (let i = 0; i < currentIdx; i++) {
      if (!filtered[i].read) return filtered[i].id
    }
    return null
  }, [filtered, selectedId])

  function handleNextUnread() {
    if (nextUnreadId) handleSelect(nextUnreadId)
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSelect(id: string) {
    setSelectedId(id)
    if (replyingId && replyingId !== id) {
      setReplyingId(null)
      setReplyText('')
    }
  }

  async function handleMarkRead(id: string, athleteId?: string) {
    if (markingReadId) return
    const previousFeedbacks = localFeedbacks
    setLocalFeedbacks(current => current.map(feedback => (feedback.id === id ? { ...feedback, read: true } : feedback)))
    setMarkingReadId(id)
    clearStatus()
    try {
      const result = await markFeedbackRead(id, athleteId)
      if (result && 'error' in result) {
        setLocalFeedbacks(previousFeedbacks)
        showStatus('error', `Nie udało się oznaczyć feedbacku jako przeczytany: ${result.error}`)
        return
      }
      startTransition(() => router.refresh())
    } finally {
      setMarkingReadId(null)
    }
  }

  async function handleBulkMarkRead(ids: string[]) {
    if (bulkMarking || ids.length === 0) return
    const previousFeedbacks = localFeedbacks
    const idSet = new Set(ids)
    setLocalFeedbacks(current => current.map(f => (idSet.has(f.id) ? { ...f, read: true } : f)))
    setBulkMarking(true)
    clearStatus()
    try {
      const result = await markFeedbacksReadBulk(ids)
      if (result && 'error' in result) {
        setLocalFeedbacks(previousFeedbacks)
        showStatus('error', `Nie udało się oznaczyć feedbacków jako przeczytane: ${result.error}`)
        return
      }
      showStatus('success', `Oznaczono ${ids.length} ${plural(ids.length, 'feedback', 'feedbacki', 'feedbacków')} jako przeczytane.`)
      startTransition(() => router.refresh())
    } finally {
      setBulkMarking(false)
    }
  }

  async function handleReply(id: string, athleteId: string) {
    if (!replyText.trim() || submitting) return
    setSubmitting(true)
    clearStatus()
    const fd = new FormData()
    fd.set('id', id)
    fd.set('athlete_id', athleteId)
    fd.set('reply', replyText)
    const replyValue = replyText.trim()
    try {
      const result = await replyFeedback(null, fd)
      if (result && 'error' in result) {
        showStatus('error', `Nie udało się zapisać odpowiedzi: ${result.error}`)
        return
      }
      setLocalFeedbacks(current => current.map(f => (f.id === id ? { ...f, coach_reply: replyValue, read: true } : f)))
      setReplyingId(null)
      setReplyText('')
      showStatus('success', 'Odpowiedź została zapisana.')
      startTransition(() => router.refresh())
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLoadMore() {
    if (loadingMore) return
    setLoadingMore(true)
    try {
      const result = await loadMoreFeedbacks(localFeedbacks.length)
      if ('error' in result) {
        showStatus('error', `Nie udało się załadować więcej feedbacków: ${result.error}`)
        return
      }
      if (result.feedbacks && result.feedbacks.length > 0) {
        setLocalFeedbacks(current => {
          const existingIds = new Set(current.map(f => f.id))
          const newItems = (result.feedbacks as FeedbackWithJoins[]).filter(f => !existingIds.has(f.id))
          return newItems.length > 0 ? [...current, ...newItems] : current
        })
      }
    } finally {
      setLoadingMore(false)
    }
  }

  // ── Keyboard navigation ───────────────────────────────────────────────────
  // Refs for stable access in keydown handler (avoids stale closures)
  const stateRef = useRef({
    filtered, selectedId, replyingId, selectedFeedback,
    replyText, submitting, nextUnreadId,
  })
  stateRef.current = {
    filtered, selectedId, replyingId, selectedFeedback,
    replyText, submitting, nextUnreadId,
  }

  // Ref-stable action dispatchers for keyboard handler
  const actionsRef = useRef({ handleReply, handleMarkRead, handleSelect })
  actionsRef.current = { handleReply, handleMarkRead, handleSelect }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'
      const s = stateRef.current
      const a = actionsRef.current

      // Ctrl+Enter: submit reply (works even in textarea)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && s.replyingId) {
        e.preventDefault()
        const fb = s.selectedFeedback
        if (fb && s.replyText.trim() && !s.submitting) {
          a.handleReply(fb.id, fb.athletes?.id ?? '')
        }
        return
      }

      // Escape: cancel reply
      if (e.key === 'Escape' && s.replyingId) {
        e.preventDefault()
        setReplyingId(null)
        return
      }

      // Skip other shortcuts when focused on inputs
      if (isInput) return

      const curIdx = s.filtered.findIndex(f => f.id === s.selectedId)

      switch (e.key) {
        case 'ArrowUp':
        case 'k':
          e.preventDefault()
          if (curIdx > 0) a.handleSelect(s.filtered[curIdx - 1].id)
          break
        case 'ArrowDown':
        case 'j':
          e.preventDefault()
          if (curIdx >= 0 && curIdx < s.filtered.length - 1) a.handleSelect(s.filtered[curIdx + 1].id)
          break
        case 'n': {
          e.preventDefault()
          if (s.nextUnreadId) a.handleSelect(s.nextUnreadId)
          break
        }
        case 'r': {
          e.preventDefault()
          if (s.selectedId) {
            setReplyingId(s.selectedId)
            setReplyText(s.selectedFeedback?.coach_reply ?? '')
          }
          break
        }
        case 'm': {
          e.preventDefault()
          const fb = s.selectedFeedback
          if (fb && !fb.read) a.handleMarkRead(fb.id, fb.athletes?.id)
          break
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // ── Filter counts ─────────────────────────────────────────────────────────
  const countBase = athleteFilter !== 'all' ? localFeedbacks.filter(f => f.athletes?.id === athleteFilter) : localFeedbacks

  const filterButtons: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'Wszystkie', count: countBase.length },
    { id: 'needs_action', label: 'Wymaga reakcji', count: countBase.filter(f => needsAction(f)).length },
    { id: 'unread', label: 'Nieprzeczytane', count: countBase.filter(f => !f.read).length },
    { id: 'needs_reply', label: 'Bez odpowiedzi', count: countBase.filter(f => !f.coach_reply).length },
    { id: 'today', label: 'Dziś', count: countBase.filter(f => f.date === today).length },
  ]

  const hasMore = localFeedbacks.length < totalCount

  // ── Contextual subtitle ───────────────────────────────────────────────────
  const subtitle = search
    ? `Szukaj: «${search}» — ${filtered.length} ${plural(filtered.length, 'wynik', 'wyniki', 'wyników')}`
    : urgentCount > 0
      ? `${urgentCount} pilnych · ${unreadCount} nieprzeczytanych`
      : `${unreadCount} nieprzeczytanych`

  return (
    <div className="sticky top-0 flex h-dvh flex-col overflow-hidden -mb-64">
      <CoachTopbar title="Feedback" subtitle={subtitle} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <FeedbackSidebar
          feedbacks={filtered}
          selectedId={selectedId}
          onSelect={handleSelect}
          filter={filter}
          onFilterChange={setFilter}
          athleteFilter={athleteFilter}
          onAthleteFilterChange={setAthleteFilter}
          viewMode={viewMode}
          onViewModeChange={setViewModeOverride}
          athletes={athletes}
          filterButtons={filterButtons}
          search={search}
          onSearchChange={setSearch}
          filteredUnreadIds={filteredUnreadIds}
          bulkMarking={bulkMarking}
          onBulkMarkRead={handleBulkMarkRead}
          totalCount={totalCount}
          loadedCount={localFeedbacks.length}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={handleLoadMore}
        />

        <FeedbackDetailPanel
          fb={selectedFeedback}
          isReplying={replyingId === selectedId}
          replyText={replyingId === selectedId ? replyText : ''}
          submitting={submitting}
          markingRead={markingReadId === selectedId}
          onMarkRead={() => selectedFeedback && handleMarkRead(selectedFeedback.id, selectedFeedback.athletes?.id)}
          onReplyStart={() => {
            if (selectedId) {
              setReplyingId(selectedId)
              setReplyText(selectedFeedback?.coach_reply ?? '')
            }
          }}
          onReplyChange={setReplyText}
          onReplySubmit={() => selectedFeedback && handleReply(selectedFeedback.id, selectedFeedback.athletes?.id ?? '')}
          onReplyCancel={() => setReplyingId(null)}
          onNextUnread={nextUnreadId ? handleNextUnread : undefined}
          legendOpen={legendOpen}
          onLegendToggle={() => setLegendOpen(o => !o)}
          legendRef={legendRef}
          statusMessage={statusMessage}
        />
      </div>
    </div>
  )
}
