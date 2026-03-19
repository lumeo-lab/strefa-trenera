'use server'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { AUTH_ERROR } from '@/lib/constants'
import { getAthleteFromSession } from '@/lib/athlete-auth'
import { assertCoachOwnsAthlete } from '@/lib/auth-guards'
import { createFeedbackSchema, replyFeedbackSchema, updateFeedbackSchema, validateFormData } from '@/lib/schemas'

const VALID_FEELINGS = ['😫', '😕', '😐', '😊', '🤩', '']
const MAX_NOTES_LENGTH = 2000
const MAX_TRANSCRIPT_LENGTH = 5000

function buildFeedbackFields(formData: FormData) {
  const feeling = formData.get('feeling') as string || ''
  const trainingType = formData.get('training_type') as string || ''
  const distanceKm = formData.get('distance_km') as string || ''
  const durationMin = formData.get('duration_min') as string || ''
  const intensity = formData.get('intensity') as string || ''
  const notes = (formData.get('notes') as string || '').slice(0, MAX_NOTES_LENGTH)
  const voiceTranscript = (formData.get('voice_transcript') as string || '').slice(0, MAX_TRANSCRIPT_LENGTH)

  // Validate feeling emoji
  const validFeeling = VALID_FEELINGS.includes(feeling) ? feeling : ''

  const hasText = !!(feeling || trainingType || distanceKm || durationMin || intensity || notes.trim())
  const hasVoice = !!voiceTranscript.trim()
  const source = hasText && hasVoice ? 'both' : hasVoice ? 'voice' : 'text'

  const feelingSignal: Record<string, string> = {
    '😫': 'red', '😕': 'red', '😐': 'yellow', '😊': 'green', '🤩': 'green',
  }
  const signal = feelingSignal[validFeeling] ?? 'green'

  // Build transcript: structured text parts + optional voice note at the end
  const parts: string[] = []
  if (validFeeling) parts.push(`Samopoczucie: ${validFeeling}`)
  if (trainingType) parts.push(`Typ: ${trainingType}`)
  if (distanceKm) parts.push(`Dystans: ${distanceKm} km`)
  if (durationMin) parts.push(`Czas: ${durationMin} min`)
  if (intensity) parts.push(`Intensywność: ${intensity}`)
  if (notes) parts.push(`Notatka: ${notes}`)
  if (voiceTranscript) parts.push(`Głos: ${voiceTranscript}`)
  const transcript = parts.join(' | ')

  const rawWatchLink = (formData.get('watch_link') as string || '').trim() || null
  let watchLink: string | null = null
  if (rawWatchLink) {
    try {
      const u = new URL(rawWatchLink)
      if (u.protocol === 'http:' || u.protocol === 'https:') watchLink = rawWatchLink
    } catch {
      // invalid URL — ignore
    }
  }

  return { source, signal, transcript, ai_analysis: '', ai_summary: '', watch_link: watchLink }
}

export async function createFeedback(formData: FormData) {
  const parsed = validateFormData(createFeedbackSchema, formData)
  if ('error' in parsed) return parsed
  const { slug, session_id: sessionId, date } = parsed.data

  const athlete = await getAthleteFromSession(slug)
  if (!athlete) return { error: AUTH_ERROR }
  if (sessionId) {
    const { data: session } = await adminClient
      .from('training_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('athlete_id', athlete.id)
      .single()

    if (!session) return { error: 'Nieprawidłowa sesja treningowa' }
  }

  const fields = buildFeedbackFields(formData)

  const { error } = await adminClient.from('feedbacks').insert({
    athlete_id: athlete.id,
    coach_id: athlete.coach_id,
    session_id: sessionId,
    date,
    read: false,
    ...fields,
  })

  if (error) return { error: error.message }

  revalidatePath(`/u/${slug}`)
  revalidatePath('/coach/feedback')
  return { success: true }
}

export async function updateFeedback(formData: FormData) {
  const parsed = validateFormData(updateFeedbackSchema, formData)
  if ('error' in parsed) return parsed
  const { slug, id } = parsed.data

  const athlete = await getAthleteFromSession(slug)
  if (!athlete) return { error: AUTH_ERROR }

  const ownsAthlete = await assertCoachOwnsAthlete(athlete.coach_id, athlete.id)
  if (!ownsAthlete) return { error: AUTH_ERROR }

  const fields = buildFeedbackFields(formData)

  const { error } = await adminClient.from('feedbacks').update(fields)
    .eq('id', id).eq('athlete_id', athlete.id)

  if (error) return { error: error.message }

  revalidatePath(`/u/${slug}`)
  revalidatePath('/coach/feedback')
  return { success: true }
}

export async function markFeedbackRead(id: string, athleteId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const { error } = await supabase
    .from('feedbacks')
    .update({ read: true })
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/coach/feedback')
  if (athleteId) revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true }
}

export async function markFeedbacksReadBulk(ids: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }
  if (ids.length === 0) return { success: true }

  const { error } = await supabase
    .from('feedbacks')
    .update({ read: true })
    .in('id', ids)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/coach/feedback')
  revalidatePath('/coach/athletes')
  return { success: true }
}

export async function replyFeedback(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const parsed = validateFormData(replyFeedbackSchema, formData)
  if ('error' in parsed) return parsed
  const { id, reply, athlete_id: athleteId } = parsed.data

  // Verify coach owns the feedback's athlete
  const ownsAthlete = await assertCoachOwnsAthlete(user.id, athleteId)
  if (!ownsAthlete) return { error: AUTH_ERROR }

  const { error } = await supabase
    .from('feedbacks')
    .update({ coach_reply: reply, read: true })
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/coach/feedback')
  if (athleteId) revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true }
}
