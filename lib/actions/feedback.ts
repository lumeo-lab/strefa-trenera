'use server'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { AUTH_ERROR, FIELDS_ERROR } from '@/lib/constants'

function buildFeedbackFields(formData: FormData) {
  const feeling = formData.get('feeling') as string || ''
  const trainingType = formData.get('training_type') as string || ''
  const distanceKm = formData.get('distance_km') as string || ''
  const durationMin = formData.get('duration_min') as string || ''
  const intensity = formData.get('intensity') as string || ''
  const notes = formData.get('notes') as string || ''
  const voiceTranscript = formData.get('voice_transcript') as string || ''

  const hasText = !!(feeling || trainingType || distanceKm || durationMin || intensity || notes.trim())
  const hasVoice = !!voiceTranscript.trim()
  const source = hasText && hasVoice ? 'both' : hasVoice ? 'voice' : 'text'

  const feelingSignal: Record<string, string> = {
    '😫': 'red', '😕': 'red', '😐': 'yellow', '😊': 'green', '🤩': 'green',
  }
  const signal = feelingSignal[feeling] ?? 'green'

  // transcript = structured text summary; ai_analysis = voice transcript
  let transcript = ''
  if (hasText) {
    const parts = []
    if (feeling) parts.push(`Samopoczucie: ${feeling}`)
    if (trainingType) parts.push(`Typ: ${trainingType}`)
    if (distanceKm) parts.push(`Dystans: ${distanceKm} km`)
    if (durationMin) parts.push(`Czas: ${durationMin} min`)
    if (intensity) parts.push(`Intensywność: ${intensity}`)
    if (notes) parts.push(`Notatka: ${notes}`)
    transcript = parts.join(' | ')
  }

  const aiSummary = feeling
    ? `${feeling} — ${intensity || trainingType || 'trening'}`
    : (trainingType || (hasVoice ? 'Feedback głosowy' : 'Feedback'))

  const watchLink = (formData.get('watch_link') as string || '').trim() || null

  return { source, signal, transcript, ai_analysis: voiceTranscript, ai_summary: aiSummary, watch_link: watchLink }
}

export async function createFeedback(formData: FormData) {
  const athleteId = formData.get('athlete_id') as string
  const coachId = formData.get('coach_id') as string
  const sessionId = formData.get('session_id') as string || null
  const date = formData.get('date') as string

  if (!athleteId || !coachId || !date) return { error: 'Brak wymaganych danych' }

  const fields = buildFeedbackFields(formData)

  const { error } = await adminClient.from('feedbacks').insert({
    athlete_id: athleteId,
    coach_id: coachId,
    session_id: sessionId,
    date,
    read: false,
    ...fields,
  })

  if (error) return { error: error.message }

  revalidatePath(`/u/${formData.get('slug')}`)
  revalidatePath('/coach/feedback')
  return { success: true }
}

export async function updateFeedback(formData: FormData) {
  const id = formData.get('id') as string
  const athleteId = formData.get('athlete_id') as string

  if (!id || !athleteId) return { error: 'Brak wymaganych danych' }

  const fields = buildFeedbackFields(formData)

  const { error } = await adminClient.from('feedbacks').update(fields)
    .eq('id', id).eq('athlete_id', athleteId)

  if (error) return { error: error.message }

  revalidatePath(`/u/${formData.get('slug')}`)
  revalidatePath('/coach/feedback')
  return { success: true }
}

export async function markFeedbackRead(id: string, athleteId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  await supabase
    .from('feedbacks')
    .update({ read: true })
    .eq('id', id)
    .eq('coach_id', user.id)

  revalidatePath('/coach/feedback')
  if (athleteId) revalidatePath(`/coach/athletes/${athleteId}`)
}

export async function replyFeedback(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const id = formData.get('id') as string
  const reply = formData.get('reply') as string
  const athleteId = formData.get('athlete_id') as string

  if (!id || !reply) return { error: FIELDS_ERROR }

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
