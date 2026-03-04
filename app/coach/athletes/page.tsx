import { createClient } from '@/lib/supabase/server'
import { AthletesClient } from './_components/AthletesClient'

export default async function AthletesPage() {
  const supabase = await createClient()

  const { data: athletes } = await supabase
    .from('athletes')
    .select(`
      id, name, avatar, goal, package, package_price,
      status, email, phone, slug, join_date, created_at
    `)
    .order('name')

  // Get last completed session per athlete
  const { data: lastSessions } = await supabase
    .from('training_sessions')
    .select('athlete_id, date')
    .eq('completed', true)
    .order('date', { ascending: false })

  const lastSessionMap: Record<string, string> = {}
  for (const s of lastSessions ?? []) {
    if (!lastSessionMap[s.athlete_id]) {
      lastSessionMap[s.athlete_id] = s.date
    }
  }

  // Weekly load: total planned km from last 7 days per athlete
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]

  const { data: recentSessions } = await supabase
    .from('training_sessions')
    .select('athlete_id, planned_distance, actual_distance')
    .gte('date', weekAgoStr)

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
    />
  )
}
