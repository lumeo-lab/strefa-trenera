'use client'

import { useState, useEffect } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, sessionTypeLabel, intensityColor } from '@/lib/utils'
import Link from 'next/link'

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `${min} min temu`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} godz. temu`
  return `${Math.floor(h / 24)} dni temu`
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one
  if (n >= 2 && n <= 4) return few
  return many
}

const SIGNAL_COLOR: Record<string, string> = { green: '#2ECC71', yellow: '#F1C40F', red: '#E74C3C' }

const ATHLETE_STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  alert:   { label: 'Alert',  color: '#E74C3C', bg: 'rgba(231,76,60,0.1)' },
  warning: { label: 'Uwaga',  color: '#F39C12', bg: 'rgba(243,156,18,0.1)' },
}

const INVOICE_STATUS_INFO: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Oczekuje', color: '#F1C40F' },
  paid:      { label: 'Opłacona', color: '#2ECC71' },
  overdue:   { label: 'Zaległa',  color: '#E74C3C' },
  cancelled: { label: 'Anulowana', color: '#8A92A8' },
}

// ── Prefs types & constants ───────────────────────────────────────────────────

const STORAGE_KEY = 'dashboard-prefs-v1'

type KpiId = 'athletes' | 'feedback' | 'revenue' | 'payments'
type SectionId =
  | 'week_summary' | 'today_plan' | 'messages' | 'alerts' | 'no_sessions_week'
  | 'feedback_list' | 'upcoming_races' | 'recent_athletes' | 'recent_invoices'

type Prefs = {
  kpi: { id: KpiId; visible: boolean }[]
  sections: { id: SectionId; visible: boolean }[]
}

const DEFAULT_PREFS: Prefs = {
  kpi: [
    { id: 'athletes', visible: true },
    { id: 'feedback', visible: true },
    { id: 'revenue', visible: true },
    { id: 'payments', visible: true },
  ],
  sections: [
    { id: 'week_summary', visible: true },
    { id: 'today_plan', visible: true },
    { id: 'messages', visible: true },
    { id: 'alerts', visible: true },
    { id: 'no_sessions_week', visible: false },
    { id: 'feedback_list', visible: true },
    { id: 'upcoming_races', visible: true },
    { id: 'recent_athletes', visible: false },
    { id: 'recent_invoices', visible: false },
  ],
}

const SECTION_COL: Record<SectionId, 'full' | 'left' | 'right'> = {
  week_summary: 'full',
  today_plan: 'left', messages: 'left', alerts: 'left', no_sessions_week: 'left',
  feedback_list: 'right', upcoming_races: 'right', recent_athletes: 'right', recent_invoices: 'right',
}

const KPI_META: Record<KpiId, { label: string; icon: string }> = {
  athletes: { label: 'Aktywni zawodnicy',      icon: '👟' },
  feedback: { label: 'Nieprzeczytany feedback', icon: '📥' },
  revenue:  { label: 'Przychód miesięczny',     icon: '💰' },
  payments: { label: 'Oczekujące płatności',    icon: '💳' },
}

const SECTION_META: Record<SectionId, { label: string; icon: string; desc: string }> = {
  week_summary:     { label: 'Podsumowanie tygodnia',     icon: '📊', desc: 'Pasek postępu bieżącego tygodnia' },
  today_plan:       { label: 'Dziś w planie',             icon: '📅', desc: 'Sesje zaplanowane na dziś' },
  messages:         { label: 'Ostatnie wiadomości',       icon: '💬', desc: 'Wiadomości od zawodników' },
  alerts:           { label: 'Wymagają uwagi',            icon: '⚠️', desc: 'Zawodnicy z alertem lub ostrzeżeniem' },
  no_sessions_week: { label: 'Bez planu w tygodniu',      icon: '🔴', desc: 'Zawodnicy bez sesji w tym tygodniu' },
  feedback_list:    { label: 'Nieprzeczytany feedback',   icon: '📥', desc: 'Lista nieprzeczytanych feedbacków' },
  upcoming_races:   { label: 'Nadchodzące zawody',        icon: '🏁', desc: 'Starty w ciągu 14 dni' },
  recent_athletes:  { label: 'Ostatnio dodani zawodnicy', icon: '👤', desc: 'Nowi zawodnicy w systemie' },
  recent_invoices:  { label: 'Ostatnie faktury',          icon: '🧾', desc: 'Ostatnio wystawione faktury' },
}

// ── mergeWithDefaults ─────────────────────────────────────────────────────────

function mergeWithDefaults(saved: Partial<Prefs>): Prefs {
  function merge<T extends { id: string }>(savedArr: T[] | undefined, defaults: T[]): T[] {
    const s = (savedArr ?? []).filter(x => defaults.some(d => d.id === x.id))
    const ids = new Set(s.map(x => x.id))
    return [...s, ...defaults.filter(d => !ids.has(d.id))]
  }
  return { kpi: merge(saved.kpi, DEFAULT_PREFS.kpi), sections: merge(saved.sections, DEFAULT_PREFS.sections) }
}

// ── SettingsRow ───────────────────────────────────────────────────────────────

function SettingsRow({ icon, label, desc, visible, onToggle, onUp, onDown, canUp, canDown }: {
  icon: string; label: string; desc: string; visible: boolean
  onToggle: () => void; onUp: () => void; onDown: () => void
  canUp: boolean; canDown: boolean
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl transition-colors"
      style={{ background: visible ? 'var(--bg-elevated)' : 'transparent' }}>
      <div className="flex flex-col gap-0.5 shrink-0">
        <button onClick={onUp} disabled={!canUp}
          className="text-xs cursor-pointer disabled:opacity-20 hover:opacity-70 leading-none px-1 py-0.5">▲</button>
        <button onClick={onDown} disabled={!canDown}
          className="text-xs cursor-pointer disabled:opacity-20 hover:opacity-70 leading-none px-1 py-0.5">▼</button>
      </div>
      <span className="text-base shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {desc && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</div>}
      </div>
      <button onClick={onToggle}
        className="relative w-10 h-6 rounded-full transition-colors shrink-0"
        style={{ background: visible ? '#FF5C1B' : 'var(--bg-raised)' }}>
        <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
          style={{ left: visible ? 'calc(100% - 22px)' : '2px' }} />
      </button>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  coachName: string
  todayLabel: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allAthletes: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feedbacks: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sessions: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  weekSessions: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  races: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentInvoices: any[]
  totalUnread: number
  mrr: number
  activeCount: number
  pendingAmount: number
  overdueAmount: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  alertAthletes: any[]
  weekStats: { total: number; completed: number; km: number; rate: number }
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardClient({
  coachName, todayLabel, allAthletes, feedbacks, messages, sessions,
  weekSessions, races, recentInvoices, totalUnread, mrr, activeCount,
  pendingAmount, overdueAmount, alertAthletes, weekStats,
}: Props) {

  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [hintDismissed, setHintDismissed] = useState(true) // start hidden, update after mount

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY)
      if (s) setPrefs(mergeWithDefaults(JSON.parse(s)))
      // Show hint only if user has never interacted with dashboard settings
      setHintDismissed(!!localStorage.getItem('dashboard-hint-dismissed'))
    } catch { /* ignore */ }
  }, [])

  function savePrefs(next: Prefs) {
    setPrefs(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function toggleKpi(id: KpiId) {
    savePrefs({ ...prefs, kpi: prefs.kpi.map(k => k.id === id ? { ...k, visible: !k.visible } : k) })
  }
  function toggleSection(id: SectionId) {
    savePrefs({ ...prefs, sections: prefs.sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s) })
  }
  function moveKpi(id: KpiId, dir: -1 | 1) {
    const arr = [...prefs.kpi]
    const idx = arr.findIndex(k => k.id === id)
    const ti = idx + dir
    if (ti < 0 || ti >= arr.length) return
    ;[arr[idx], arr[ti]] = [arr[ti], arr[idx]]
    savePrefs({ ...prefs, kpi: arr })
  }
  function moveSection(id: SectionId, dir: -1 | 1) {
    const col = SECTION_COL[id]
    const arr = [...prefs.sections]
    const colItems = arr.map((s, i) => ({ ...s, i })).filter(s => SECTION_COL[s.id] === col)
    const ci = colItems.findIndex(s => s.id === id)
    const ti = ci + dir
    if (ti < 0 || ti >= colItems.length) return
    ;[arr[colItems[ci].i], arr[colItems[ti].i]] = [arr[colItems[ti].i], arr[colItems[ci].i]]
    savePrefs({ ...prefs, sections: arr })
  }

  // Derived
  const visibleKpi = prefs.kpi.filter(k => k.visible)
  const visibleSections = prefs.sections.filter(s => s.visible)
  const fullSections = visibleSections.filter(s => SECTION_COL[s.id] === 'full')
  const leftSections = visibleSections.filter(s => SECTION_COL[s.id] === 'left')
  const rightSections = visibleSections.filter(s => SECTION_COL[s.id] === 'right')

  const weekAthleteIds = new Set(weekSessions.map((s: { athlete_id?: string }) => s.athlete_id).filter(Boolean))
  const noSessionsAthletes = allAthletes.filter(a => a.status !== 'inactive' && !weekAthleteIds.has(a.id))
  const todayCompleted = sessions.filter((s: { completed: boolean }) => s.completed).length

  // ── Section renderers ─────────────────────────────────────────────────────

  function renderKpi(id: KpiId) {
    switch (id) {
      case 'athletes': return (
        <Link href="/coach/athletes">
          <Card className="p-5 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">👟</span>
              {alertAthletes.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>
                  {alertAthletes.length} {plural(alertAthletes.length, 'alert', 'alerty', 'alertów')}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold mb-1">{activeCount}</div>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Aktywni zawodnicy</div>
            <div className="text-xs font-medium" style={{ color: '#2ECC71' }}>{allAthletes.length} łącznie</div>
          </Card>
        </Link>
      )
      case 'feedback': return (
        <Link href="/coach/feedback">
          <Card className="p-5 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="mb-3 text-2xl">📥</div>
            <div className="text-2xl font-bold mb-1">{totalUnread}</div>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Nieprzeczytany feedback</div>
            <div className="text-xs font-medium" style={{ color: totalUnread > 0 ? '#F1C40F' : '#2ECC71' }}>
              {totalUnread > 0 ? 'Wymaga uwagi' : 'Wszystko odczytane'}
            </div>
          </Card>
        </Link>
      )
      case 'revenue': return (
        <Link href="/coach/analytics">
          <Card className="p-5 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="mb-3 text-2xl">💰</div>
            <div className="text-2xl font-bold mb-1">{formatCurrency(mrr)}</div>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Przychód miesięczny</div>
            <div className="text-xs font-medium" style={{ color: '#FF5C1B' }}>{activeCount} × pakiet</div>
          </Card>
        </Link>
      )
      case 'payments': return (
        <Link href="/coach/invoices">
          <Card className="p-5 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">💳</span>
              {overdueAmount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>Zaległość</span>
              )}
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: overdueAmount > 0 ? '#E74C3C' : 'inherit' }}>
              {formatCurrency(pendingAmount + overdueAmount)}
            </div>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Oczekujące płatności</div>
            <div className="text-xs font-medium" style={{ color: overdueAmount > 0 ? '#E74C3C' : pendingAmount > 0 ? '#F1C40F' : '#2ECC71' }}>
              {overdueAmount > 0 ? `${formatCurrency(overdueAmount)} przeterminowane` : pendingAmount > 0 ? 'Do opłacenia' : 'Brak zaległości'}
            </div>
          </Card>
        </Link>
      )
    }
  }

  function renderSection(id: SectionId) {
    switch (id) {

      case 'week_summary':
        return weekStats.total > 0 ? (
          <Card className="px-5 py-3">
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>Ten tydzień:</span>
              <span className="font-medium">{weekStats.total} {plural(weekStats.total, 'sesja', 'sesje', 'sesji')} w planie</span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span className="font-medium text-green-400">{weekStats.completed} ukończonych</span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span className="font-medium" style={{ color: weekStats.rate >= 70 ? '#2ECC71' : weekStats.rate >= 40 ? '#F1C40F' : '#E74C3C' }}>
                {weekStats.rate}% realizacji
              </span>
              {weekStats.km > 0 && (
                <>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span className="font-medium">🏃 {weekStats.km.toFixed(0)} km</span>
                </>
              )}
            </div>
          </Card>
        ) : null

      case 'today_plan':
        return (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Dziś w planie</h3>
              <div className="flex items-center gap-2">
                {sessions.length > 0 && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{todayCompleted}/{sessions.length} wykonane</span>
                )}
                <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  {sessions.length} {plural(sessions.length, 'sesja', 'sesje', 'sesji')}
                </span>
              </div>
            </div>
            {sessions.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                <div className="text-3xl mb-2">🌿</div>
                <div className="text-sm">Brak zaplanowanych sesji na dziś</div>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((s: any) => {
                  const ath = s.athletes as { name: string; avatar: string } | null
                  return (
                    <Link key={s.id} href={`/coach/athletes/${s.athlete_id}`}
                      className="flex items-center gap-3 p-3 rounded-xl transition-opacity hover:opacity-80"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <Avatar initials={ath?.avatar ?? '?'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{ath?.name ?? '—'}</div>
                        <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{s.title}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${intensityColor(s.type)}`}>
                          {sessionTypeLabel(s.type)}
                        </span>
                        {s.planned_distance && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.planned_distance} km</span>}
                        {s.completed ? <span className="text-xs text-green-400 font-bold">✓</span> : <span className="text-xs" style={{ color: 'var(--border)' }}>○</span>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>
        )

      case 'messages':
        return (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Ostatnie wiadomości</h3>
              <Link href="/coach/chat" className="text-xs hover:opacity-80" style={{ color: '#FF5C1B' }}>Otwórz czat →</Link>
            </div>
            {messages.length === 0 ? (
              <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
                <div className="text-2xl mb-2">💬</div>
                <div className="text-sm">Brak nowych wiadomości</div>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((m: any) => {
                  const ath = m.athletes as { name: string; avatar: string } | null
                  return (
                    <Link key={m.id} href={`/coach/chat?athlete=${m.athlete_id}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition-opacity"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <Avatar initials={ath?.avatar ?? '?'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{ath?.name ?? '—'}</div>
                        <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{m.content}</div>
                      </div>
                      <div className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{timeAgo(m.created_at)}</div>
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>
        )

      case 'alerts':
        return alertAthletes.length > 0 ? (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Wymagają uwagi</h3>
              <Link href="/coach/athletes" className="text-xs hover:opacity-80" style={{ color: '#FF5C1B' }}>Wszyscy →</Link>
            </div>
            <div className="space-y-2">
              {alertAthletes.map((a: any) => {
                const info = ATHLETE_STATUS_INFO[a.status]
                return (
                  <Link key={a.id} href={`/coach/athletes/${a.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition-opacity"
                    style={{ background: 'var(--bg-elevated)' }}>
                    <Avatar initials={a.avatar} size="sm" />
                    <div className="flex-1 text-sm font-medium">{a.name}</div>
                    {info && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: info.bg, color: info.color }}>{info.label}</span>}
                  </Link>
                )
              })}
            </div>
          </Card>
        ) : null

      case 'no_sessions_week':
        return (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Bez planu w tygodniu</h3>
              <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                {noSessionsAthletes.length}
              </span>
            </div>
            {noSessionsAthletes.length === 0 ? (
              <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                ✅ Wszyscy zawodnicy mają plan na ten tydzień
              </div>
            ) : (
              <div className="space-y-2">
                {noSessionsAthletes.slice(0, 6).map((a: any) => (
                  <Link key={a.id} href={`/coach/athletes/${a.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition-opacity"
                    style={{ background: 'var(--bg-elevated)' }}>
                    <Avatar initials={a.avatar} size="sm" />
                    <div className="flex-1 text-sm font-medium">{a.name}</div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>brak sesji</span>
                  </Link>
                ))}
                {noSessionsAthletes.length > 6 && (
                  <div className="text-xs text-center pt-1" style={{ color: 'var(--text-muted)' }}>
                    i {noSessionsAthletes.length - 6} więcej
                  </div>
                )}
              </div>
            )}
          </Card>
        )

      case 'feedback_list':
        return (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Nieprzeczytany feedback</h3>
              <Link href="/coach/feedback" className="text-xs hover:opacity-80" style={{ color: '#FF5C1B' }}>Wszystkie →</Link>
            </div>
            {feedbacks.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                <div className="text-3xl mb-2">📥</div>
                <div className="text-sm">Brak nieprzeczytanego feedbacku</div>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbacks.map((f: any) => {
                  const ath = f.athletes as { name: string; avatar: string } | null
                  const sigColor = SIGNAL_COLOR[f.signal] ?? '#6B7280'
                  return (
                    <Link key={f.id} href="/coach/feedback"
                      className="block p-3 rounded-xl hover:opacity-80 transition-opacity"
                      style={{ background: 'var(--bg-elevated)', borderLeft: `3px solid ${sigColor}` }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Avatar initials={ath?.avatar ?? '?'} size="sm" />
                          <span className="text-sm font-medium">{ath?.name ?? '—'}</span>
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(f.created_at)}</span>
                      </div>
                      {f.ai_summary && (
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{f.ai_summary}</p>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>
        )

      case 'upcoming_races':
        return races.length > 0 ? (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Nadchodzące zawody</h3>
              <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>14 dni</span>
            </div>
            <div className="space-y-2">
              {races.map((race: any) => {
                const ath = race.athletes as { name: string; avatar: string } | null
                const days = daysUntil(race.date)
                return (
                  <Link key={race.id} href={`/coach/athletes/${race.athlete_id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition-opacity"
                    style={{ background: 'var(--bg-elevated)' }}>
                    <Avatar initials={ath?.avatar ?? '?'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{ath?.name ?? '—'}</div>
                      <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {race.name}{race.distance ? ` · ${race.distance}` : ''}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold" style={{ color: days === 0 ? '#E74C3C' : days <= 3 ? '#F39C12' : days <= 7 ? '#F1C40F' : 'var(--text-muted)' }}>
                        {days === 0 ? 'Dziś!' : days === 1 ? 'Jutro' : `za ${days} dni`}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(race.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </Card>
        ) : null

      case 'recent_athletes': {
        const sorted = [...allAthletes]
          .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
          .slice(0, 4)
        return (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Ostatnio dodani zawodnicy</h3>
              <Link href="/coach/athletes" className="text-xs hover:opacity-80" style={{ color: '#FF5C1B' }}>Wszyscy →</Link>
            </div>
            {sorted.length === 0 ? (
              <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>Brak zawodników</div>
            ) : (
              <div className="space-y-2">
                {sorted.map((a: any) => (
                  <Link key={a.id} href={`/coach/athletes/${a.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition-opacity"
                    style={{ background: 'var(--bg-elevated)' }}>
                    <Avatar initials={a.avatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{a.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.package}</div>
                    </div>
                    <div className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {a.created_at ? new Date(a.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }) : ''}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        )
      }

      case 'recent_invoices':
        return (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Ostatnie faktury</h3>
              <Link href="/coach/invoices" className="text-xs hover:opacity-80" style={{ color: '#FF5C1B' }}>Wszystkie →</Link>
            </div>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>Brak faktur</div>
            ) : (
              <div className="space-y-2">
                {recentInvoices.map((inv: any) => {
                  const ath = inv.athletes as { name: string; avatar: string } | null
                  const st = INVOICE_STATUS_INFO[inv.status] ?? INVOICE_STATUS_INFO.pending
                  return (
                    <Link key={inv.id} href="/coach/invoices"
                      className="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition-opacity"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <Avatar initials={ath?.avatar ?? '?'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{ath?.name ?? '—'}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{inv.number}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold">{formatCurrency(inv.amount)}</div>
                        <div className="text-xs font-medium" style={{ color: st.color }}>{st.label}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>
        )
    }
  }

  // ── Settings modal content ────────────────────────────────────────────────

  const settingsGroups: { label: string; col: 'kpi' | 'full' | 'left' | 'right' }[] = [
    { label: 'KPI karty', col: 'kpi' },
    { label: 'Pełna szerokość', col: 'full' },
    { label: 'Lewa kolumna', col: 'left' },
    { label: 'Prawa kolumna', col: 'right' },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  const hasLeft = leftSections.length > 0
  const hasRight = rightSections.length > 0

  return (
    <div>
      <CoachTopbar
        title={`Dzień dobry, ${coachName}! 👋`}
        subtitle={todayLabel}
        actions={
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,92,27,0.12)', color: '#FF5C1B', border: '1px solid rgba(255,92,27,0.3)' }}
          >
            ⚙️ Dostosuj widok
          </button>
        }
      />

      <div className="p-6 max-w-6xl mx-auto space-y-5">

        {/* Onboarding hint */}
        {!hintDismissed && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm"
            style={{ background: 'rgba(255,92,27,0.08)', border: '1px solid rgba(255,92,27,0.2)' }}>
            <span className="text-lg shrink-0">💡</span>
            <span style={{ color: 'var(--text-primary)' }}>
              Dashboard możesz dostosować do swoich potrzeb — ukrywać sekcje, zmieniać kolejność i dodawać nowe widgety klikając{' '}
              <button onClick={() => setSettingsOpen(true)} className="font-semibold underline cursor-pointer" style={{ color: '#FF5C1B' }}>
                ⚙️ Dostosuj widok
              </button>.
            </span>
            <button
              onClick={() => { setHintDismissed(true); localStorage.setItem('dashboard-hint-dismissed', '1') }}
              className="shrink-0 text-lg leading-none cursor-pointer hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}
            >×</button>
          </div>
        )}

        {/* KPI row */}
        {visibleKpi.length > 0 && (
          <div className="flex gap-4">
            {visibleKpi.map(k => (
              <div key={k.id} className="flex-1">{renderKpi(k.id)}</div>
            ))}
          </div>
        )}

        {/* Full-width sections */}
        {fullSections.map(s => (
          <div key={s.id}>{renderSection(s.id)}</div>
        ))}

        {/* 2-col grid */}
        {(hasLeft || hasRight) && (
          <div className={hasLeft && hasRight ? 'grid grid-cols-5 gap-6' : 'block'}>
            {hasLeft && (
              <div className={hasRight ? 'col-span-3 space-y-5' : 'space-y-5'}>
                {leftSections.map(s => (
                  <div key={s.id}>{renderSection(s.id)}</div>
                ))}
              </div>
            )}
            {hasRight && (
              <div className={hasLeft ? 'col-span-2 space-y-5' : 'space-y-5'}>
                {rightSections.map(s => (
                  <div key={s.id}>{renderSection(s.id)}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings modal */}
      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Dostosuj dashboard"
        size="lg"
        footer={
          <div className="flex items-center justify-between">
            <button
              onClick={() => savePrefs(DEFAULT_PREFS)}
              className="text-sm cursor-pointer hover:opacity-70 transition-opacity"
              style={{ color: 'var(--text-muted)' }}
            >
              Przywróć domyślne
            </button>
            <button
              onClick={() => setSettingsOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
              style={{ background: '#FF5C1B', color: 'white' }}
            >
              Gotowe
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {settingsGroups.map(group => {
            if (group.col === 'kpi') {
              return (
                <div key="kpi">
                  <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {group.label}
                  </div>
                  <div className="space-y-1">
                    {prefs.kpi.map((k, i) => (
                      <SettingsRow
                        key={k.id}
                        icon={KPI_META[k.id].icon}
                        label={KPI_META[k.id].label}
                        desc=""
                        visible={k.visible}
                        onToggle={() => toggleKpi(k.id)}
                        onUp={() => moveKpi(k.id, -1)}
                        onDown={() => moveKpi(k.id, 1)}
                        canUp={i > 0}
                        canDown={i < prefs.kpi.length - 1}
                      />
                    ))}
                  </div>
                </div>
              )
            }
            const colSections = prefs.sections.filter(s => SECTION_COL[s.id] === group.col)
            if (colSections.length === 0) return null
            return (
              <div key={group.col}>
                <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {group.label}
                </div>
                <div className="space-y-1">
                  {colSections.map((s, i) => (
                    <SettingsRow
                      key={s.id}
                      icon={SECTION_META[s.id].icon}
                      label={SECTION_META[s.id].label}
                      desc={SECTION_META[s.id].desc}
                      visible={s.visible}
                      onToggle={() => toggleSection(s.id)}
                      onUp={() => moveSection(s.id, -1)}
                      onDown={() => moveSection(s.id, 1)}
                      canUp={i > 0}
                      canDown={i < colSections.length - 1}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}
