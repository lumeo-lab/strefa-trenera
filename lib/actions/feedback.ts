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
const MAX_PAIN_NOTE_LENGTH = 500
const VALID_RPE = new Set(Array.from({ length: 10 }, (_, index) => String(index + 1)))

function buildFeedbackFields(formData: FormData) {
  const feeling = formData.get('feeling') as string || ''
  const distanceKm = formData.get('distance_km') as string || ''
  const durationMin = formData.get('duration_min') as string || ''
  const rpeRaw = (formData.get('rpe') as string || '').trim()
  const rpe = VALID_RPE.has(rpeRaw) ? parseInt(rpeRaw, 10) : null
  const painFlag = (formData.get('pain_flag') as string || '') === 'true'
  const painNote = (formData.get('pain_note') as string || '').slice(0, MAX_PAIN_NOTE_LENGTH).trim()
  const notes = (formData.get('notes') as string || '').slice(0, MAX_NOTES_LENGTH)
  const voiceTranscript = (formData.get('voice_transcript') as string || '').slice(0, MAX_TRANSCRIPT_LENGTH)

  // Validate feeling emoji
  const validFeeling = VALID_FEELINGS.includes(feeling) ? feeling : ''

  const hasText = !!(feeling || distanceKm || durationMin || rpe || painFlag || notes.trim() || painNote)
  const hasVoice = !!voiceTranscript.trim()
  const source = hasText && hasVoice ? 'both' : hasVoice ? 'voice' : 'text'

  const feelingSignal: Record<string, string> = {
    '😫': 'red', '😕': 'red', '😐': 'yellow', '😊': 'green', '🤩': 'green',
  }
  const signal = feelingSignal[validFeeling] ?? 'green'

  // Build transcript: structured text parts + optional voice note at the end
  const parts: string[] = []
  if (validFeeling) parts.push(`Samopoczucie: ${validFeeling}`)
  if (rpe) parts.push(`RPE: ${rpe}/10`)
  if (distanceKm) parts.push(`Dystans: ${distanceKm} km`)
  if (durationMin) parts.push(`Czas: ${durationMin} min`)
  if (painFlag) parts.push(`Ból/problem: ${painNote || 'Tak'}`)
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

  return {
    source,
    signal,
    transcript,
    feeling: validFeeling || null,
    rpe,
    pain_flag: painFlag,
    pain_note: painFlag ? (painNote || null) : null,
    notes_structured: notes || null,
    voice_transcript: voiceTranscript || null,
    actual_distance: distanceKm ? parseFloat(distanceKm) || null : null,
    actual_duration: durationMin ? parseInt(durationMin, 10) || null : null,
    ai_analysis: '',
    ai_summary: '',
    watch_link: watchLink,
  }
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

  // Feedback updates actual metrics on the linked session, but no longer defines execution status.
  if (sessionId) {
    const { data: session } = await adminClient.from('training_sessions')
      .select('actual_distance, actual_duration')
      .eq('id', sessionId)
      .eq('athlete_id', athlete.id)
      .single()

    if (session) {
      const distanceKm = formData.get('distance_km') as string || ''
      const durationMin = formData.get('duration_min') as string || ''
      const sessionUpdate: Record<string, unknown> = {}
      if (!session.actual_distance && distanceKm) sessionUpdate.actual_distance = parseFloat(distanceKm) || null
      if (!session.actual_duration && durationMin) sessionUpdate.actual_duration = parseInt(durationMin, 10) || null
      if (Object.keys(sessionUpdate).length > 0) sessionUpdate.actual_data_source = 'athlete'
      if (Object.keys(sessionUpdate).length > 0) {
        await adminClient.from('training_sessions')
          .update(sessionUpdate)
          .eq('id', sessionId)
          .eq('athlete_id', athlete.id)
      }
    }
  }

  revalidatePath(`/u/${slug}`)
  revalidatePath('/coach/feedback')
  revalidatePath(`/coach/athletes/${athlete.id}`)
  return { success: true }
}

export async function updateFeedback(formData: FormData) {
  const parsed = validateFormData(updateFeedbackSchema, formData)
  if ('error' in parsed) return parsed
  const { slug, id } = parsed.data

  const athlete = await getAthleteFromSession(slug)
  if (!athlete) return { error: AUTH_ERROR }

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

export async function loadMoreFeedbacks(offset: number, limit = 50) {
  limit = Math.min(Math.max(limit, 1), 100)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const { data: activeAthletes } = await supabase
    .from('athletes')
    .select('id')
    .eq('coach_id', user.id)
    .is('archived_at', null)

  const activeAthleteIds = (activeAthletes ?? []).map(a => a.id)
  if (activeAthleteIds.length === 0) return { feedbacks: [] }

  const { data: feedbacks, error } = await supabase
    .from('feedbacks')
    .select(`
      *,
      athletes(id, name, avatar),
      training_sessions(id, title, linked_strava_activity_id, actual_distance, actual_duration, actual_pace, avg_hr, max_hr)
    `)
    .eq('coach_id', user.id)
    .in('athlete_id', activeAthleteIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return { error: error.message }

  // Fetch Strava data
  const stravaIds = (feedbacks ?? [])
    .map(f => f.training_sessions?.linked_strava_activity_id)
    .filter((id): id is number => id != null)

  const uniqueStravaIds = [...new Set(stravaIds)]
  let stravaMap = new Map<number, {
    distance: number | null
    moving_time: number | null
    average_speed: number | null
    average_heartrate: number | null
    max_heartrate: number | null
    total_elevation_gain: number | null
  }>()

  if (uniqueStravaIds.length > 0) {
    const { data: stravaActivities } = await supabase
      .from('strava_activities')
      .select('strava_id, distance, moving_time, average_speed, average_heartrate, max_heartrate, total_elevation_gain')
      .in('strava_id', uniqueStravaIds)
    if (stravaActivities) {
      stravaMap = new Map(stravaActivities.map(a => [a.strava_id, a]))
    }
  }

  const enriched = (feedbacks ?? []).map(f => {
    const stravaId = f.training_sessions?.linked_strava_activity_id
    const strava = stravaId ? stravaMap.get(stravaId) ?? null : null
    return { ...f, strava_data: strava }
  })

  return { feedbacks: enriched }
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
