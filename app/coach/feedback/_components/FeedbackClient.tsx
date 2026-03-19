'use client'

import { startTransition, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { FeedbackCard } from '@/components/coach/FeedbackCard'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusMessage } from '@/components/ui/StatusMessage'
import { useStatusMessage } from '@/lib/hooks/useStatusMessage'
import { getBusinessToday } from '@/lib/date'
import { useClickOutside } from '@/lib/hooks/useClickOutside'
import { plural } from '@/lib/utils'
import { markFeedbackRead, markFeedbacksReadBulk, replyFeedback } from '@/lib/actions/feedback'
import { FeedbackToolbar } from '@/app/coach/feedback/_components/FeedbackToolbar'
import type { FeedbackRow } from '@/lib/supabase/database.types'

type FeedbackWithJoins = FeedbackRow & {
  athletes: { id: string; name: string; avatar: string } | null
  training_sessions: { id: string; title: string } | null
}

type Filter = 'all' | 'today' | 'unread' | 'needs_action' | 'needs_reply'
type ViewMode = 'grouped' | 'chronological' | 'urgency'

function needsAction(f: FeedbackWithJoins): boolean {
  return (!f.read && (f.signal === 'red' || f.signal === 'yellow')) || (!f.coach_reply && (f.signal === 'red' || f.signal === 'yellow'))
}

