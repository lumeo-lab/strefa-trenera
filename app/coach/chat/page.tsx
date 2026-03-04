import { createClient } from '@/lib/supabase/server'
import { ChatClient } from './_components/ChatClient'

export default async function CoachChatPage() {
  const supabase = await createClient()

  const [{ data: { user } }, { data: athletes }, { data: messages }, { data: coach }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('athletes').select('id, name, avatar, goal, package, slug').order('name'),
    supabase.from('messages').select('*').order('created_at', { ascending: true }),
    supabase.from('coaches').select('name').single(),
  ])

  return (
    <ChatClient
      athletes={athletes ?? []}
      messages={messages ?? []}
      coachId={user?.id ?? ''}
      coachName={coach?.name ?? ''}
    />
  )
}
