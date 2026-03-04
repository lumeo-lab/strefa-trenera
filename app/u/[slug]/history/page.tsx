import { redirect } from 'next/navigation'
import { getAthleteFromSession } from '@/lib/athlete-auth'
import { adminClient } from '@/lib/supabase/admin'
import { AthleteHistoryPage } from '../_components/AthleteHistoryPage'

export default async function HistoryPage({ params, searchParams }: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ strava?: string }>
}) {
  const { slug } = await params
  const { strava } = await searchParams
  const athlete = await getAthleteFromSession(slug)

  if (!athlete) redirect(`/u/${slug}`)

  const [{ data: sessions }, { data: stravaConn }, { data: stravaActivities }] = await Promise.all([
    adminClient.from('training_sessions').select('*').eq('athlete_id', athlete.id).eq('completed', true).order('date', { ascending: false }).limit(50),
    adminClient.from('strava_connections').select('connected_at').eq('athlete_id', athlete.id).single(),
    adminClient.from('strava_activities').select('*').eq('athlete_id', athlete.id).order('start_date', { ascending: false }).limit(50),
  ])

  return (
    <AthleteHistoryPage
      athlete={athlete}
      sessions={sessions ?? []}
      stravaConnected={!!stravaConn}
      stravaActivities={stravaActivities ?? []}
      stravaStatus={strava}
    />
  )
}
