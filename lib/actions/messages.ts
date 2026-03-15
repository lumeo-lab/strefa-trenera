'use server'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { AUTH_ERROR, FIELDS_ERROR } from '@/lib/constants'
import { getAthleteFromSession } from '@/lib/athlete-auth'

function firePush(userId: string, payload: { title: string; body: string; url: string }) {
  // Fire-and-forget — błąd push nigdy nie blokuje wysyłania wiadomości
  import('@/lib/push')
    .then(({ sendPushToUser }) => sendPushToUser(userId, payload))
    .catch(() => {})
}

export async function sendAthleteMessage(slug: string, content: string) {
  const athlete = await getAthleteFromSession(slug)
  if (!athlete) return { error: AUTH_ERROR }

  const { error } = await adminClient.from('messages').insert({
    coach_id: athlete.coach_id,
    athlete_id: athlete.id,
    sender_type: 'athlete',
    content: content.trim(),
  })
  if (error) return { error: error.message }

  firePush(athlete.coach_id, {
    title: `Wiadomość od ${athlete.name}`,
    body: content.trim().slice(0, 100),
    url: '/coach/chat',
  })

  return { success: true }
}

export async function sendMessage(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const athleteId = formData.get('athlete_id') as string
  const content = formData.get('content') as string
  const coachName = formData.get('coach_name') as string

  if (!athleteId || !content?.trim()) return { error: FIELDS_ERROR }

  const { error } = await supabase.from('messages').insert({
    coach_id: user.id,
    athlete_id: athleteId,
    sender_type: 'coach',
    content: content.trim(),
  })
  if (error) return { error: error.message }

  firePush(athleteId, {
    title: `Wiadomość od ${coachName || 'trenera'}`,
    body: content.trim().slice(0, 100),
    url: '/u',
  })

  revalidatePath('/coach/chat')
  return { success: true }
}
