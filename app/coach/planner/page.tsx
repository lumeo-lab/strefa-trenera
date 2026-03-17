import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessToday } from '@/lib/date'
import { PlannerShell } from './_components/PlannerShell'

export const metadata: Metadata = { title: 'Planer | Strefa Trenera' }

export default async function PlannerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = getBusinessToday()
  const currentMonth = today.slice(0, 7)

  const [{ data: athletes }, { data: sessions }, { data: feedbacks }] = await Promise.all([
    supabase
      .from('athletes')
      .select('id, name, avatar, status')
      .eq('coach_id', user.id)
      .neq('status', 'inactive')
      .order('name'),
    supabase
      .from('training_sessions')
      .select('*')
      .eq('coach_id', user.id)
      .order('date', { ascending: false })
      .limit(500),
    supabase
      .from('feedbacks')
      .select('*')
      .eq('coach_id', user.id)
      .order('date', { ascending: false })
      .limit(500),
  ])

  return (
    <PlannerShell
      athletes={athletes ?? []}
      sessions={sessions ?? []}
      feedbacks={feedbacks ?? []}
      today={today}
      currentMonth={currentMonth}
    />
  )
}
