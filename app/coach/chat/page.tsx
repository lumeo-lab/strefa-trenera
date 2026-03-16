import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ChatClient } from './_components/ChatClient'

export const metadata: Metadata = { title: 'Czat | Strefa Trenera' }

export default async function CoachChatPage({ searchParams }: { searchParams: Promise<{ athlete?: string }> }) {
  const supabase = await createClient()
  const params = await searchParams

  const [{ data: { user } }, { data: coach }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('coaches').select('name').single(),
  ])

  const coachId = user?.id ?? ''

  const [{ data: athletes }, { data: messages }] = await Promise.all([
    supabase.from('athletes').select('id, name, avatar, goal, package, slug').eq('coach_id', coachId).order('name'),
    supabase.from('messages').select('id, coach_id, athlete_id, sender_type, content, read, created_at').eq('coach_id', coachId).order('created_at', { ascending: true }).limit(500),
  ])

  return (
    <ChatClient
      athletes={athletes ?? []}
      messages={messages ?? []}
      coachId={user?.id ?? ''}
      coachName={coach?.name ?? ''}
      initialAthleteId={params.athlete}
    />
  )
}
