import { adminClient } from '@/lib/supabase/admin'
import { getSessionExecutionStatus, getStatusUpdateForExecution } from '@/lib/session-status'
import type { Database } from '@/lib/supabase/database.types'
import type { SessionExecutionStatus, SessionType } from '@/lib/types'

type StravaConnectionRow = Database['public']['Tables']['strava_connections']['Row']
type StravaActivityInsert = Database['public']['Tables']['strava_activities']['Insert']
type TrainingSessionRow = Database['public']['Tables']['training_sessions']['Row']

type StravaTokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_at?: number
  athlete?: { id?: number | null }
}

type StravaActivity = {
  id: number
  name?: string | null
  distance?: number | null
  moving_time?: number | null
  elapsed_time?: number | null
  start_date?: string | null
  type?: string | null
  sport_type?: string | null
  average_speed?: number | null
  max_speed?: number | null
  average_cadence?: number | null
  average_heartrate?: number | null
  max_heartrate?: number | null
  total_elevation_gain?: number | null
  device_name?: string | null
}

const MATCHABLE_SESSION_TYPES = new Set<SessionType>(['easy', 'interval', 'tempo', 'long'])
const WARSAW_TIMEZONE = 'Europe/Warsaw'

function getBusinessDateFromIso(iso: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: WARSAW_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

export function getStravaConfig() {
  const clientIdRaw = process.env.STRAVA_CLIENT_ID?.trim()
  const clientSecret = process.env.STRAVA_CLIENT_SECRET?.trim()
  const clientId = clientIdRaw ? Number.parseInt(clientIdRaw, 10) : Number.NaN

  if (!clientIdRaw || !clientSecret || Number.isNaN(clientId)) {
    return null
  }

  return { clientId, clientSecret }
}

export function buildStravaErrorRedirect(appUrl: string, slug?: string | null, code = 'error', message?: string) {
  const target = slug ? `/u/${encodeURIComponent(slug)}/history` : '/'
  const params = new URLSearchParams({ strava: code })
  if (message) params.set('msg', message.slice(0, 200))
  return `${appUrl}${target}?${params.toString()}`
}

export async function resolveStravaStateByNonce(nonce: string) {
  const { data } = await adminClient
    .from('strava_oauth_states')
    .select('id, athlete_id, slug, expires_at, consumed_at')
    .eq('nonce', nonce)
    .single()

  return data ?? null
}

export async function consumeStravaState(nonce: string) {
  const nowIso = new Date().toISOString()
  const { data, error } = await adminClient
    .from('strava_oauth_states')
    .update({ consumed_at: nowIso })
    .eq('nonce', nonce)
    .is('consumed_at', null)
    .gt('expires_at', nowIso)
    .select('id, athlete_id, slug')

  if (error) return { data: null, error }
  return { data: data?.[0] ?? null, error: null }
}

export async function exchangeStravaCodeForTokens(code: string) {
  const config = getStravaConfig()
  if (!config) {
    throw new Error('missing_config')
  }

  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    const body = await tokenRes.text()
    throw new Error(`token_exchange_failed:${tokenRes.status}:${body.slice(0, 120)}`)
  }

  const tokens = await tokenRes.json() as StravaTokenResponse
  if (!tokens.access_token || !tokens.refresh_token || !tokens.expires_at || typeof tokens.expires_at !== 'number') {
    throw new Error('invalid_token_response')
  }

  return tokens
}

export async function refreshStravaAccessToken(connection: StravaConnectionRow) {
  if (new Date(connection.expires_at ?? 0) >= new Date()) {
    return connection.access_token ?? null
  }

  const config = getStravaConfig()
  if (!config) {
    throw new Error('missing_config')
  }

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: connection.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`refresh_failed:${res.status}:${body.slice(0, 120)}`)
  }

  const tokens = await res.json() as StravaTokenResponse
  if (!tokens.access_token || !tokens.refresh_token || !tokens.expires_at || typeof tokens.expires_at !== 'number') {
    throw new Error('invalid_refresh_response')
  }

  await adminClient
    .from('strava_connections')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(tokens.expires_at * 1000).toISOString(),
    })
    .eq('athlete_id', connection.athlete_id)

  return tokens.access_token
}

export async function fetchStravaActivities(accessToken: string) {
  const res = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=100&page=1', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`activities_fetch_failed:${res.status}:${body.slice(0, 120)}`)
  }

  const activities = await res.json() as StravaActivity[]
  return activities.filter((activity) => {
    const type = activity.type ?? activity.sport_type ?? ''
    return type === 'Run' || type === 'TrailRun'
  })
}

