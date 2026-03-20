import { redirect } from 'next/navigation'
import { getAthleteFromSession } from '@/lib/athlete-auth'
import { getAthleteInjuries } from '@/lib/athlete-data'
import { AthleteInjuriesPage } from '../_components/AthleteInjuriesPage'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function InjuriesPage({ params }: Props) {
  const { slug } = await params
  const athlete = await getAthleteFromSession(slug)

  if (!athlete) redirect(`/u/${slug}?invalid=1`)

  const injuries = await getAthleteInjuries(athlete.id)

  return <AthleteInjuriesPage athlete={athlete} injuries={injuries} />
}
