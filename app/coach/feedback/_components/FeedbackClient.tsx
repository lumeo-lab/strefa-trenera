'use client'

import { startTransition, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getBusinessToday } from '@/lib/date'
import { formatDate, hasParsedContent, parseFeedbackTranscript, signalBg, signalColor, timeAgo } from '@/lib/utils'
import { markFeedbackRead, replyFeedback } from '@/lib/actions/feedback'
import { FEELING_LABELS } from '@/lib/constants'
import type { FeedbackRow } from '@/lib/supabase/database.types'
import type { FeedbackSignal } from '@/lib/types'

type FeedbackWithJoins = FeedbackRow & {
  athletes: { id: string; name: string; avatar: string } | null
  training_sessions: { id: string; title: string } | null
}

type Filter = 'all' | 'today' | 'unread' | 'alert'
type SortKey = 'date' | 'signal'
type ViewMode = 'grouped' | 'chronological'

const PAGE_SIZE = 30

// ── Overview stats cards ──────────────────────────────────────────────────────

function OverviewStats({ feedbacks, today }: { feedbacks: FeedbackWithJoins[]; today: string }) {
  const todayCount = feedbacks.filter(f => f.date === today).length
  const unreadCount = feedbacks.filter(f => !f.read).length
  const alertCount = feedbacks.filter(f => f.signal === 'red' || f.signal === 'yellow').length
  const noReplyCount = feedbacks.filter(f => !f.coach_reply && !f.read).length

  const stats = [
    { label: 'Dziś', value: todayCount, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Nieprzeczytane', value: unreadCount, color: '#FF5C1B', bg: 'rgba(255,92,27,0.1)' },
    { label: 'Alerty', value: alertCount, color: '#E74C3C', bg: 'rgba(231,76,60,0.1)' },
    { label: 'Bez odpowiedzi', value: noReplyCount, color: '#F1C40F', bg: 'rgba(241,196,15,0.1)' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map(s => (
        <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg, border: `1px solid ${s.color}20` }}>
          <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// ── Feedback card (reused in both views) ──────────────────────────────────────

function FeedbackCard({
  fb, isExpanded, isReplying, replyText, submitting, showAthleteName,
  onExpand, onReplyStart, onReplyChange, onReplySubmit, onReplyCancel,
}: {
  fb: FeedbackWithJoins
  isExpanded: boolean
  isReplying: boolean
  replyText: string
  submitting: boolean
  showAthleteName: boolean
  onExpand: () => void
  onReplyStart: () => void
  onReplyChange: (text: string) => void
  onReplySubmit: () => void
  onReplyCancel: () => void
}) {
  const athlete = fb.athletes
  const session = fb.training_sessions
  const isVoice = fb.source === 'voice'
  const parsed = !isVoice ? parseFeedbackTranscript(fb.transcript ?? '') : null
  const hasContent = isVoice ? !!fb.ai_analysis : (parsed ? hasParsedContent(parsed) : false)

  return (
    <Card className={`overflow-hidden border-l-4 ${signalColor(fb.signal as FeedbackSignal)} ${!fb.read ? 'ring-1 ring-white/5' : ''}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {showAthleteName && <Avatar initials={athlete?.avatar || '?'} size="sm" />}

          <div className="flex-1 min-w-0">
            {/* Name row */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {showAthleteName && <span className="font-semibold text-sm">{athlete?.name}</span>}
              {!fb.read && <Badge variant="orange">Nowy</Badge>}
              {fb.ai_summary && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${signalBg(fb.signal as FeedbackSignal)}`}>
                  {fb.signal === 'green' ? '🟢' : fb.signal === 'yellow' ? '🟡' : '🔴'} {fb.ai_summary}
                </span>
              )}
              {fb.coach_reply && (
                <span className="text-xs" style={{ color: '#2ECC71' }}>✓ Odpowiedziano</span>
              )}
            </div>
            {/* Meta row */}
            <div className="flex items-center gap-1.5 text-xs flex-wrap" style={{ color: 'var(--text-muted)' }}>
              <span>{isVoice ? '🎤 Głosowy' : fb.source === 'auto' ? '⌚ Zegarek' : '✏️ Tekstowy'}</span>
              {session && <><span>·</span><span>{session.title}</span></>}
              <span>·</span>
              <span>{formatDate(fb.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span>·</span>
              <span>{timeAgo(fb.created_at)}</span>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={onExpand}>
            {isExpanded ? '▲ Zwiń' : '▼ Rozwiń'}
          </Button>
        </div>

        {/* Expanded */}
        {isExpanded && (
          <div className={`mt-4 space-y-4 ${showAthleteName ? 'pl-11' : ''}`}>
            {/* Text feedback — parsed fields */}
            {!isVoice && hasContent && parsed && (
              <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-subtle)' }}>
                {parsed.feeling && (
                  <FeedbackRow label="Samopoczucie">
                    <span>{parsed.feeling}</span>
                    <span className="ml-1" style={{ color: 'var(--text-muted)' }}>{FEELING_LABELS[parsed.feeling] ?? ''}</span>
                  </FeedbackRow>
                )}
                {parsed.trainingType && <FeedbackRow label="Typ treningu">{parsed.trainingType}</FeedbackRow>}
                {parsed.distance && <FeedbackRow label="Dystans">{parsed.distance}</FeedbackRow>}
                {parsed.duration && <FeedbackRow label="Czas">{parsed.duration}</FeedbackRow>}
                {parsed.intensity && <FeedbackRow label="Intensywność">{parsed.intensity}</FeedbackRow>}
                {parsed.notes && (
                  <div className="pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-sm italic" style={{ color: 'var(--text-primary)' }}>&ldquo;{parsed.notes}&rdquo;</p>
                  </div>
                )}
              </div>
            )}

            {/* Voice transcript */}
            {isVoice && fb.ai_analysis && (
              <div className="rounded-xl p-3" style={{ background: 'var(--bg-subtle)' }}>
                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>🎤 Nagranie głosowe</div>
                <p className="text-sm italic">&ldquo;{fb.ai_analysis}&rdquo;</p>
              </div>
            )}

            {/* Watch link */}
            {fb.watch_link && (
              <a
                href={fb.watch_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl transition-opacity hover:opacity-80"
                style={{ background: 'rgba(255,92,27,0.08)', color: '#FF5C1B', border: '1px solid rgba(255,92,27,0.2)' }}
              >
                ⌚ <span className="underline truncate">{fb.watch_link}</span>
                <span className="shrink-0 ml-auto text-xs opacity-70">↗</span>
              </a>
            )}

            {/* Watch sensor data */}
            {fb.watch_data && !!(fb.watch_data.avgHR || fb.watch_data.maxHR || fb.watch_data.distance) && (
              <div className="grid grid-cols-3 gap-2">
                {([
                  fb.watch_data.avgHR ? ['Tętno śr.', `${fb.watch_data.avgHR} bpm`] : null,
                  fb.watch_data.maxHR ? ['Tętno max', `${fb.watch_data.maxHR} bpm`] : null,
                  fb.watch_data.distance ? ['Dystans', `${fb.watch_data.distance} km`] : null,
                ] as Array<[string, string] | null>)
                  .filter((x): x is [string, string] => x !== null)
                  .map(([k, v]) => (
                    <div key={k} className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
                      <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{k}</div>
                      <div className="text-sm font-semibold">{v}</div>
                    </div>
                  ))}
              </div>
            )}

            {/* Coach reply (read-only) */}
            {fb.coach_reply && !isReplying && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.2)' }}>
                <div className="text-xs font-semibold mb-1.5" style={{ color: '#2ECC71' }}>Twoja odpowiedź</div>
                <p className="text-sm">{fb.coach_reply}</p>
              </div>
            )}

            {/* Reply form */}
            {isReplying ? (
              <div className="space-y-2">
                <textarea
                  value={replyText}
                  onChange={e => onReplyChange(e.target.value)}
                  placeholder="Napisz odpowiedź do zawodnika..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={onReplySubmit} disabled={!replyText || submitting}>
                    {submitting ? 'Wysyłanie...' : 'Wyślij'}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={onReplyCancel}>Anuluj</Button>
                </div>
              </div>
            ) : (
              <Button variant="secondary" size="sm" onClick={onReplyStart}>
                {fb.coach_reply ? '✏️ Edytuj odpowiedź' : '💬 Odpowiedz'}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

function FeedbackRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <span className="w-28 shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span>{children}</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function FeedbackClient({ feedbacks: initialFeedbacks }: { feedbacks: FeedbackWithJoins[] }) {
  const router = useRouter()
  const today = getBusinessToday()
  const [filter, setFilter] = useState<Filter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [viewMode, setViewMode] = useState<ViewMode>('grouped')
  const [athleteFilter, setAthleteFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

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
    else if (filter === 'alert') list = list.filter(f => f.signal === 'red' || f.signal === 'yellow')

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
    // Sort groups: unread/alert first, then by most recent feedback
    return Array.from(map.values()).sort((a, b) => {
      if (a.hasUnread !== b.hasUnread) return a.hasUnread ? -1 : 1
      if (a.hasAlert !== b.hasAlert) return a.hasAlert ? -1 : 1
      return 0
    })
  }, [filtered])

  const unreadCount = initialFeedbacks.filter(f => !f.read).length

  async function handleExpand(id: string, isRead: boolean) {
    setExpandedId(prev => prev === id ? null : id)
    if (!isRead) {
      await markFeedbackRead(id)
      startTransition(() => router.refresh())
    }
  }

  async function handleReply(id: string, athleteId: string) {
    if (!replyText.trim() || submitting) return
    setSubmitting(true)
    const fd = new FormData()
    fd.set('id', id)
    fd.set('athlete_id', athleteId)
    fd.set('reply', replyText)
    await replyFeedback(null, fd)
    setReplyingId(null)
    setReplyText('')
    setSubmitting(false)
    startTransition(() => router.refresh())
  }

  const filterButtons: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'Wszystkie', count: initialFeedbacks.length },
    { id: 'today', label: 'Dziś', count: initialFeedbacks.filter(f => f.date === today).length },
    { id: 'unread', label: 'Nieprzeczytane', count: unreadCount },
    { id: 'alert', label: 'Alert', count: initialFeedbacks.filter(f => f.signal !== 'green').length },
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
        showAthleteName={showAthleteName}
        onExpand={() => handleExpand(fb.id, fb.read)}
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

        {/* Toolbar: filters + view mode + sort + athlete dropdown */}
        <div className="space-y-3 mb-6">
          {/* Row 1: Quick filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {filterButtons.map(f => (
              <button key={f.id} onClick={() => { setFilter(f.id); setVisibleCount(PAGE_SIZE) }}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
                style={{
                  background: filter === f.id ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)',
                  color: filter === f.id ? '#FF5C1B' : 'var(--text-muted)',
                  border: filter === f.id ? '1px solid rgba(255,92,27,0.3)' : '1px solid var(--border)',
                }}>
                {f.label}
                <span className="ml-2 text-xs opacity-70">{f.count}</span>
              </button>
            ))}
          </div>

          {/* Row 2: Athlete filter + sort + view toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Athlete dropdown */}
            <select
              value={athleteFilter}
              onChange={e => { setAthleteFilter(e.target.value); setVisibleCount(PAGE_SIZE) }}
              className="px-3 py-2 rounded-xl text-sm cursor-pointer"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="all">Wszyscy zawodnicy ({athletes.length})</option>
              {athletes.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
              className="px-3 py-2 rounded-xl text-sm cursor-pointer"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="date">Sortuj: najnowsze</option>
              <option value="signal">Sortuj: alerty najpierw</option>
            </select>

            {/* View mode toggle */}
            <div className="flex rounded-xl overflow-hidden ml-auto" style={{ border: '1px solid var(--border)' }}>
              <button
                onClick={() => setViewMode('grouped')}
                className="px-3 py-2 text-sm cursor-pointer transition-all"
                style={{
                  background: viewMode === 'grouped' ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)',
                  color: viewMode === 'grouped' ? '#FF5C1B' : 'var(--text-muted)',
                }}
              >
                Grupowane
              </button>
              <button
                onClick={() => setViewMode('chronological')}
                className="px-3 py-2 text-sm cursor-pointer transition-all"
                style={{
                  background: viewMode === 'chronological' ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)',
                  color: viewMode === 'chronological' ? '#FF5C1B' : 'var(--text-muted)',
                  borderLeft: '1px solid var(--border)',
                }}
              >
                Chronologiczne
              </button>
            </div>
          </div>
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
                      {group.feedbacks.length} {group.feedbacks.length === 1 ? 'feedback' : 'feedbacków'}
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
