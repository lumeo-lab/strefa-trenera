import { redirect } from 'next/navigation'
import { getAthleteFromSession } from '@/lib/athlete-auth'
import { getAthleteHistoryData } from '@/lib/athlete-data'
import { AthleteHistoryPage } from '../_components/AthleteHistoryPage'

export default async function HistoryPage({ params, searchParams }: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ strava?: string; msg?: string }>
}) {
  const { slug } = await params
  const { strava, msg: stravaMsg } = await searchParams
  const athlete = await getAthleteFromSession(slug)

  if (!athlete) redirect(`/u/${slug}`)

  const { sessions, stravaConnected, stravaActivities } = await getAthleteHistoryData(athlete.id)

  return (
    <AthleteHistoryPage
      athlete={athlete}
      sessions={sessions}
      stravaConnected={stravaConnected}
      stravaActivities={stravaActivities}
      stravaStatus={strava}
      stravaMsg={stravaMsg}
    />
  )
}
