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

  // Load athletes + lightweight thread summaries (last message + unread count per athlete)
  const [{ data: athletes }, { data: lastMessages }, { data: unreadCounts }] = await Promise.all([
    supabase.from('athletes').select('id, name, avatar, goal, package, slug').eq('coach_id', coachId).order('name'),
    // Get the most recent message per athlete using a raw approach:
    // Fetch recent messages and let client dedupe per athlete
    supabase.from('messages')
      .select('id, athlete_id, sender_type, content, created_at')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false })
      .limit(200),
    // Unread counts per athlete — fetch unread athlete messages
    supabase.from('messages')
      .select('athlete_id')
      .eq('coach_id', coachId)
      .eq('sender_type', 'athlete')
      .eq('read', false),
  ])

  // Build thread summaries
  const lastMessageByAthlete = new Map<string, { id: string; sender_type: string; content: string; created_at: string }>()
  for (const m of lastMessages ?? []) {
    if (!lastMessageByAthlete.has(m.athlete_id)) {
      lastMessageByAthlete.set(m.athlete_id, m)
    }
  }

  const unreadByAthlete = new Map<string, number>()
  for (const m of unreadCounts ?? []) {
    unreadByAthlete.set(m.athlete_id, (unreadByAthlete.get(m.athlete_id) ?? 0) + 1)
  }

  const threadSummaries = (athletes ?? []).map(a => ({
    athlete: a,
    lastMessage: lastMessageByAthlete.get(a.id) ?? null,
    unreadCount: unreadByAthlete.get(a.id) ?? 0,
  }))

  return (
    <ChatClient
      threadSummaries={threadSummaries}
      coachId={coachId}
      coachName={coach?.name ?? ''}
      initialAthleteId={params.athlete}
    />
  )
}
