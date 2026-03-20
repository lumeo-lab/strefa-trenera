import { redirect } from 'next/navigation'
import { getAthleteFromSession } from '@/lib/athlete-auth'
import { getAthleteRaces } from '@/lib/athlete-data'
import { AthleteRacesPage } from '../_components/AthleteRacesPage'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function RacesPage({ params }: Props) {
  const { slug } = await params
  const athlete = await getAthleteFromSession(slug)

  if (!athlete) redirect(`/u/${slug}?invalid=1`)

  const races = await getAthleteRaces(athlete.id)

  return <AthleteRacesPage athlete={athlete} races={races} />
}
