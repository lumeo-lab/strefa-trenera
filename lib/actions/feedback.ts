'use server'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createFeedback(formData: FormData) {
  const athleteId = formData.get('athlete_id') as string
  const coachId = formData.get('coach_id') as string
  const sessionId = formData.get('session_id') as string || null
  const date = formData.get('date') as string
  const source = formData.get('source') as string
  const feeling = formData.get('feeling') as string
  const trainingType = formData.get('training_type') as string
  const distanceKm = formData.get('distance_km') as string
  const durationMin = formData.get('duration_min') as string
  const intensity = formData.get('intensity') as string
  const notes = formData.get('notes') as string
  const voiceTranscript = formData.get('voice_transcript') as string

  if (!athleteId || !coachId || !date) return { error: 'Brak wymaganych danych' }

  const feelingSignal: Record<string, string> = {
    '😫': 'red', '😕': 'red', '😐': 'yellow', '😊': 'green', '🤩': 'green',
  }
  const signal = feelingSignal[feeling] ?? 'green'

  let transcript = ''
  let aiSummary = ''

  if (source === 'voice') {
    transcript = voiceTranscript || ''
    aiSummary = 'Feedback głosowy'
  } else {
    const parts = []
    if (feeling) parts.push(`Samopoczucie: ${feeling}`)
    if (trainingType) parts.push(`Typ: ${trainingType}`)
    if (distanceKm) parts.push(`Dystans: ${distanceKm} km`)
    if (durationMin) parts.push(`Czas: ${durationMin} min`)
    if (intensity) parts.push(`Intensywność: ${intensity}`)
    if (notes) parts.push(`Notatka: ${notes}`)
    transcript = parts.join(' | ')
    aiSummary = feeling ? `${feeling} — ${intensity || trainingType || 'trening'}` : (trainingType || 'Feedback tekstowy')
  }

  const { error } = await adminClient.from('feedbacks').insert({
    athlete_id: athleteId,
    coach_id: coachId,
    session_id: sessionId,
    date,
    source,
    signal,
    transcript,
    ai_summary: aiSummary,
    ai_analysis: '',
    read: false,
  })

  if (error) return { error: error.message }

  revalidatePath(`/u/${formData.get('slug')}`)
  revalidatePath('/coach/feedback')
  return { success: true }
}

export async function markFeedbackRead(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  await supabase
    .from('feedbacks')
    .update({ read: true })
    .eq('id', id)
    .eq('coach_id', user.id)

  revalidatePath('/coach/feedback')
}

export async function replyFeedback(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  const id = formData.get('id') as string
  const reply = formData.get('reply') as string

  if (!id || !reply) return { error: 'Brak wymaganych pól' }

  const { error } = await supabase
    .from('feedbacks')
    .update({ coach_reply: reply, read: true })
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/coach/feedback')
  return { success: true }
}
