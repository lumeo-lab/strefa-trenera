'use client'

import { startTransition, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { FeedbackCard } from '@/components/coach/FeedbackCard'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { getBusinessToday } from '@/lib/date'
import { plural } from '@/lib/utils'
import { markFeedbackRead, replyFeedback } from '@/lib/actions/feedback'
import type { FeedbackRow } from '@/lib/supabase/database.types'

type FeedbackWithJoins = FeedbackRow & {
  athletes: { id: string; name: string; avatar: string } | null
  training_sessions: { id: string; title: string } | null
}

type Filter = 'all' | 'today' | 'unread' | 'needs_reply' | 'warning' | 'alarm'
type SortKey = 'date' | 'signal'
type ViewMode = 'grouped' | 'chronological'

const PAGE_SIZE = 30

// ── Overview stats cards ──────────────────────────────────────────────────────

function OverviewStats({ feedbacks, today }: { feedbacks: FeedbackWithJoins[]; today: string }) {
  const todayCount = feedbacks.filter(f => f.date === today).length
  const unreadCount = feedbacks.filter(f => !f.read).length
  const noReplyCount = feedbacks.filter(f => !f.coach_reply).length

  const stats = [
    { label: 'Dziś', value: todayCount, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Nieprzeczytane', value: unreadCount, color: '#FF5C1B', bg: 'rgba(255,92,27,0.1)' },
    { label: 'Bez odpowiedzi', value: noReplyCount, color: '#F1C40F', bg: 'rgba(241,196,15,0.1)' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {stats.map(s => (
        <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg, border: `1px solid ${s.color}20` }}>
          <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function FeedbackClient({ feedbacks: initialFeedbacks }: { feedbacks: FeedbackWithJoins[] }) {
  const router = useRouter()
  const today = getBusinessToday()
  const [filter, setFilter] = useState<Filter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [viewMode, setViewMode] = useState<ViewMode>('chronological')
  const [athleteFilter, setAthleteFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [markingReadId, setMarkingReadId] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [statusMessage, setStatusMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  // Unique athletes for dropdown
  const athletes = useMemo(() => {
    const map = new Map<string, { id: string; name: string; avatar: string }>()
    for (const f of initialFeedbacks) {
      if (f.athletes && !map.has(f.athletes.id)) {
        map.set(f.athletes.id, f.athletes)
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'pl'))
  }, [initialFeedbacks])

  // Filter
  const filtered = useMemo(() => {
    let list = initialFeedbacks

    // Athlete filter
    if (athleteFilter !== 'all') {
      list = list.filter(f => f.athletes?.id === athleteFilter)
    }

    // Status filter
    if (filter === 'today') list = list.filter(f => f.date === today)
    else if (filter === 'unread') list = list.filter(f => !f.read)
    else if (filter === 'needs_reply') list = list.filter(f => !f.coach_reply)
    else if (filter === 'warning') list = list.filter(f => f.signal === 'yellow')
    else if (filter === 'alarm') list = list.filter(f => f.signal === 'red')

    // Sort
    if (sortKey === 'signal') {
      const signalOrder: Record<string, number> = { red: 0, yellow: 1, green: 2 }
      list = [...list].sort((a, b) => (signalOrder[a.signal] ?? 2) - (signalOrder[b.signal] ?? 2))
    }
    // 'date' is default from server (created_at DESC)

    return list
  }, [initialFeedbacks, athleteFilter, filter, sortKey, today])

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

  const unreadCount = useMemo(() => initialFeedbacks.filter(f => !f.read).length, [initialFeedbacks])

  async function handleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  async function handleMarkRead(id: string, athleteId?: string) {
    if (markingReadId) return
    setMarkingReadId(id)
    setStatusMessage(null)
    try {
      const result = await markFeedbackRead(id, athleteId)
      if (result && 'error' in result) {
        setStatusMessage({ tone: 'error', text: `Nie udało się oznaczyć feedbacku jako przeczytany: ${result.error}` })
        return
      }
      setStatusMessage({ tone: 'success', text: 'Feedback został oznaczony jako przeczytany.' })
      startTransition(() => router.refresh())
    } finally {
      setMarkingReadId(null)
    }
  }

  async function handleReply(id: string, athleteId: string) {
    if (!replyText.trim() || submitting) return
    setSubmitting(true)
    setStatusMessage(null)
    const fd = new FormData()
    fd.set('id', id)
    fd.set('athlete_id', athleteId)
    fd.set('reply', replyText)
    try {
      const result = await replyFeedback(null, fd)
      if (result && 'error' in result) {
        setStatusMessage({ tone: 'error', text: `Nie udało się zapisać odpowiedzi: ${result.error}` })
        return
      }
      setReplyingId(null)
      setReplyText('')
      setStatusMessage({ tone: 'success', text: 'Odpowiedź została zapisana.' })
      startTransition(() => router.refresh())
    } finally {
      setSubmitting(false)
    }
  }

  const filterButtons: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'Wszystkie', count: initialFeedbacks.length },
    { id: 'today', label: 'Dziś', count: initialFeedbacks.filter(f => f.date === today).length },
    { id: 'unread', label: 'Nieprzeczytane', count: unreadCount },
    { id: 'needs_reply', label: 'Bez odpowiedzi', count: initialFeedbacks.filter(f => !f.coach_reply).length },
    { id: 'warning', label: 'Średnie samopoczucie', count: initialFeedbacks.filter(f => f.signal === 'yellow').length },
    { id: 'alarm', label: 'Słabe samopoczucie', count: initialFeedbacks.filter(f => f.signal === 'red').length },
  ]

  // Paginated list for chronological view
  const paginatedFiltered = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

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
        {/* Overview stats */}
        <OverviewStats feedbacks={initialFeedbacks} today={today} />

        {statusMessage && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm"
            style={{
              background: statusMessage.tone === 'success' ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)',
              border: `1px solid ${statusMessage.tone === 'success' ? 'rgba(46,204,113,0.25)' : 'rgba(231,76,60,0.25)'}`,
              color: statusMessage.tone === 'success' ? '#2ECC71' : '#E74C3C',
            }}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Toolbar: filters + view mode + sort + athlete dropdown */}
        <div className="mb-6 rounded-2xl p-3 sm:p-4 overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 min-w-max whitespace-nowrap">
            <select
              value={filter}
              onChange={e => { setFilter(e.target.value as Filter); setVisibleCount(PAGE_SIZE) }}
              className="px-3 py-2 rounded-xl text-sm cursor-pointer whitespace-nowrap"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              {filterButtons.map(f => (
                <option key={f.id} value={f.id}>
                  {f.label} ({f.count})
                </option>
              ))}
            </select>

            <select
              value={athleteFilter}
              onChange={e => { setAthleteFilter(e.target.value); setVisibleCount(PAGE_SIZE) }}
              className="px-3 py-2 rounded-xl text-sm cursor-pointer whitespace-nowrap"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="all">Wszyscy zawodnicy ({athletes.length})</option>
              {athletes.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>

            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
              className="px-3 py-2 rounded-xl text-sm cursor-pointer whitespace-nowrap"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="date">Najnowsze najpierw</option>
              <option value="signal">Najważniejsze najpierw</option>
            </select>

            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <button
                onClick={() => setViewMode('grouped')}
                className="px-3 py-2 text-sm cursor-pointer transition-all whitespace-nowrap"
                style={{
                  background: viewMode === 'grouped' ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)',
                  color: viewMode === 'grouped' ? '#FF5C1B' : 'var(--text-muted)',
                }}
              >
                Grupuj po zawodniku
              </button>
              <button
                onClick={() => setViewMode('chronological')}
                className="px-3 py-2 text-sm cursor-pointer transition-all whitespace-nowrap"
                style={{
                  background: viewMode === 'chronological' ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)',
                  color: viewMode === 'chronological' ? '#FF5C1B' : 'var(--text-muted)',
                  borderLeft: '1px solid var(--border)',
                }}
              >
                Pokaż po kolei
              </button>
            </div>
          </div>
        </div>

        {/* Hint */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-xs"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: 'var(--text-muted)' }}>
          <span style={{ fontSize: '14px' }}>💡</span>
          Feedbacki poszczególnych zawodników znajdziesz też w profilu zawodnika → zakładka „Feedback”
        </div>

        {/* Feed */}
        {filtered.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            Brak feedbacków w tej kategorii
          </div>
        ) : viewMode === 'grouped' ? (
          /* ── Grouped view ── */
          <div className="space-y-6">
            {grouped.map(group => (
              <div key={group.athlete.id}>
                {/* Group header */}
                <div className="flex items-center gap-3 mb-3">
                  <Avatar initials={group.athlete.avatar || '?'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm">{group.athlete.name}</span>
                    <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                      {group.feedbacks.length} {plural(group.feedbacks.length, 'feedback', 'feedbacki', 'feedbacków')}
                    </span>
                  </div>
                  {group.hasUnread && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,92,27,0.15)', color: '#FF5C1B' }}>
                      {group.feedbacks.filter(f => !f.read).length} nowych
                    </span>
                  )}
                  {group.hasAlert && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>
                      Alert
                    </span>
                  )}
                </div>
                {/* Group feedbacks */}
                <div className="space-y-2 pl-2">
                  {group.feedbacks.map(fb => renderCardForFb(fb, false))}
                </div>
              </div>
            ))}
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
      </div>
    </div>
  )
}
