import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './_components/DashboardClient'
import type {
  DashboardAthleteRow,
  DashboardFeedbackRow,
  DashboardMessageRow,
  DashboardSessionRow,
  DashboardWeekSessionRow,
  DashboardRaceRow,
  DashboardInvoiceRow,
} from './_components/types'

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
    { data: recentInvoices },
  ] = await Promise.all([
    supabase.from('coaches').select('name').eq('id', user!.id).single(),
    // added created_at for "recently added" section
    supabase.from('athletes')
      .select('id, name, avatar, status, package, package_price, created_at')
      .eq('coach_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase.from('feedbacks').select('*', { count: 'exact', head: true }).eq('coach_id', user!.id).eq('read', false),
    supabase.from('feedbacks')
      .select('id, athlete_id, created_at, ai_summary, signal, athletes(name, avatar)')
      .eq('coach_id', user!.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('messages')
      .select('id, athlete_id, content, created_at, athletes(name, avatar)')
      .eq('coach_id', user!.id)
      .eq('sender_type', 'athlete')
      .order('created_at', { ascending: false })
      .limit(4),
    supabase.from('invoices').select('amount, status').eq('coach_id', user!.id),
    supabase.from('training_sessions')
      .select('id, type, title, planned_distance, completed, athlete_id, athletes(name, avatar)')
      .eq('coach_id', user!.id)
      .eq('date', todayStr)
      .order('created_at'),
    // added athlete_id for "no sessions this week" section
    supabase.from('training_sessions')
      .select('athlete_id, completed, actual_distance')
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
    // new: recent invoices for optional section
    supabase.from('invoices')
      .select('id, number, amount, status, date, athlete_id, athletes(name, avatar)')
      .eq('coach_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Supabase client without generated types returns loose shapes for joins;
  // we cast through `unknown` at this server/client boundary.
  const allAthletes = (athletes ?? []) as DashboardAthleteRow[]
  const allInvoices = invoices ?? []
  const feedbacks = (unreadFeedbacks ?? []) as unknown as DashboardFeedbackRow[]
  const messages = (recentMessages ?? []) as unknown as DashboardMessageRow[]
  const sessions = (todaySessions ?? []) as unknown as DashboardSessionRow[]
  const weekSess = (weekSessions ?? []) as DashboardWeekSessionRow[]
  const races = (upcomingRaces ?? []) as unknown as DashboardRaceRow[]

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

  return (
    <DashboardClient
      coachName={coachName}
      todayLabel={todayLabel}
      allAthletes={allAthletes}
      feedbacks={feedbacks}
      messages={messages}
      sessions={sessions}
      weekSessions={weekSess}
      races={races}
      recentInvoices={(recentInvoices ?? []) as unknown as DashboardInvoiceRow[]}
      totalUnread={totalUnread}
      mrr={mrr}
      activeCount={activeCount}
      pendingAmount={pendingAmount}
      overdueAmount={overdueAmount}
      alertAthletes={alertAthletes}
      weekStats={{ total: weekTotal, completed: weekCompleted, km: weekKm, rate: weekRate }}
    />
  )
}
