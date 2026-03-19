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
    supabase.from('training_sessions').select('athlete_id, date, type, title, status, completed').eq('coach_id', coachId).in('status', ['completed', 'detected']).order('date', { ascending: false }),
    supabase.from('training_sessions').select('athlete_id, planned_distance, actual_distance, status, completed').eq('coach_id', coachId).gte('date', weekAgoStr).in('status', ['completed', 'detected']),
    supabase.from('feedbacks').select('athlete_id, signal, created_at, read').eq('coach_id', coachId).order('created_at', { ascending: false }),
    supabase.from('training_sessions').select('athlete_id, date, type, title, status, completed').eq('coach_id', coachId).gte('date', today).order('date', { ascending: true }),
    supabase.from('messages').select('athlete_id').eq('coach_id', coachId).eq('sender_type', 'athlete').eq('read', false),
    supabase.from('training_sessions').select('athlete_id, date, completed, status').eq('coach_id', coachId).gte('date', monthAgoStr).lte('date', today),
    supabase.from('invoices').select('athlete_id').eq('coach_id', coachId).in('status', ['pending', 'overdue']),
    supabase.from('athlete_races').select('athlete_id, name, date, distance').eq('coach_id', coachId).eq('status', 'planned').gte('date', today).order('date', { ascending: true }),
  ])

  const fallback = buildMetricMapsFromFallback({ lastSessions, recentSessions, allFeedbacks, upcomingSessions, unreadMsgs, monthSessions, unpaidInvoices, upcomingRaces, today })
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
