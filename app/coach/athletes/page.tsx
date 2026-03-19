import type { Metadata } from 'next'
import { addDaysToBusinessDate, getBusinessToday } from '@/lib/date'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_STATUSES } from '@/lib/athlete-status-defs'
import { buildMetricMapsFromFallback } from '@/lib/athlete-list-metrics'
import { AthletesClient } from './_components/AthletesClient'

export const metadata: Metadata = { title: 'Zawodnicy | Strefa Trenera' }

export default async function AthletesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const today = getBusinessToday()
  const weekAgoStr = addDaysToBusinessDate(today, -7)
  const monthAgoStr = addDaysToBusinessDate(today, -30)

  if (!user) {
    return <AthletesClient coachId="" athletes={[]} lastSessionMap={{}} weeklyLoadMap={{}} weeklySessionCountMap={{}} nextRaceMap={{}} packages={[]} signalMap={{}} lastFeedbackDateMap={{}} nextSessionMap={{}} unreadMessagesMap={{}} unreadFeedbackMap={{}} complianceMap={{}} unpaidInvoiceSet={{}} initialStatuses={DEFAULT_STATUSES.map((status) => ({ ...status }))} />
  }

  const coachId = user.id
  const [{ data: packages }, { data: statusDefs }] = await Promise.all([
    supabase
      .from('packages')
      .select('id, name, price')
      .eq('coach_id', coachId)
      .order('name'),
    supabase
      .from('coach_athlete_statuses')
      .select('key, label, color, is_builtin, position')
      .eq('coach_id', coachId)
      .order('position', { ascending: true }),
  ])

  let athletes:
    | Array<{
      id: string
      athlete_order?: number
      name: string
      avatar: string
      goal: string
      package: string
      package_price: number
      status: string
      email: string | null
      phone: string | null
      slug: string
      join_date: string
      created_at: string
      age: number | null
      city: string | null
    }>
    | null = null

  const athletesWithArchive = await supabase
    .from('athletes')
    .select('id, athlete_order, name, avatar, goal, package, package_price, status, email, phone, slug, join_date, created_at, age, city')
    .eq('coach_id', coachId)
    .is('archived_at', null)
    .order('athlete_order', { ascending: true })
    .order('name', { ascending: true })

  if (athletesWithArchive.error) {
    const fallbackAthletes = await supabase
      .from('athletes')
      .select('id, name, avatar, goal, package, package_price, status, email, phone, slug, join_date, created_at, age, city')
      .eq('coach_id', coachId)
      .order('name', { ascending: true })

    athletes = (fallbackAthletes.data ?? []).map((athlete, index) => ({ ...athlete, athlete_order: index }))
  } else {
    athletes = athletesWithArchive.data ?? []
  }

  const metricsResult = await supabase.rpc('coach_athlete_list_metrics', {
    p_coach_id: coachId,
    p_today: today,
    p_week_start: weekAgoStr,
    p_month_start: monthAgoStr,
  })

  const lastSessionMap: Record<string, { date: string; type: string; title: string }> = {}
  const weeklyLoadMap: Record<string, number> = {}
  const weeklySessionCountMap: Record<string, number> = {}
  const nextRaceMap: Record<string, { name: string; date: string; distance: string | null }> = {}
  const signalMap: Record<string, string> = {}
  const lastFeedbackDateMap: Record<string, string> = {}
  const unreadFeedbackMap: Record<string, number> = {}
  const nextSessionMap: Record<string, { date: string; type: string; title: string }> = {}
  const unreadMessagesMap: Record<string, number> = {}
  const complianceMap: Record<string, { completed: number; total: number }> = {}
  const unpaidInvoiceSet: Record<string, boolean> = {}

  if (metricsResult.error) {
    const [
      { data: lastSessions },
      { data: recentSessions },
      { data: allFeedbacks },
      { data: upcomingSessions },
      { data: unreadMsgs },
      { data: monthSessions },
      { data: unpaidInvoices },
      { data: upcomingRaces },
    ] = await Promise.all([
      supabase.from('training_sessions').select('athlete_id, date, type, title').eq('coach_id', coachId).eq('completed', true).order('date', { ascending: false }),
      supabase.from('training_sessions').select('athlete_id, planned_distance, actual_distance').eq('coach_id', coachId).gte('date', weekAgoStr).eq('completed', true),
      supabase.from('feedbacks').select('athlete_id, signal, created_at, read').eq('coach_id', coachId).order('created_at', { ascending: false }),
      supabase.from('training_sessions').select('athlete_id, date, type, title').eq('coach_id', coachId).gte('date', today).eq('completed', false).order('date', { ascending: true }),
      supabase.from('messages').select('athlete_id').eq('coach_id', coachId).eq('sender_type', 'athlete').eq('read', false),
      supabase.from('training_sessions').select('athlete_id, completed').eq('coach_id', coachId).gte('date', monthAgoStr).lte('date', today),
      supabase.from('invoices').select('athlete_id').eq('coach_id', coachId).in('status', ['pending', 'overdue']),
      supabase.from('athlete_races').select('athlete_id, name, date, distance').eq('coach_id', coachId).eq('status', 'planned').gte('date', today).order('date', { ascending: true }),
    ])

    const fallback = buildMetricMapsFromFallback({ lastSessions, recentSessions, allFeedbacks, upcomingSessions, unreadMsgs, monthSessions, unpaidInvoices, upcomingRaces })
    Object.assign(lastSessionMap, fallback.lastSessionMap)
    Object.assign(weeklyLoadMap, fallback.weeklyLoadMap)
    Object.assign(weeklySessionCountMap, fallback.weeklySessionCountMap)
    Object.assign(nextRaceMap, fallback.nextRaceMap)
    Object.assign(signalMap, fallback.signalMap)
    Object.assign(lastFeedbackDateMap, fallback.lastFeedbackDateMap)
    Object.assign(unreadFeedbackMap, fallback.unreadFeedbackMap)
    Object.assign(nextSessionMap, fallback.nextSessionMap)
    Object.assign(unreadMessagesMap, fallback.unreadMessagesMap)
    Object.assign(complianceMap, fallback.complianceMap)
    Object.assign(unpaidInvoiceSet, fallback.unpaidInvoiceSet)
  } else {
    for (const row of metricsResult.data ?? []) {
      if (row.last_session_date) {
        lastSessionMap[row.athlete_id] = {
          date: row.last_session_date,
          type: row.last_session_type,
          title: row.last_session_title,
        }
      }
      if (row.next_session_date) {
        nextSessionMap[row.athlete_id] = {
          date: row.next_session_date,
          type: row.next_session_type,
          title: row.next_session_title,
        }
      }
      if (row.weekly_load) weeklyLoadMap[row.athlete_id] = Number(row.weekly_load)
      if (row.weekly_session_count) weeklySessionCountMap[row.athlete_id] = row.weekly_session_count
      if (row.signal) signalMap[row.athlete_id] = row.signal
      if (row.last_feedback_date) lastFeedbackDateMap[row.athlete_id] = row.last_feedback_date
      if (row.unread_feedback_count) unreadFeedbackMap[row.athlete_id] = row.unread_feedback_count
      if (row.unread_message_count) unreadMessagesMap[row.athlete_id] = row.unread_message_count
      if (row.compliance_total) {
        complianceMap[row.athlete_id] = {
          completed: row.compliance_completed ?? 0,
          total: row.compliance_total,
        }
      }
      if (row.has_unpaid_invoice) unpaidInvoiceSet[row.athlete_id] = true
    }

    const { data: upcomingRaces } = await supabase
      .from('athlete_races')
      .select('athlete_id, name, date, distance')
      .eq('coach_id', coachId)
      .eq('status', 'planned')
      .gte('date', today)
      .order('date', { ascending: true })

    for (const race of upcomingRaces ?? []) {
      if (!nextRaceMap[race.athlete_id]) {
        nextRaceMap[race.athlete_id] = { name: race.name, date: race.date, distance: race.distance }
      }
    }
  }

  return (
    <AthletesClient
      coachId={coachId}
      athletes={(athletes ?? []).map((athlete, index) => ({
        ...athlete,
        athlete_order: athlete.athlete_order ?? index,
      }))}
      lastSessionMap={lastSessionMap}
      weeklyLoadMap={weeklyLoadMap}
      weeklySessionCountMap={weeklySessionCountMap}
      nextRaceMap={nextRaceMap}
      packages={packages ?? []}
      signalMap={signalMap}
      lastFeedbackDateMap={lastFeedbackDateMap}
      nextSessionMap={nextSessionMap}
      unreadMessagesMap={unreadMessagesMap}
      unreadFeedbackMap={unreadFeedbackMap}
      complianceMap={complianceMap}
      unpaidInvoiceSet={unpaidInvoiceSet}
      initialStatuses={(statusDefs?.length ? statusDefs : DEFAULT_STATUSES).map((status) => ({
        key: status.key,
        label: status.label,
        color: status.color ?? '#6B7280',
      }))}
    />
  )
}
