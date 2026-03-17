import type { Metadata } from 'next'
import { addDaysToBusinessDate, getBusinessToday, getBusinessWeekday } from '@/lib/date'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Dashboard | Strefa Trenera' }
import { DashboardClient } from './_components/DashboardClient'
import type {
  DashboardAthleteRow,
  DashboardFeedbackRow,
  DashboardInvoiceRow,
  DashboardMessageRow,
  DashboardRaceRow,
  DashboardSessionRow,
  DashboardWeekSessionRow,
} from './_components/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const todayStr = getBusinessToday()
  const todayDate = new Date(`${todayStr}T12:00:00`)
  const todayLabel = todayDate.toLocaleDateString('pl-PL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // End of current week (Sunday)
  const dow = getBusinessWeekday(todayDate)
  const weekEnd = addDaysToBusinessDate(todayStr, dow === 0 ? 0 : 7 - dow)

  // 14 days ahead for races
  const twoWeeksStr = addDaysToBusinessDate(todayStr, 14)

  const [
    { data: coachRow },
    { data: athletes },
    { count: unreadFeedbackCount },
    { data: unreadFeedbacks },
    { count: unreadMessagesCount },
    { data: unreadMessages },
    { data: invoices },
    { data: todaySessions },
    { data: planningSessions },
    { data: upcomingRaces },
    { data: invoiceList },
  ] = await Promise.all([
    supabase.from('coaches').select('name').eq('id', user!.id).single(),
    supabase.from('athletes')
      .select('id, name, avatar, status, package, package_price, created_at')
      .eq('coach_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase.from('feedbacks').select('*', { count: 'exact', head: true }).eq('coach_id', user!.id).eq('read', false),
    supabase.from('feedbacks')
      .select('id, athlete_id, created_at, transcript, signal, athletes(name, avatar)')
      .eq('coach_id', user!.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', user!.id)
      .eq('sender_type', 'athlete')
      .eq('read', false),
    supabase.from('messages')
      .select('id, athlete_id, content, created_at, athletes(name, avatar)')
      .eq('coach_id', user!.id)
      .eq('sender_type', 'athlete')
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('invoices').select('amount, status, due_date').eq('coach_id', user!.id),
    supabase.from('training_sessions')
      .select('id, type, title, planned_distance, completed, athlete_id, athletes(name, avatar)')
      .eq('coach_id', user!.id)
      .eq('date', todayStr)
      .order('created_at'),
    supabase.from('training_sessions')
      .select('athlete_id, completed, actual_distance')
      .eq('coach_id', user!.id)
      .gte('date', todayStr)
      .lte('date', weekEnd),
    supabase.from('athlete_races')
      .select('id, name, date, distance, athlete_id, athletes(name, avatar)')
      .eq('coach_id', user!.id)
      .eq('status', 'planned')
      .gte('date', todayStr)
      .lte('date', twoWeeksStr)
      .order('date')
      .limit(4),
    supabase.from('invoices')
      .select('id, number, amount, status, date, due_date, athlete_id, athletes(name, avatar)')
      .eq('coach_id', user!.id)
      .order('due_date', { ascending: true }),
  ])

  // Supabase client without generated types returns loose shapes for joins;
  // we cast through `unknown` at this server/client boundary.
  const allAthletes = (athletes ?? []) as DashboardAthleteRow[]
  const allInvoices = invoices ?? []
  const feedbacks = (unreadFeedbacks ?? []) as unknown as DashboardFeedbackRow[]
  const messages = (unreadMessages ?? []) as unknown as DashboardMessageRow[]
  const sessions = (todaySessions ?? []) as unknown as DashboardSessionRow[]
  const planningWindow = (planningSessions ?? []) as DashboardWeekSessionRow[]
  const races = (upcomingRaces ?? []) as unknown as DashboardRaceRow[]
  const allInvoiceRows = (invoiceList ?? []) as unknown as DashboardInvoiceRow[]
  const tomorrowStr = addDaysToBusinessDate(todayStr, 1)
  const overdueItems = allInvoiceRows
    .filter((invoice) =>
      !!invoice.due_date &&
      invoice.due_date < todayStr &&
      invoice.status !== 'paid' &&
      invoice.status !== 'cancelled'
    )
    .slice(0, 5)

  // KPI
  const activeCount = allAthletes.filter(a => a.status !== 'inactive').length
  const estimatedMonthlyRevenue = allAthletes
    .filter(a => a.status !== 'inactive')
    .reduce((sum, athlete) => sum + athlete.package_price, 0)
  const overdueInvoicesComputed = allInvoices.filter((invoice) =>
    !!invoice.due_date &&
    invoice.due_date < todayStr &&
    invoice.status !== 'paid' &&
    invoice.status !== 'cancelled'
  )
  const pendingInvoicesComputed = allInvoices.filter((invoice) =>
    invoice.status === 'pending' &&
    (!invoice.due_date || invoice.due_date >= todayStr)
  )
  const pendingAmount = pendingInvoicesComputed.reduce((sum, invoice) => sum + invoice.amount, 0)
  const overdueAmount = overdueInvoicesComputed.reduce((sum, invoice) => sum + invoice.amount, 0)
  const pendingCount = pendingInvoicesComputed.length
  const overdueCount = overdueInvoicesComputed.length
  const alertAthletes = allAthletes.filter(a => a.status === 'alert' || a.status === 'warning')
  const coachName = (coachRow?.name ?? '').split(' ')[0] || 'Trenerze'
  const totalUnread = unreadFeedbackCount ?? 0
  const totalUnreadMessages = unreadMessagesCount ?? 0
  const raceSoonCount = races.filter(race => race.date === todayStr || race.date === tomorrowStr).length

  return (
    <DashboardClient
      coachName={coachName}
      todayIso={todayStr}
      todayLabel={todayLabel}
      allAthletes={allAthletes}
      feedbacks={feedbacks}
      messages={messages}
      sessions={sessions}
      weekSessions={planningWindow}
      races={races}
      overdueInvoices={overdueItems}
      totalUnread={totalUnread}
      totalUnreadMessages={totalUnreadMessages}
      estimatedMonthlyRevenue={estimatedMonthlyRevenue}
      activeCount={activeCount}
      pendingAmount={pendingAmount}
      overdueAmount={overdueAmount}
      pendingCount={pendingCount}
      overdueCount={overdueCount}
      raceSoonCount={raceSoonCount}
      alertAthletes={alertAthletes}
    />
  )
}
