import { adminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/database.types'
import type { SessionActualDataSource, SessionCompletionSource, SessionExecutionStatus, SessionType } from '@/lib/types'

export type AthleteTrainingSessionRow = Omit<Database['public']['Tables']['training_sessions']['Row'], 'type' | 'status' | 'completion_source' | 'actual_data_source'> & {
  type: SessionType
  status: SessionExecutionStatus
  completion_source: SessionCompletionSource | null
  actual_data_source: SessionActualDataSource | null
  url: string | null
  url_label: string | null
}
export type AthleteFeedbackRow = Database['public']['Tables']['feedbacks']['Row']
export type AthleteMessageRow = Database['public']['Tables']['messages']['Row']
export type AthleteStravaActivityRow = Database['public']['Tables']['strava_activities']['Row']
export type AthleteFeedbackByDay = Record<string, { text: AthleteFeedbackRow | null; voice: AthleteFeedbackRow | null }>
export type AthletePlanFeedbackMap = Record<string, Pick<AthleteFeedbackRow, 'id' | 'date' | 'signal' | 'coach_reply' | 'transcript' | 'source'>>

export async function getAthleteWindowSessions(athleteId: string, from: string, to: string): Promise<AthleteTrainingSessionRow[]> {
  const { data, error } = await adminClient
    .from('training_sessions')
    .select('*')
    .eq('athlete_id', athleteId)
    .gte('date', from)
    .lte('date', to)
    .order('date')

  if (error) return []
  return data ?? []
}

export async function getAthleteFeedbackWindow(athleteId: string, from: string, to: string): Promise<AthleteFeedbackRow[]> {
  const { data, error } = await adminClient
    .from('feedbacks')
    .select('*')
    .eq('athlete_id', athleteId)
    .gte('date', from)
    .lte('date', to)

  if (error) return []
  return data ?? []
}

export async function getAthleteHistoryData(athleteId: string): Promise<{
  sessions: AthleteTrainingSessionRow[]
  stravaConnected: boolean
  stravaActivities: AthleteStravaActivityRow[]
}> {
  const [{ data: sessions }, { data: stravaConn }, { data: stravaActivities }] = await Promise.all([
    adminClient
      .from('training_sessions')
      .select('*')
      .eq('athlete_id', athleteId)
      .in('status', ['completed', 'skipped', 'detected'])
      .order('date', { ascending: false })
      .limit(50),
    adminClient.from('strava_connections').select('connected_at').eq('athlete_id', athleteId).single(),
    adminClient.from('strava_activities').select('*').eq('athlete_id', athleteId).order('start_date', { ascending: false }).limit(50),
  ])

  return {
    sessions: sessions ?? [],
    stravaConnected: !!stravaConn,
    stravaActivities: stravaActivities ?? [],
  }
}

export async function getAthleteChatData(athleteId: string, coachId: string): Promise<{
  messages: AthleteMessageRow[]
  coachName: string
}> {
  const [{ data: messages }, { data: coach }] = await Promise.all([
    adminClient.from('messages').select('*').eq('athlete_id', athleteId).order('created_at', { ascending: true }),
    adminClient.from('coaches').select('name').eq('id', coachId).single(),
  ])

  return {
    messages: messages ?? [],
    coachName: coach?.name ?? 'Trener',
  }
}

export async function getAthletePlanData(athleteId: string, from: string, to: string): Promise<{
  sessions: AthleteTrainingSessionRow[]
  feedbacks: Pick<AthleteFeedbackRow, 'id' | 'date' | 'signal' | 'coach_reply' | 'transcript' | 'source'>[]
}> {
  const [{ data: sessions }, { data: feedbacks }] = await Promise.all([
    adminClient
      .from('training_sessions')
      .select('*')
      .eq('athlete_id', athleteId)
      .gte('date', from)
      .lte('date', to)
      .order('date'),
    adminClient
      .from('feedbacks')
      .select('id, date, signal, coach_reply, transcript, source')
      .eq('athlete_id', athleteId)
      .gte('date', from)
      .lte('date', to),
  ])

  return {
    sessions: sessions ?? [],
    feedbacks: feedbacks ?? [],
  }
}
