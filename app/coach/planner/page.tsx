import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessToday } from '@/lib/date'
import { PlannerShell } from './_components/PlannerShell'

export const metadata: Metadata = { title: 'Planer | Strefa Trenera' }

export default async function PlannerPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = getBusinessToday()
  const currentMonth = today.slice(0, 7)
  const params = (await searchParams) ?? {}
  const requestedAthleteId = typeof params.athlete === 'string' ? params.athlete : ''

  const { data: athletes } = await supabase
    .from('athletes')
    .select('id, name, avatar, status')
    .eq('coach_id', user.id)
    .neq('status', 'inactive')
    .order('name')

  return (
    <PlannerShell
      athletes={athletes ?? []}
      sessions={[]}
      feedbacks={[]}
      today={today}
      currentMonth={currentMonth}
      requestedAthleteId={requestedAthleteId}
    />
  )
}
