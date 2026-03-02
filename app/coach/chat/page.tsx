import { createClient } from '@/lib/supabase/server'
import { ChatClient } from './_components/ChatClient'

export default async function CoachChatPage() {
  const supabase = await createClient()

  const [{ data: athletes }, { data: messages }] = await Promise.all([
    supabase
      .from('athletes')
      .select('id, name, avatar, goal, package, slug')
      .order('name'),
    supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true }),
  ])

  return <ChatClient athletes={athletes ?? []} messages={messages ?? []} />
}
