import { redirect } from 'next/navigation'
import { getAthleteFromSession } from '@/lib/athlete-auth'
import { adminClient } from '@/lib/supabase/admin'
import { AthleteChatPage } from '../_components/AthleteChatPage'

export default async function AthleteChatRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const athlete = await getAthleteFromSession(slug)

  if (!athlete) {
    redirect(`/u/${slug}`)
  }

  const { data: messages } = await adminClient
    .from('messages')
    .select('*')
    .eq('athlete_id', athlete.id)
    .order('created_at', { ascending: true })

  const { data: coach } = await adminClient
    .from('coaches')
    .select('name')
    .eq('id', athlete.coach_id)
    .single()

  return (
    <AthleteChatPage
      athlete={athlete}
      messages={messages ?? []}
      coachName={coach?.name ?? 'Trener'}
    />
  )
}
