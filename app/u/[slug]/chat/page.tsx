import { redirect } from 'next/navigation'
import { getAthleteFromSession } from '@/lib/athlete-auth'
import { getAthleteChatData } from '@/lib/athlete-data'
import { AthleteChatPage } from '../_components/AthleteChatPage'

export default async function AthleteChatRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const athlete = await getAthleteFromSession(slug)

  if (!athlete) {
    redirect(`/u/${slug}`)
  }

  const { messages, coachName } = await getAthleteChatData(athlete.id, athlete.coach_id)

  return (
    <AthleteChatPage
      athlete={athlete}
      messages={messages}
      coachName={coachName}
    />
  )
}
