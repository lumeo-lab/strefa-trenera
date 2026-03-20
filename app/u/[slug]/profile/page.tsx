import { redirect } from 'next/navigation'
import { getAthleteFromSession } from '@/lib/athlete-auth'
import { getAthleteProfileData } from '@/lib/athlete-data'
import { AthleteProfilePage } from '../_components/AthleteProfilePage'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ProfilePage({ params }: Props) {
  const { slug } = await params
  const athlete = await getAthleteFromSession(slug)

  if (!athlete) {
    redirect(`/u/${slug}?invalid=1`)
  }

  const profile = await getAthleteProfileData(athlete.id)

  if (!profile) {
    redirect(`/u/${slug}`)
  }

  return (
    <AthleteProfilePage
      athlete={athlete}
      profile={profile}
    />
  )
}