export async function upsertStravaActivities(athleteId: string, activities: StravaActivity[]) {
  if (activities.length === 0) return 0

  const nowIso = new Date().toISOString()
  const rows: StravaActivityInsert[] = activities.map((activity) => ({
    athlete_id: athleteId,
    strava_id: activity.id,
    name: activity.name ?? null,
    distance: activity.distance ?? null,
    moving_time: activity.moving_time ?? null,
    elapsed_time: activity.elapsed_time ?? null,
    start_date: activity.start_date ?? null,
    type: activity.type ?? null,
    sport_type: activity.sport_type ?? null,
    average_speed: activity.average_speed ?? null,
    max_speed: activity.max_speed ?? null,
    average_cadence: activity.average_cadence ?? null,
    average_heartrate: activity.average_heartrate ?? null,
    max_heartrate: activity.max_heartrate ?? null,
    total_elevation_gain: activity.total_elevation_gain ?? null,
    device_name: activity.device_name ?? null,
    synced_at: nowIso,
  }))

  const { error } = await adminClient
    .from('strava_activities')
    .upsert(rows, { onConflict: 'strava_id' })

  if (error) {
    throw new Error(`activities_upsert_failed:${error.message}`)
  }

  return rows.length
}

function canSessionMatchRun(session: Pick<TrainingSessionRow, 'type'>) {
  return MATCHABLE_SESSION_TYPES.has(session.type as SessionType)
}

function isDistanceCloseEnough(plannedDistanceKm: number | null, actualDistanceMeters: number | null) {
  if (!plannedDistanceKm || !actualDistanceMeters) return true
  const actualKm = actualDistanceMeters / 1000
  const diff = Math.abs(plannedDistanceKm - actualKm)
  return diff <= Math.max(1.5, plannedDistanceKm * 0.35)
}

function formatPaceFromAverageSpeed(averageSpeed: number | null) {
  if (!averageSpeed || averageSpeed <= 0) return null
  const secPerKm = 1000 / averageSpeed
  const minutes = Math.floor(secPerKm / 60)
  const seconds = Math.round(secPerKm % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

type MatchableActivityRow = Database['public']['Tables']['strava_activities']['Row']

function shouldHydrateSessionFromStrava(session: TrainingSessionRow) {
  return session.actual_data_source !== 'coach'
}

function getStravaSessionUpdate(session: TrainingSessionRow, activity: MatchableActivityRow) {
  const status = getSessionExecutionStatus(session as { status?: SessionExecutionStatus | null; completed?: boolean | null; date: string })
  const baseUpdate: Database['public']['Tables']['training_sessions']['Update'] = {
    linked_strava_activity_id: activity.strava_id,
  }

  if (status === 'planned') {
    Object.assign(baseUpdate, getStatusUpdateForExecution('detected', 'strava', null))
  }

  if (shouldHydrateSessionFromStrava(session)) {
    baseUpdate.actual_distance = activity.distance ? Number((activity.distance / 1000).toFixed(2)) : null
    baseUpdate.actual_duration = activity.moving_time ? Math.round(activity.moving_time / 60) : null
    baseUpdate.actual_pace = formatPaceFromAverageSpeed(activity.average_speed ?? null)
    baseUpdate.avg_hr = activity.average_heartrate ? Math.round(activity.average_heartrate) : null
    baseUpdate.max_hr = activity.max_heartrate ? Math.round(activity.max_heartrate) : null
    baseUpdate.actual_data_source = 'strava'
  }

  return baseUpdate
}

export async function matchStravaActivitiesToSessions(athleteId: string) {
  const [{ data: activities }, { data: sessions }] = await Promise.all([
    adminClient
      .from('strava_activities')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('start_date', { ascending: false })
      .limit(100),
    adminClient
      .from('training_sessions')
      .select('*')
      .eq('athlete_id', athleteId)
      .gte('date', new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString().slice(0, 10))
      .order('date', { ascending: false }),
  ])

  if (!activities?.length || !sessions?.length) return 0

  const linkedIds = new Set(
    sessions
      .map((session) => session.linked_strava_activity_id)
      .filter((value): value is number => typeof value === 'number')
  )

  let matched = 0

  for (const activity of activities) {
    if (!activity.start_date || linkedIds.has(activity.strava_id)) continue

    const activityDate = getBusinessDateFromIso(activity.start_date)
    const candidates = sessions.filter((session) => {
      if (session.date !== activityDate) return false
      if (session.linked_strava_activity_id) return false
      if (!canSessionMatchRun(session)) return false
      const status = getSessionExecutionStatus(session as { status?: SessionExecutionStatus | null; completed?: boolean | null; date: string })
      if (status === 'skipped') return false
      return isDistanceCloseEnough(session.planned_distance, activity.distance ?? null)
    })

    if (candidates.length !== 1) continue

    const session = candidates[0]
    const update = getStravaSessionUpdate(session, activity)
    const { error } = await adminClient
      .from('training_sessions')
      .update(update)
      .eq('id', session.id)
      .eq('athlete_id', athleteId)

    if (error) {
      console.error('[strava] session match update failed:', error.message)
      continue
    }

    linkedIds.add(activity.strava_id)
    matched += 1
  }

  return matched
}

export async function syncStravaForAthlete(athleteId: string) {
  const { data: connection } = await adminClient
    .from('strava_connections')
    .select('*')
    .eq('athlete_id', athleteId)
    .single()

  if (!connection) {
    throw new Error('missing_connection')
  }

  const accessToken = await refreshStravaAccessToken(connection)
  if (!accessToken) {
    throw new Error('missing_access_token')
  }

  const activities = await fetchStravaActivities(accessToken)
  const synced = await upsertStravaActivities(athleteId, activities)
  const matched = await matchStravaActivitiesToSessions(athleteId)

  return { synced, matched }
}
