'use server'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { AUTH_ERROR, FIELDS_ERROR } from '@/lib/constants'
import { getAthleteFromSession } from '@/lib/athlete-auth'
import { assertCoachOwnsAthlete } from '@/lib/auth-guards'
import { sendMessageSchema, validateFormData } from '@/lib/schemas'

function firePush(userId: string, payload: { title: string; body: string; url: string }) {
  // Fire-and-forget — błąd push nigdy nie blokuje wysyłania wiadomości
  import('@/lib/push')
    .then(({ sendPushToUser }) => sendPushToUser(userId, payload))
    .catch((e) => console.error('[push] send failed:', e))
}

export async function sendAthleteMessage(slug: string, content: string) {
  const athlete = await getAthleteFromSession(slug)
  if (!athlete) return { error: AUTH_ERROR }

  const trimmed = content.trim().slice(0, 5000)
  if (!trimmed) return { error: FIELDS_ERROR }

  const { error } = await adminClient.from('messages').insert({
    coach_id: athlete.coach_id,
    athlete_id: athlete.id,
    sender_type: 'athlete',
    content: trimmed,
  })
  if (error) return { error: error.message }

  firePush(athlete.coach_id, {
    title: `Wiadomość od ${athlete.name}`,
    body: trimmed.slice(0, 100),
    url: '/coach/chat',
  })

  return { success: true }
}

export async function sendMessage(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const parsed = validateFormData(sendMessageSchema, formData)
  if ('error' in parsed) return parsed
  const { athlete_id: athleteId, content, coach_name: coachName } = parsed.data

  const ownsAthlete = await assertCoachOwnsAthlete(user.id, athleteId)
  if (!ownsAthlete) return { error: AUTH_ERROR }

  const { error } = await supabase.from('messages').insert({
    coach_id: user.id,
    athlete_id: athleteId,
    sender_type: 'coach',
    content,
  })
  if (error) return { error: error.message }

  firePush(athleteId, {
    title: `Wiadomość od ${coachName || 'trenera'}`,
    body: content.slice(0, 100),
    url: '/u',
  })

  revalidatePath('/coach/chat')
  return { success: true }
}

export async function markCoachThreadRead(athleteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }
  if (!athleteId) return { error: FIELDS_ERROR }

  const ownsAthlete = await assertCoachOwnsAthlete(user.id, athleteId)
  if (!ownsAthlete) return { error: AUTH_ERROR }

  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('coach_id', user.id)
    .eq('athlete_id', athleteId)
    .eq('sender_type', 'athlete')
    .eq('read', false)

  if (error) return { error: error.message }

  revalidatePath('/coach/chat')
  revalidatePath('/coach/athletes')
  revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true }
}
