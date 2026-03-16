import type { Metadata } from 'next'
import { addDaysToBusinessDate, getBusinessToday } from '@/lib/date'
import { createClient } from '@/lib/supabase/server'
import { AthletesClient } from './_components/AthletesClient'

export const metadata: Metadata = { title: 'Zawodnicy | Strefa Trenera' }

export default async function AthletesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const today = getBusinessToday()
  const weekAgoStr = addDaysToBusinessDate(today, -7)
  const monthAgoStr = addDaysToBusinessDate(today, -30)

  if (!user) return <AthletesClient athletes={[]} lastSessionMap={{}} weeklyLoadMap={{}} weeklySessionCountMap={{}} packages={[]} signalMap={{}} lastFeedbackDateMap={{}} nextSessionMap={{}} unreadMessagesMap={{}} unreadFeedbackMap={{}} complianceMap={{}} unpaidInvoiceSet={{}} />

  const coachId = user.id

  const [
    { data: athletes },
    { data: lastSessions },
    { data: recentSessions },
    { data: allFeedbacks },
    { data: upcomingSessions },
    { data: unreadMsgs },
    { data: monthSessions },
    { data: unpaidInvoices },
    { data: packages },
  ] = await Promise.all([
    supabase
      .from('athletes')
      .select('id, name, avatar, goal, package, package_price, status, email, phone, slug, join_date, created_at, age, city')
      .eq('coach_id', coachId)
      .order('name'),
    supabase
      .from('training_sessions')
      .select('athlete_id, date')
      .eq('coach_id', coachId)
      .eq('completed', true)
      .order('date', { ascending: false })
      .limit(200),
    supabase
      .from('training_sessions')
      .select('athlete_id, planned_distance, actual_distance')
      .eq('coach_id', coachId)
      .gte('date', weekAgoStr)
      .eq('completed', true),
    supabase
      .from('feedbacks')
      .select('athlete_id, signal, created_at, read')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('training_sessions')
      .select('athlete_id, date, type, title')
      .eq('coach_id', coachId)
      .gte('date', today)
      .eq('completed', false)
      .order('date', { ascending: true }),
    supabase
      .from('messages')
      .select('athlete_id')
      .eq('coach_id', coachId)
      .eq('sender_type', 'athlete')
      .eq('read', false),
    supabase
      .from('training_sessions')
      .select('athlete_id, completed')
      .eq('coach_id', coachId)
      .gte('date', monthAgoStr)
      .lte('date', today),
    supabase
      .from('invoices')
      .select('athlete_id')
      .eq('coach_id', coachId)
      .in('status', ['pending', 'overdue']),
    supabase
      .from('packages')
      .select('id, name, price')
      .eq('coach_id', coachId)
      .order('name'),
  ])

  const lastSessionMap: Record<string, string> = {}
  for (const s of lastSessions ?? []) {
    if (!lastSessionMap[s.athlete_id]) lastSessionMap[s.athlete_id] = s.date
  }

  const weeklyLoadMap: Record<string, number> = {}
  const weeklySessionCountMap: Record<string, number> = {}
  for (const s of recentSessions ?? []) {
    const km = s.actual_distance ?? s.planned_distance ?? 0
    weeklyLoadMap[s.athlete_id] = (weeklyLoadMap[s.athlete_id] ?? 0) + km
    weeklySessionCountMap[s.athlete_id] = (weeklySessionCountMap[s.athlete_id] ?? 0) + 1
  }

  const signalMap: Record<string, string> = {}
  const lastFeedbackDateMap: Record<string, string> = {}
  const unreadFeedbackMap: Record<string, number> = {}
  for (const f of allFeedbacks ?? []) {
    if (!signalMap[f.athlete_id]) {
      signalMap[f.athlete_id] = f.signal
      lastFeedbackDateMap[f.athlete_id] = f.created_at
    }
    if (!f.read) {
      unreadFeedbackMap[f.athlete_id] = (unreadFeedbackMap[f.athlete_id] ?? 0) + 1
    }
  }

  const nextSessionMap: Record<string, { date: string; type: string; title: string }> = {}
  for (const s of upcomingSessions ?? []) {
    if (!nextSessionMap[s.athlete_id]) nextSessionMap[s.athlete_id] = { date: s.date, type: s.type, title: s.title }
  }

  const unreadMessagesMap: Record<string, number> = {}
  for (const m of unreadMsgs ?? []) {
    unreadMessagesMap[m.athlete_id] = (unreadMessagesMap[m.athlete_id] ?? 0) + 1
  }

  const complianceMap: Record<string, { completed: number; total: number }> = {}
  for (const s of monthSessions ?? []) {
    if (!complianceMap[s.athlete_id]) complianceMap[s.athlete_id] = { completed: 0, total: 0 }
    complianceMap[s.athlete_id].total++
    if (s.completed) complianceMap[s.athlete_id].completed++
  }

  const unpaidInvoiceSet: Record<string, boolean> = {}
  for (const inv of unpaidInvoices ?? []) {
    unpaidInvoiceSet[inv.athlete_id] = true
  }

  return (
    <AthletesClient
      athletes={athletes ?? []}
      lastSessionMap={lastSessionMap}
      weeklyLoadMap={weeklyLoadMap}
      weeklySessionCountMap={weeklySessionCountMap}
      packages={packages ?? []}
      signalMap={signalMap}
      lastFeedbackDateMap={lastFeedbackDateMap}
      nextSessionMap={nextSessionMap}
      unreadMessagesMap={unreadMessagesMap}
      unreadFeedbackMap={unreadFeedbackMap}
      complianceMap={complianceMap}
      unpaidInvoiceSet={unpaidInvoiceSet}
    />
  )
}
