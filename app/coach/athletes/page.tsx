import { createClient } from '@/lib/supabase/server'
import { AthletesClient } from './_components/AthletesClient'

export default async function AthletesPage() {
  const supabase = await createClient()

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]

  const [
    { data: athletes },
    { data: lastSessions },
    { data: recentSessions },
    { data: { user } },
  ] = await Promise.all([
    supabase
      .from('athletes')
      .select('id, name, avatar, goal, package, package_price, status, email, phone, slug, join_date, created_at')
      .order('name'),
    supabase
      .from('training_sessions')
      .select('athlete_id, date')
      .eq('completed', true)
      .order('date', { ascending: false }),
    supabase
      .from('training_sessions')
      .select('athlete_id, planned_distance, actual_distance')
      .gte('date', weekAgoStr),
    supabase.auth.getUser(),
  ])

  const { data: packages } = await supabase
    .from('packages')
    .select('id, name, price')
    .eq('coach_id', user!.id)
    .order('name')

  const lastSessionMap: Record<string, string> = {}
  for (const s of lastSessions ?? []) {
    if (!lastSessionMap[s.athlete_id]) lastSessionMap[s.athlete_id] = s.date
  }

  const weeklyLoadMap: Record<string, number> = {}
  for (const s of recentSessions ?? []) {
    const km = s.actual_distance ?? s.planned_distance ?? 0
    weeklyLoadMap[s.athlete_id] = (weeklyLoadMap[s.athlete_id] ?? 0) + km
  }

  return (
    <AthletesClient
      athletes={athletes ?? []}
      lastSessionMap={lastSessionMap}
      weeklyLoadMap={weeklyLoadMap}
      packages={packages ?? []}
    />
  )
}
