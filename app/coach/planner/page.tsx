import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PlannerClient } from './_components/PlannerClient'

export const metadata: Metadata = { title: 'Planer | Strefa Trenera' }

export default async function PlannerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: athletes }, { data: sessions }] = await Promise.all([
    supabase
      .from('athletes')
      .select('id, name, avatar, status')
      .eq('coach_id', user.id)
      .neq('status', 'inactive')
      .order('name'),
    supabase
      .from('training_sessions')
      .select('id, athlete_id, date, type, title, description, planned_distance, planned_duration, planned_pace, completed')
      .eq('coach_id', user.id),
  ])

  return <PlannerClient athletes={athletes ?? []} sessions={sessions ?? []} />
}
