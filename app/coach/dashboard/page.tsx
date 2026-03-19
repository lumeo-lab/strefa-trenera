import type { Metadata } from 'next'
import { addDaysToBusinessDate, getBusinessToday, getBusinessWeekday } from '@/lib/date'
import { getSessionExecutionStatus, isSessionOpenForExecution } from '@/lib/session-status'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Dashboard | Strefa Trenera' }
import { DashboardClient } from './_components/DashboardClient'
import type {
  DashboardAlertItem,
  DashboardAthleteRow,
  DashboardFeedbackRow,
  DashboardInvoiceRow,
  DashboardMessageRow,
  DashboardRaceRow,
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

  const [{ data: coachRow }, athletesResult, archivedAthletesCountResult] = await Promise.all([
    supabase.from('coaches').select('name').eq('id', user!.id).single(),
    supabase.from('athletes')
      .select('id, name, avatar, status, package, package_price, created_at')
      .eq('coach_id', user!.id)
      .is('archived_at', null)
      .order('created_at', { ascending: false }),
    supabase.from('athletes')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', user!.id)
      .not('archived_at', 'is', null),
  ])

  const fallbackAthletesResult = athletesResult.error
    ? await supabase.from('athletes')
      .select('id, name, avatar, status, package, package_price, created_at')
      .eq('coach_id', user!.id)
      .order('created_at', { ascending: false })
    : null

  const athletes = athletesResult.error ? (fallbackAthletesResult?.data ?? []) : (athletesResult.data ?? [])
  const activeAthleteIds = athletes.map((athlete) => athlete.id)

  const [
    { count: unreadFeedbackCount },
    { data: unreadFeedbacks },
    { data: unreadFeedbackMeta },
    { count: unreadMessagesCount },
    { data: unreadMessages },
    { data: unreadMessageMeta },
    { data: invoices },
    { data: todaySessions },
    { data: planningSessions },
    { data: upcomingRaces },
    { data: invoiceList },
  ] = activeAthleteIds.length === 0
    ? [
      { count: 0 },
      { data: [] },
      { data: [] },
      { count: 0 },
      { data: [] },
      { data: [] },
      await supabase.from('invoices').select('amount, status, due_date, athlete_id').eq('coach_id', user!.id),
      { data: [] },
      { data: [] },
      { data: [] },
      await supabase.from('invoices')
        .select('id, number, amount, status, date, due_date, athlete_id, athletes(name, avatar)')
        .eq('coach_id', user!.id)
        .order('due_date', { ascending: true }),
    ]
    : await Promise.all([
      supabase.from('feedbacks').select('*', { count: 'exact', head: true }).eq('coach_id', user!.id).eq('read', false).in('athlete_id', activeAthleteIds),
      supabase.from('feedbacks')
        .select('id, athlete_id, created_at, transcript, signal, athletes(name, avatar)')
        .eq('coach_id', user!.id)
        .eq('read', false)
        .in('athlete_id', activeAthleteIds)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('feedbacks')
        .select('athlete_id, signal')
        .eq('coach_id', user!.id)
        .eq('read', false)
        .in('athlete_id', activeAthleteIds),
      supabase.from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user!.id)
        .eq('sender_type', 'athlete')
        .eq('read', false)
        .in('athlete_id', activeAthleteIds),
      supabase.from('messages')
        .select('id, athlete_id, content, created_at, athletes(name, avatar)')
        .eq('coach_id', user!.id)
        .eq('sender_type', 'athlete')
        .eq('read', false)
        .in('athlete_id', activeAthleteIds)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('messages')
        .select('athlete_id')
        .eq('coach_id', user!.id)
        .eq('sender_type', 'athlete')
        .eq('read', false)
        .in('athlete_id', activeAthleteIds),
      supabase.from('invoices').select('amount, status, due_date, athlete_id').eq('coach_id', user!.id),
      supabase.from('training_sessions')
        .select('id, date, type, title, planned_distance, completed, status, completion_source, athlete_id, athletes(name, avatar), feedbacks(signal)')
        .eq('coach_id', user!.id)
        .in('athlete_id', activeAthleteIds)
        .eq('date', todayStr)
        .order('created_at'),
      supabase.from('training_sessions')
        .select('athlete_id, date, completed, status, actual_distance')
        .eq('coach_id', user!.id)
        .in('athlete_id', activeAthleteIds)
        .gte('date', todayStr)
        .lte('date', weekEnd),
      supabase.from('athlete_races')
        .select('id, name, date, distance, athlete_id, athletes(name, avatar)')
        .eq('coach_id', user!.id)
        .in('athlete_id', activeAthleteIds)
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
  const unreadFeedbackByAthlete = Object.fromEntries(
    (unreadFeedbackMeta ?? []).reduce((map, row) => {
      map.set(row.athlete_id, (map.get(row.athlete_id) ?? 0) + 1)
      return map
    }, new Map<string, number>()),
  ) as Record<string, number>
  const unreadRedFeedbackByAthlete = Object.fromEntries(
    (unreadFeedbackMeta ?? []).reduce((map, row) => {
      if (row.signal === 'red') map.set(row.athlete_id, (map.get(row.athlete_id) ?? 0) + 1)
      return map
    }, new Map<string, number>()),
  ) as Record<string, number>
  const unreadMessagesByAthlete = Object.fromEntries(
    (unreadMessageMeta ?? []).reduce((map, row) => {
      map.set(row.athlete_id, (map.get(row.athlete_id) ?? 0) + 1)
      return map
    }, new Map<string, number>()),
  ) as Record<string, number>
  const sessions = ((todaySessions ?? []) as unknown as Array<{
    id: string
    date: string
    type: string
    title: string
    planned_distance: number | null
    completed: boolean
    status: 'planned' | 'completed' | 'skipped' | 'detected'
    completion_source: 'athlete' | 'coach' | 'strava' | 'imported' | null
    athlete_id: string
    athletes: Array<{ name: string; avatar: string }> | { name: string; avatar: string } | null
    feedbacks?: Array<{ signal: string | null }> | null
  }>).map((session) => ({
    id: session.id,
    date: session.date,
    type: session.type,
    title: session.title,
    planned_distance: session.planned_distance,
    completed: session.completed,
    status: getSessionExecutionStatus(session),
    completion_source: session.completion_source,
    athlete_id: session.athlete_id,
    athletes: Array.isArray(session.athletes) ? (session.athletes[0] ?? null) : (session.athletes ?? null),
    feedbackSignal: session.feedbacks?.[0]?.signal ?? null,
  }))
  const planningWindow = (planningSessions ?? []) as DashboardWeekSessionRow[]
  const races = (upcomingRaces ?? []) as unknown as DashboardRaceRow[]
  const allInvoiceRows = (invoiceList ?? []) as unknown as DashboardInvoiceRow[]
  const archivedAthleteCount = archivedAthletesCountResult.count ?? 0
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
  const activeCount = allAthletes.length
  const estimatedMonthlyRevenue = allAthletes
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
  const overdueAthleteIds = new Set(
    overdueInvoicesComputed
      .map((invoice) => ('athlete_id' in invoice ? invoice.athlete_id : null))
      .filter((value): value is string => !!value),
  )
  const noPlanAthleteIds = new Set(
    planningWindow
      .filter((session) => session.date > todayStr || (session.date === todayStr && isSessionOpenForExecution(session)))
      .map((session) => session.athlete_id),
  )
  const alertItems: DashboardAlertItem[] = allAthletes
    .filter((athlete) => athlete.status === 'alert' || athlete.status === 'warning')
    .map((athlete) => {
      const reasons: string[] = []
      if (athlete.status === 'alert') reasons.push('Status: kontuzja lub pilny problem')
      if (athlete.status === 'warning') reasons.push('Status: zawodnik pod obserwacją')
      if (unreadRedFeedbackByAthlete[athlete.id] > 0) reasons.push('Czerwony feedback czeka na reakcję')
      if (overdueAthleteIds.has(athlete.id)) reasons.push('Zaległa płatność wymaga kontaktu')
      if (!noPlanAthleteIds.has(athlete.id)) {
        reasons.push('Brak planu do końca tygodnia')
      }
      if (unreadFeedbackByAthlete[athlete.id] > 0) reasons.push(`${unreadFeedbackByAthlete[athlete.id]} nieprzeczytany feedback`)
      if (unreadMessagesByAthlete[athlete.id] > 0) reasons.push(`${unreadMessagesByAthlete[athlete.id]} wiadomość od zawodnika czeka`)

      const uniqueReasons = Array.from(new Set(reasons))
      return {
        athlete,
        primaryReason: uniqueReasons[0] ?? 'Wymaga sprawdzenia',
        extraReasonCount: Math.max(0, uniqueReasons.length - 1),
      }
    })
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
      archivedAthleteCount={archivedAthleteCount}
      pendingAmount={pendingAmount}
      overdueAmount={overdueAmount}
      pendingCount={pendingCount}
      overdueCount={overdueCount}
      raceSoonCount={raceSoonCount}
      alertAthletes={alertItems}
    />
  )
}
