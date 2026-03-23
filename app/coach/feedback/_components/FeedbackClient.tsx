'use client'

import { startTransition, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { useStatusMessage } from '@/lib/hooks/useStatusMessage'
import { getBusinessToday } from '@/lib/date'
import { useClickOutside } from '@/lib/hooks/useClickOutside'
import { plural } from '@/lib/utils'
import { markFeedbackRead, markFeedbacksReadBulk, replyFeedback } from '@/lib/actions/feedback'
import { FeedbackSidebar } from './FeedbackSidebar'
import { FeedbackDetailPanel } from './FeedbackDetailPanel'
import type { FeedbackRow } from '@/lib/supabase/database.types'

export type FeedbackWithJoins = FeedbackRow & {
  athletes: { id: string; name: string; avatar: string } | null
  training_sessions: {
    id: string
    title: string
    linked_strava_activity_id: number | null
    actual_distance: number | null
    actual_duration: number | null
    actual_pace: string | null
    avg_hr: number | null
    max_hr: number | null
  } | null
}

type Filter = 'all' | 'today' | 'unread' | 'needs_action' | 'needs_reply'
type ViewMode = 'chronological' | 'urgency'

function needsAction(f: FeedbackWithJoins): boolean {
  return (!f.read && (f.signal === 'red' || f.signal === 'yellow')) || (!f.coach_reply && (f.signal === 'red' || f.signal === 'yellow'))
}

const VALID_FILTERS: Filter[] = ['all', 'today', 'unread', 'needs_action', 'needs_reply']
const PREFS_KEY = 'feedback-view-prefs'

// ── Main component ────────────────────────────────────────────────────────────

export function FeedbackClient({
  feedbacks: initialFeedbacks,
  initialAthleteId = '',
  initialFilter = 'all',
}: {
  feedbacks: FeedbackWithJoins[]
  initialAthleteId?: string
  initialFilter?: string
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

  // Computed: override > persisted > default (SSR-safe: default on server, persisted on client)
  const viewMode: ViewMode = viewModeOverride ?? (hydrated ? (() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY)
      if (stored) {
        const parsed = (JSON.parse(stored) as { viewMode?: string }).viewMode
        if (parsed === 'chronological' || parsed === 'urgency') return parsed
        // Migrate legacy 'grouped' preference
        if (parsed === 'grouped') {
          localStorage.setItem(PREFS_KEY, JSON.stringify({ viewMode: 'chronological' }))
        }
      }
    } catch { /* ignore */ }
    return 'chronological'
  })() : 'chronological')

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
  const legendRef = useRef<HTMLDivElement>(null)
  const closeLegend = useCallback(() => setLegendOpen(false), [])
  useClickOutside(legendRef, closeLegend, legendOpen)
  const { statusMessage, showStatus, clearStatus } = useStatusMessage()

  // Persist view preferences when user explicitly changes them
  useEffect(() => {
    if (viewModeOverride) {
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify({ viewMode }))
      } catch { /* ignore */ }
    }
  }, [viewModeOverride, viewMode])

  useEffect(() => {
    setAthleteFilter(initialAthleteId || 'all')
  }, [initialAthleteId])

  useEffect(() => {
    setFilter(normalizedInitialFilter)
  }, [normalizedInitialFilter])

  useEffect(() => {
    setLocalFeedbacks(initialFeedbacks)
  }, [initialFeedbacks])

  // Unique athletes for dropdown
  const athletes = useMemo(() => {
    const map = new Map<string, { id: string; name: string; avatar: string }>()
    for (const f of localFeedbacks) {
      if (f.athletes && !map.has(f.athletes.id)) {
        map.set(f.athletes.id, f.athletes)
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'pl'))
  }, [localFeedbacks])

  // Filter + sort
  const filtered = useMemo(() => {
    let list = localFeedbacks

    // Search
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(f => {
        const haystack = [f.transcript, f.coach_reply, f.athletes?.name].filter(Boolean).join(' ').toLowerCase()
        return haystack.includes(q)
      })
    }

    // Athlete filter
    if (athleteFilter !== 'all') {
      list = list.filter(f => f.athletes?.id === athleteFilter)
    }

    // Status filter
    if (filter === 'today') list = list.filter(f => f.date === today)
    else if (filter === 'unread') list = list.filter(f => !f.read)
    else if (filter === 'needs_action') list = list.filter(f => needsAction(f))
    else if (filter === 'needs_reply') list = list.filter(f => !f.coach_reply)

    // Sort by urgency if that view mode is active
    if (viewMode === 'urgency') {
      const signalOrder: Record<string, number> = { red: 0, yellow: 1, green: 2 }
      list = [...list].sort((a, b) => (signalOrder[a.signal] ?? 2) - (signalOrder[b.signal] ?? 2))
    }

    return list
  }, [localFeedbacks, athleteFilter, filter, viewMode, today, search])

  const unreadCount = useMemo(() => localFeedbacks.filter(f => !f.read).length, [localFeedbacks])
  const filteredUnreadIds = useMemo(() => filtered.filter(f => !f.read).map(f => f.id), [filtered])

  // Selected feedback object
  const selectedFeedback = useMemo(
    () => filtered.find(f => f.id === selectedId) ?? null,
    [filtered, selectedId],
  )

  // Auto-select first item when filtered list changes and current selection is gone
  useEffect(() => {
    if (filtered.length > 0 && (!selectedId || !filtered.some(f => f.id === selectedId))) {
      setSelectedId(filtered[0].id)
    }
  }, [filtered]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-mark-read when selecting an unread feedback (after short delay)
  useEffect(() => {
    if (!selectedFeedback || selectedFeedback.read) return
    const timeout = setTimeout(() => {
      void handleMarkRead(selectedFeedback.id, selectedFeedback.athletes?.id)
    }, 800)
    return () => clearTimeout(timeout)
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelect(id: string) {
    setSelectedId(id)
    // Reset reply state when switching
    if (replyingId && replyingId !== id) {
      setReplyingId(null)
      setReplyText('')
    }
  }

  async function handleMarkRead(id: string, athleteId?: string) {
    if (markingReadId) return
    const previousFeedbacks = localFeedbacks
    setLocalFeedbacks((current) =>
      current.map((feedback) => (feedback.id === id ? { ...feedback, read: true } : feedback)),
    )
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
    setLocalFeedbacks((current) =>
      current.map((f) => (idSet.has(f.id) ? { ...f, read: true } : f)),
    )
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
      setLocalFeedbacks((current) =>
        current.map((f) => (f.id === id ? { ...f, coach_reply: replyValue, read: true } : f)),
      )
      setReplyingId(null)
      setReplyText('')
      showStatus('success', 'Odpowiedź została zapisana.')
      startTransition(() => router.refresh())
    } finally {
      setSubmitting(false)
    }
  }

  // Filter counts respect athlete filter
  const countBase = athleteFilter !== 'all' ? localFeedbacks.filter(f => f.athletes?.id === athleteFilter) : localFeedbacks

  const filterButtons: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'Wszystkie', count: countBase.length },
    { id: 'needs_action', label: 'Wymaga reakcji', count: countBase.filter(f => needsAction(f)).length },
    { id: 'unread', label: 'Nieprzeczytane', count: countBase.filter(f => !f.read).length },
    { id: 'needs_reply', label: 'Bez odpowiedzi', count: countBase.filter(f => !f.coach_reply).length },
    { id: 'today', label: 'Dziś', count: countBase.filter(f => f.date === today).length },
  ]

  return (
    <div className="sticky top-0 flex h-dvh flex-col overflow-hidden -mb-64">
      <CoachTopbar title="Feedback" subtitle={`${unreadCount} nieprzeczytanych`} />

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
          legendOpen={legendOpen}
          onLegendToggle={() => setLegendOpen(o => !o)}
          legendRef={legendRef}
          statusMessage={statusMessage}
          totalLoaded={initialFeedbacks.length}
        />
      </div>
    </div>
  )
}
