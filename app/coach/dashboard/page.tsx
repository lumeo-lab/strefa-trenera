import { createClient } from '@/lib/supabase/server'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { formatCurrency, sessionTypeLabel, intensityColor } from '@/lib/utils'
import Link from 'next/link'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `${min} min temu`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} godz. temu`
  const d = Math.floor(h / 24)
  return `${d} dni temu`
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function pluralSessions(n: number) {
  if (n === 1) return 'sesja'
  if (n >= 2 && n <= 4) return 'sesje'
  return 'sesji'
}

function pluralAlerts(n: number) {
  if (n === 1) return 'alert'
  if (n >= 2 && n <= 4) return 'alerty'
  return 'alertów'
}

const SIGNAL_COLOR: Record<string, string> = {
  green: '#2ECC71',
  yellow: '#F1C40F',
  red: '#E74C3C',
}

const ATHLETE_STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  alert:   { label: 'Alert',  color: '#E74C3C', bg: 'rgba(231,76,60,0.1)' },
  warning: { label: 'Uwaga',  color: '#F39C12', bg: 'rgba(243,156,18,0.1)' },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const todayLabel = today.toLocaleDateString('pl-PL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // Week bounds Mon–Sun
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const weekStart = monday.toISOString().slice(0, 10)
  const weekEnd = sunday.toISOString().slice(0, 10)

  // 14 days ahead for races
  const twoWeeks = new Date(today)
  twoWeeks.setDate(today.getDate() + 14)
  const twoWeeksStr = twoWeeks.toISOString().slice(0, 10)

  const [
    { data: coachRow },
    { data: athletes },
    { count: unreadFeedbackCount },
    { data: unreadFeedbacks },
    { data: recentMessages },
    { data: invoices },
    { data: todaySessions },
    { data: weekSessions },
    { data: upcomingRaces },
  ] = await Promise.all([
    supabase.from('coaches').select('name').eq('id', user!.id).single(),
    supabase.from('athletes').select('id, name, avatar, status, package_price'),
    // Separate count query — not capped by limit
    supabase.from('feedbacks').select('*', { count: 'exact', head: true }).eq('read', false),
    supabase.from('feedbacks')
      .select('id, athlete_id, created_at, ai_summary, signal, athletes(name, avatar)')
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(5),
    // Fixed: sender_type (not sender) + link per athlete
    supabase.from('messages')
      .select('id, athlete_id, content, created_at, athletes(name, avatar)')
      .eq('sender_type', 'athlete')
      .order('created_at', { ascending: false })
      .limit(4),
    supabase.from('invoices').select('amount, status'),
    supabase.from('training_sessions')
      .select('id, type, title, planned_distance, completed, athlete_id, athletes(name, avatar)')
      .eq('coach_id', user!.id)
      .eq('date', todayStr)
      .order('created_at'),
    supabase.from('training_sessions')
      .select('id, completed, actual_distance')
      .eq('coach_id', user!.id)
      .gte('date', weekStart)
      .lte('date', weekEnd),
    supabase.from('athlete_races')
      .select('id, name, date, distance, athlete_id, athletes(name, avatar)')
      .eq('coach_id', user!.id)
      .eq('status', 'planned')
      .gte('date', todayStr)
      .lte('date', twoWeeksStr)
      .order('date')
      .limit(4),
  ])

  const allAthletes = athletes ?? []
  const allInvoices = invoices ?? []
  const feedbacks = unreadFeedbacks ?? []
  const messages = recentMessages ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessions = (todaySessions ?? []) as any[]
  const weekSess = weekSessions ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const races = (upcomingRaces ?? []) as any[]

  // KPI
  const activeCount = allAthletes.filter(a => a.status !== 'inactive').length
  const mrr = allAthletes.filter(a => a.status !== 'inactive').reduce((s, a) => s + a.package_price, 0)
  const pendingAmount = allInvoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0)
  const overdueAmount = allInvoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0)
  const alertAthletes = allAthletes.filter(a => a.status === 'alert' || a.status === 'warning')
  const coachName = (coachRow?.name ?? '').split(' ')[0] || 'Trenerze'
  const totalUnread = unreadFeedbackCount ?? 0

  // Week summary
  const weekTotal = weekSess.length
  const weekCompleted = weekSess.filter(s => s.completed).length
  const weekKm = weekSess
    .filter(s => s.completed && s.actual_distance)
    .reduce((sum, s) => sum + (s.actual_distance || 0), 0)
  const weekRate = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0

  // Today
  const todayCompleted = sessions.filter(s => s.completed).length

  return (
    <div>
      <CoachTopbar
        title={`Dzień dobry, ${coachName}! 👋`}
        subtitle={todayLabel}
      />

      <div className="p-6 max-w-6xl mx-auto space-y-5">

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-4 gap-4">

          {/* Active athletes */}
          <Link href="/coach/athletes">
            <Card className="p-5 hover:opacity-80 transition-opacity cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">👟</span>
                {alertAthletes.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>
                    {alertAthletes.length} {pluralAlerts(alertAthletes.length)}
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold mb-1">{activeCount}</div>
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Aktywni zawodnicy</div>
              <div className="text-xs font-medium" style={{ color: '#2ECC71' }}>{allAthletes.length} łącznie</div>
            </Card>
          </Link>

          {/* MRR */}
          <Link href="/coach/analytics">
            <Card className="p-5 hover:opacity-80 transition-opacity cursor-pointer">
              <div className="mb-3 text-2xl">💰</div>
              <div className="text-2xl font-bold mb-1">{formatCurrency(mrr)}</div>
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Przychód miesięczny</div>
              <div className="text-xs font-medium" style={{ color: '#FF5C1B' }}>{activeCount} × pakiet</div>
            </Card>
          </Link>

          {/* Unread feedback — real count, not capped */}
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

          {/* Payments — overdue distinguished */}
          <Link href="/coach/invoices">
            <Card className="p-5 hover:opacity-80 transition-opacity cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">💳</span>
                {overdueAmount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>
                    Zaległość
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold mb-1" style={{ color: overdueAmount > 0 ? '#E74C3C' : 'inherit' }}>
                {formatCurrency(pendingAmount + overdueAmount)}
              </div>
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Oczekujące płatności</div>
              <div className="text-xs font-medium" style={{
                color: overdueAmount > 0 ? '#E74C3C' : pendingAmount > 0 ? '#F1C40F' : '#2ECC71',
              }}>
                {overdueAmount > 0
                  ? `${formatCurrency(overdueAmount)} przeterminowane`
                  : pendingAmount > 0 ? 'Do opłacenia' : 'Brak zaległości'}
              </div>
            </Card>
          </Link>
        </div>

        {/* ── Week summary bar ── */}
        {weekTotal > 0 && (
          <Card className="px-5 py-3">
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>Ten tydzień:</span>
              <span className="font-medium">{weekTotal} {pluralSessions(weekTotal)} w planie</span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span className="font-medium text-green-400">{weekCompleted} ukończonych</span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span className="font-medium" style={{
                color: weekRate >= 70 ? '#2ECC71' : weekRate >= 40 ? '#F1C40F' : '#E74C3C',
              }}>
                {weekRate}% realizacji
              </span>
              {weekKm > 0 && (
                <>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span className="font-medium">🏃 {weekKm.toFixed(0)} km</span>
                </>
              )}
            </div>
          </Card>
        )}

        {/* ── Main grid ── */}
        <div className="grid grid-cols-5 gap-6">

          {/* Left col (3/5) */}
          <div className="col-span-3 space-y-5">

            {/* Today's plan */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Dziś w planie</h3>
                <div className="flex items-center gap-2">
                  {sessions.length > 0 && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {todayCompleted}/{sessions.length} wykonane
                    </span>
                  )}
                  <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                    {sessions.length} {pluralSessions(sessions.length)}
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
                  {sessions.map((s) => {
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
                          {s.planned_distance && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.planned_distance} km</span>
                          )}
                          {s.completed
                            ? <span className="text-xs text-green-400 font-bold">✓</span>
                            : <span className="text-xs" style={{ color: 'var(--border)' }}>○</span>
                          }
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Recent messages — fixed sender_type + per-athlete link */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Ostatnie wiadomości</h3>
                <Link href="/coach/chat" className="text-xs hover:opacity-80" style={{ color: '#FF5C1B' }}>
                  Otwórz czat →
                </Link>
              </div>
              {messages.length === 0 ? (
                <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
                  <div className="text-2xl mb-2">💬</div>
                  <div className="text-sm">Brak nowych wiadomości</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {(messages as any[]).map((m) => {
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

            {/* Alert athletes — only shown when relevant */}
            {alertAthletes.length > 0 && (
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Wymagają uwagi</h3>
                  <Link href="/coach/athletes" className="text-xs hover:opacity-80" style={{ color: '#FF5C1B' }}>
                    Wszyscy →
                  </Link>
                </div>
                <div className="space-y-2">
                  {alertAthletes.map((a) => {
                    const info = ATHLETE_STATUS_INFO[a.status]
                    return (
                      <Link key={a.id} href={`/coach/athletes/${a.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition-opacity"
                        style={{ background: 'var(--bg-elevated)' }}>
                        <Avatar initials={a.avatar} size="sm" />
                        <div className="flex-1 text-sm font-medium">{a.name}</div>
                        {info && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: info.bg, color: info.color }}>
                            {info.label}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* Right col (2/5) */}
          <div className="col-span-2 space-y-5">

            {/* Unread feedback — fixed title */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Nieprzeczytany feedback</h3>
                <Link href="/coach/feedback" className="text-xs hover:opacity-80" style={{ color: '#FF5C1B' }}>
                  Wszystkie →
                </Link>
              </div>
              {feedbacks.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  <div className="text-3xl mb-2">📥</div>
                  <div className="text-sm">Brak nieprzeczytanego feedbacku</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {(feedbacks as any[]).map((f) => {
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
                          <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                            {f.ai_summary}
                          </p>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Upcoming races — next 14 days */}
            {races.length > 0 && (
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Nadchodzące zawody</h3>
                  <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                    14 dni
                  </span>
                </div>
                <div className="space-y-2">
                  {races.map((race) => {
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
                          <div className="text-xs font-semibold" style={{
                            color: days === 0 ? '#E74C3C' : days <= 3 ? '#F39C12' : days <= 7 ? '#F1C40F' : 'var(--text-muted)',
                          }}>
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
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