const VALID_FILTERS: Filter[] = ['all', 'today', 'unread', 'needs_action', 'needs_reply']
const PAGE_SIZE = 30
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
      if (stored) return (JSON.parse(stored) as { viewMode?: ViewMode }).viewMode ?? 'chronological'
    } catch { /* ignore */ }
    return 'chronological'
  })() : 'chronological')
  const [athleteFilter, setAthleteFilter] = useState<string>(initialAthleteId || 'all')
  const [localFeedbacks, setLocalFeedbacks] = useState<FeedbackWithJoins[]>(initialFeedbacks)
  const [expandedId, setExpandedId] = useState<string | null>(urlHighlight)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [markingReadId, setMarkingReadId] = useState<string | null>(null)
  const [bulkMarking, setBulkMarking] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [legendOpen, setLegendOpen] = useState(false)
  const legendRef = useRef<HTMLDivElement>(null)
  const closeLegend = useCallback(() => setLegendOpen(false), [])
  useClickOutside(legendRef, closeLegend, legendOpen)
  const { statusMessage, showStatus, clearStatus } = useStatusMessage()
  const [hintDismissed, setHintDismissed] = useState(() => {
    if (typeof window === 'undefined') return true
    return !!localStorage.getItem('feedback-hint-dismissed')
  })

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

  // Filter
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
    // 'chronological' uses default from server (created_at DESC)

    return list
  }, [localFeedbacks, athleteFilter, filter, viewMode, today, search])

  // Grouped by athlete
  const grouped = useMemo(() => {
    const map = new Map<string, { athlete: { id: string; name: string; avatar: string }; feedbacks: FeedbackWithJoins[]; hasUnread: boolean; hasAlert: boolean }>()
    for (const f of filtered) {
      const key = f.athletes?.id ?? 'unknown'
      if (!map.has(key)) {
        map.set(key, {
          athlete: f.athletes ?? { id: 'unknown', name: 'Nieznany', avatar: '?' },
          feedbacks: [],
          hasUnread: false,
          hasAlert: false,
        })
      }
      const group = map.get(key)!
      group.feedbacks.push(f)
      if (!f.read) group.hasUnread = true
      if (f.signal === 'red' || f.signal === 'yellow') group.hasAlert = true
    }
    // Sort groups: unread first, then alerts, then by most recent feedback
    return Array.from(map.values()).sort((a, b) => {
      if (a.hasUnread !== b.hasUnread) return a.hasUnread ? -1 : 1
      if (a.hasAlert !== b.hasAlert) return a.hasAlert ? -1 : 1
      const latestA = a.feedbacks[0]?.created_at ?? ''
      const latestB = b.feedbacks[0]?.created_at ?? ''
      return latestB.localeCompare(latestA)
    })
  }, [filtered])

  const unreadCount = useMemo(() => localFeedbacks.filter(f => !f.read).length, [localFeedbacks])

  // Count of unread in currently filtered/visible list
  const filteredUnreadIds = useMemo(() => filtered.filter(f => !f.read).map(f => f.id), [filtered])

  async function handleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
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
      showStatus('success', 'Feedback został oznaczony jako przeczytany.')
      startTransition(() => router.refresh())
    } finally {
      setMarkingReadId(null)
    }
  }

  async function handleBulkMarkRead(ids: string[]) {
    if (bulkMarking || ids.length === 0) return
    const previousFeedbacks = localFeedbacks
    // Optimistic update
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
      // Optimistic update for reply
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

  // Paginated list for chronological view
  const paginatedFiltered = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  function dismissHint() {
    setHintDismissed(true)
    localStorage.setItem('feedback-hint-dismissed', '1')
  }

  function toggleGroup(athleteId: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(athleteId)) next.delete(athleteId)
      else next.add(athleteId)
      return next
    })
  }

  function renderCardForFb(fb: FeedbackWithJoins, showAthleteName: boolean) {
    return (
      <FeedbackCard
        key={fb.id}
        fb={fb}
        isExpanded={expandedId === fb.id}
        isReplying={replyingId === fb.id}
        replyText={replyingId === fb.id ? replyText : ''}
        submitting={submitting}
        markingRead={markingReadId === fb.id}
        showAthleteName={showAthleteName}
        onExpand={() => handleExpand(fb.id)}
        onMarkRead={() => handleMarkRead(fb.id, fb.athletes?.id)}
        onReplyStart={() => { setReplyingId(fb.id); setReplyText(fb.coach_reply ?? '') }}
        onReplyChange={setReplyText}
        onReplySubmit={() => handleReply(fb.id, fb.athletes?.id ?? '')}
        onReplyCancel={() => setReplyingId(null)}
      />
    )
  }

  return (
    <div>
      <CoachTopbar title="Feedback" subtitle={`${unreadCount} nieprzeczytanych`} />

      <div className="p-6 max-w-4xl mx-auto">
        {statusMessage && (
          <StatusMessage tone={statusMessage.tone} text={statusMessage.text} className="mb-4" />
        )}

        {/* Toolbar */}
        <FeedbackToolbar
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={(value) => { setFilter(value); setVisibleCount(PAGE_SIZE) }}
          athleteFilter={athleteFilter}
          onAthleteFilterChange={(value) => { setAthleteFilter(value); setVisibleCount(PAGE_SIZE) }}
          viewMode={viewMode}
          onViewModeChange={setViewModeOverride}
          athletes={athletes}
          filterButtons={filterButtons}
          filteredCount={filtered.length}
          legendOpen={legendOpen}
          setLegendOpen={setLegendOpen}
          legendRef={legendRef}
        />

        {/* Bulk action bar */}
        {filteredUnreadIds.length > 0 && (
          <div className="flex items-center gap-3 mb-4 px-4 py-2.5 rounded-2xl text-sm"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {filteredUnreadIds.length} {plural(filteredUnreadIds.length, 'nieprzeczytany', 'nieprzeczytane', 'nieprzeczytanych')} w widoku
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleBulkMarkRead(filteredUnreadIds)}
              disabled={bulkMarking}
            >
              {bulkMarking ? 'Oznaczanie...' : 'Oznacz widoczne jako przeczytane'}
            </Button>
          </div>
        )}

        {!hintDismissed && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm mb-4"
            style={{ background: 'rgba(255,92,27,0.08)', border: '1px solid rgba(255,92,27,0.2)' }}>
            <span className="text-lg shrink-0">💡</span>
            <span style={{ color: 'var(--text-primary)' }}>
              Feedbacki poszczególnych zawodników znajdziesz też w profilu zawodnika, w zakładce <span className="font-semibold" style={{ color: '#FF5C1B' }}>Feedback</span>.
            </span>
            <button
              onClick={dismissHint}
              className="shrink-0 text-lg leading-none cursor-pointer hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}
            >×</button>
          </div>
        )}

        {/* Feed */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="📥"
            title="Brak feedbacków w tej kategorii"
            description="Zmień filtry lub wybierz innego zawodnika, aby zobaczyć więcej wpisów."
          />
        ) : viewMode === 'grouped' ? (
          /* ── Grouped view ── */
          <div className="space-y-2">
            {grouped.map((group, gi) => {
              const isCollapsed = collapsedGroups.has(group.athlete.id)
              const groupUnreadIds = group.feedbacks.filter(f => !f.read).map(f => f.id)
              return (
                <div key={group.athlete.id}>
                  {gi > 0 && <div className="border-t my-4" style={{ borderColor: 'var(--border)' }} />}
                  {/* Group header with summary */}
                  <div
                    className="flex items-center gap-3 mb-3 cursor-pointer rounded-xl px-2 py-1.5 -mx-2 transition-colors hover:bg-[var(--bg-hover)]"
                    onClick={() => toggleGroup(group.athlete.id)}
                  >
                    <Avatar initials={group.athlete.avatar || '?'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm">{group.athlete.name}</span>
                      <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span>{group.feedbacks.length} {plural(group.feedbacks.length, 'feedback', 'feedbacki', 'feedbacków')}</span>
                        {group.hasUnread && <span>· {group.feedbacks.filter(f => !f.read).length} nowych</span>}
                        {group.hasAlert && <span>· {group.feedbacks.some(f => f.signal === 'red') ? 'sygnał czerwony' : 'sygnał żółty'}</span>}
                        {group.feedbacks.some(f => !f.coach_reply) && <span>· brak odpowiedzi</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {groupUnreadIds.length > 0 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleBulkMarkRead(groupUnreadIds) }}
                          disabled={bulkMarking}
                        >
                          Przeczytane ({groupUnreadIds.length})
                        </Button>
                      )}
                      {group.hasUnread && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(255,92,27,0.15)', color: '#FF5C1B' }}>
                          {group.feedbacks.filter(f => !f.read).length} nowych
                        </span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{isCollapsed ? '▶' : '▼'}</span>
                    </div>
                  </div>
                  {/* Group feedbacks */}
                  {!isCollapsed && (
                    <div className="space-y-2 pl-2">
                      {group.feedbacks.map(fb => renderCardForFb(fb, false))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          /* ── Chronological view ── */
          <div className="space-y-3">
            {paginatedFiltered.map(fb => renderCardForFb(fb, true))}
            {hasMore && (
              <div className="text-center pt-4">
                <Button variant="secondary" onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}>
                  Pokaż więcej ({filtered.length - visibleCount} pozostało)
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Limit 200 info */}
        {initialFeedbacks.length >= 200 && (
          <div className="mt-6 text-center text-xs py-3 rounded-xl" style={{ color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}>
            Wyświetlasz ostatnie 200 feedbacków. Starsze wpisy nie są widoczne.
          </div>
        )}
      </div>
    </div>
  )
}
