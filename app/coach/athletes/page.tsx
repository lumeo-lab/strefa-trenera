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

  return (
    <AthletesClient
      athletes={athletes ?? []}
      lastSessionMap={lastSessionMap}
    />
  )
}
