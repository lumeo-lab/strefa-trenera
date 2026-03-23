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
  // Deep link params: view, sort, highlight are read client-side via useSearchParams
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
      training_sessions(id, title, linked_strava_activity_id, actual_distance, actual_duration, actual_pace, avg_hr, max_hr)
    `)
    .eq('coach_id', coachId)
    .in('athlete_id', activeAthleteIds)
    .order('created_at', { ascending: false })
    .limit(200)

  // Fetch Strava data for sessions that have a linked activity
  const stravaIds = (feedbacks ?? [])
    .map(f => f.training_sessions?.linked_strava_activity_id)
    .filter((id): id is number => id != null)

  const uniqueStravaIds = [...new Set(stravaIds)]

  let stravaMap = new Map<number, {
    distance: number | null
    moving_time: number | null
    average_speed: number | null
    average_heartrate: number | null
    max_heartrate: number | null
    total_elevation_gain: number | null
  }>()

  if (uniqueStravaIds.length > 0) {
    const { data: stravaActivities } = await supabase
      .from('strava_activities')
      .select('strava_id, distance, moving_time, average_speed, average_heartrate, max_heartrate, total_elevation_gain')
      .in('strava_id', uniqueStravaIds)

    if (stravaActivities) {
      stravaMap = new Map(stravaActivities.map(a => [a.strava_id, a]))
    }
  }

  // Merge strava data into feedbacks
  const enrichedFeedbacks = (feedbacks ?? []).map(f => {
    const stravaId = f.training_sessions?.linked_strava_activity_id
    const strava = stravaId ? stravaMap.get(stravaId) ?? null : null
    return { ...f, strava_data: strava }
  })

  return (
    <FeedbackClient
      feedbacks={enrichedFeedbacks}
      initialAthleteId={athleteParam ?? ''}
      initialFilter={filterParam ?? 'all'}
    />
  )
}
