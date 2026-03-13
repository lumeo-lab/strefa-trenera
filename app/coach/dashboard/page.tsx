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

const SIGNAL_COLOR: Record<string, string> = {
  green: '#2ECC71',
  yellow: '#F1C40F',
  red: '#E74C3C',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date().toISOString().slice(0, 10)
  const todayLabel = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const [
    { data: coachRow },
    { data: athletes },
    { data: unreadFeedbacks },
    { data: recentMessages },
    { data: invoices },
    { data: todaySessions },
  ] = await Promise.all([
    supabase.from('coaches').select('name').eq('id', user!.id).single(),
    supabase.from('athletes').select('id, name, avatar, status, package_price'),
    supabase.from('feedbacks')
      .select('id, athlete_id, created_at, ai_summary, signal, athletes(name, avatar)')
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('messages')
      .select('id, athlete_id, content, created_at, athletes(name, avatar)')
      .eq('sender', 'athlete')
      .order('created_at', { ascending: false })
      .limit(4),
    supabase.from('invoices').select('amount, status'),
    supabase.from('training_sessions')
      .select('id, type, title, planned_distance, completed, athlete_id, athletes(name, avatar)')
      .eq('coach_id', user!.id)
      .eq('date', today),
  ])

  const allAthletes = athletes ?? []
  const allInvoices = invoices ?? []
  const feedbacks = unreadFeedbacks ?? []
  const messages = recentMessages ?? []
  const sessions = todaySessions ?? []

  const activeCount = allAthletes.filter(a => a.status !== 'inactive').length
  const mrr = allAthletes.filter(a => a.status !== 'inactive').reduce((s, a) => s + a.package_price, 0)
  const pendingAmount = allInvoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0)
  const alertCount = allAthletes.filter(a => a.status === 'alert' || a.status === 'warning').length
  const coachName = (coachRow?.name ?? '').split(' ')[0] || 'Trenerze'

  return (
    <div>
      <CoachTopbar
        title={`Dzień dobry, ${coachName}! 👋`}
        subtitle={todayLabel}
      />

      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Aktywni zawodnicy', value: activeCount, sub: `${allAthletes.length} łącznie`, color: '#2ECC71', icon: '👟', href: '/coach/athletes' },
            { label: 'Przychód miesięczny', value: formatCurrency(mrr), sub: 'Suma pakietów', color: '#FF5C1B', icon: '💰', href: '/coach/analytics' },
            { label: 'Nieodczytany feedback', value: feedbacks.length, sub: feedbacks.length > 0 ? 'Wymaga uwagi' : 'Wszystko odczytane', color: feedbacks.length > 0 ? '#F1C40F' : '#2ECC71', icon: '📥', href: '/coach/feedback' },
            { label: 'Oczekujące płatności', value: formatCurrency(pendingAmount), sub: pendingAmount > 0 ? 'Do opłacenia' : 'Brak zaległości', color: pendingAmount > 0 ? '#E74C3C' : '#2ECC71', icon: '💳', href: '/coach/invoices' },
          ].map(kpi => (
            <Link key={kpi.label} href={kpi.href}>
              <Card className="p-5 hover:opacity-80 transition-opacity cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{kpi.icon}</span>
                  {alertCount > 0 && kpi.label === 'Aktywni zawodnicy' && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>
                      {alertCount} alert
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold mb-1">{kpi.value}</div>
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{kpi.label}</div>
                <div className="text-xs font-medium" style={{ color: kpi.color }}>{kpi.sub}</div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-6">

          {/* Left column (3/5) */}
          <div className="col-span-3 space-y-6">

            {/* Today's plan */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Dziś w planie</h3>
                <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  {sessions.length} {sessions.length === 1 ? 'sesja' : sessions.length > 4 ? 'sesji' : 'sesje'}
                </span>
              </div>
              {sessions.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  <div className="text-3xl mb-2">🌿</div>
                  <div className="text-sm">Brak zaplanowanych sesji na dziś</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s: any) => {
                    const athlete = s.athletes as { name: string; avatar: string } | null
                    return (
                      <Link key={s.id} href={`/coach/athletes/${s.athlete_id}`}
                        className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:opacity-80"
                        style={{ background: 'var(--bg-elevated)' }}>
                        <Avatar initials={athlete?.avatar ?? '?'} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{athlete?.name ?? '—'}</div>
                          <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{s.title}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${intensityColor(s.type)}`}>
                            {sessionTypeLabel(s.type)}
                          </span>
                          {s.planned_distance && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.planned_distance} km</span>
                          )}
                          {s.completed && <span className="text-xs text-green-400">✓</span>}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Recent messages */}
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
                  {messages.map((m: any) => {
                    const athlete = m.athletes as { name: string; avatar: string } | null
                    return (
                      <Link key={m.id} href="/coach/chat"
                        className="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition-opacity"
                        style={{ background: 'var(--bg-elevated)' }}>
                        <Avatar initials={athlete?.avatar ?? '?'} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{athlete?.name ?? '—'}</div>
                          <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{m.content}</div>
                        </div>
                        <div className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{timeAgo(m.created_at)}</div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right column (2/5) */}
          <div className="col-span-2">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Ostatni feedback</h3>
                <Link href="/coach/feedback" className="text-xs hover:opacity-80" style={{ color: '#FF5C1B' }}>
                  Wszystkie →
                </Link>
              </div>
              {feedbacks.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  <div className="text-3xl mb-2">📥</div>
                  <div className="text-sm">Brak nieodczytanego feedbacku</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbacks.map((f: any) => {
                    const athlete = f.athletes as { name: string; avatar: string } | null
                    const signalColor = SIGNAL_COLOR[f.signal] ?? '#6B7280'
                    return (
                      <Link key={f.id} href="/coach/feedback"
                        className="block p-3 rounded-xl hover:opacity-80 transition-opacity"
                        style={{ background: 'var(--bg-elevated)', borderLeft: `3px solid ${signalColor}` }}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Avatar initials={athlete?.avatar ?? '?'} size="sm" />
                            <span className="text-sm font-medium">{athlete?.name ?? '—'}</span>
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
          </div>

        </div>
      </div>
    </div>
  )
}
