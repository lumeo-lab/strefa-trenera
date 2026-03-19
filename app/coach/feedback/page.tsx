import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { FeedbackClient } from './_components/FeedbackClient'

export const metadata: Metadata = { title: 'Feedback | Strefa Trenera' }

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const supabase = await createClient()
  const params = (await searchParams) ?? {}
  const { data: { user } } = await supabase.auth.getUser()
  const coachId = user?.id ?? ''
  const athleteParam = Array.isArray(params.athlete) ? params.athlete[0] : params.athlete
  const filterParam = Array.isArray(params.filter) ? params.filter[0] : params.filter
  const { data: activeAthletes } = await supabase
    .from('athletes')
    .select('id')
    .eq('coach_id', coachId)
    .is('archived_at', null)

  const activeAthleteIds = (activeAthletes ?? []).map((athlete) => athlete.id)

  if (activeAthleteIds.length === 0) {
    return <FeedbackClient feedbacks={[]} />
  }

  const { data: feedbacks } = await supabase
    .from('feedbacks')
    .select(`
      *,
      athletes(id, name, avatar),
      training_sessions(id, title)
    `)
    .eq('coach_id', coachId)
    .in('athlete_id', activeAthleteIds)
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <FeedbackClient
      feedbacks={feedbacks ?? []}
      initialAthleteId={athleteParam ?? ''}
      initialFilter={filterParam ?? 'all'}
    />
  )
}
