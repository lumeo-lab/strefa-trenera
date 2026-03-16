import { createClient } from '@/lib/supabase/server'
import { AthleteSession, getAthleteFromSession } from '@/lib/athlete-auth'
import { AUTH_ERROR } from '@/lib/constants'

/**
 * Verify the current request is from an authenticated coach.
 * Returns the coach user or an error.
 */
export async function requireCoach(): Promise<{ user: { id: string } } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }
  return { user }
}

/**
 * Verify the current request is from an authenticated athlete via session cookie.
 * Returns the verified athlete or an error.
 */
export async function requireAthlete(slug: string): Promise<{ athlete: AthleteSession } | { error: string }> {
  const athlete = await getAthleteFromSession(slug)
  if (!athlete) return { error: AUTH_ERROR }
  return { athlete }
}

/**
 * Verify that a coach owns a specific athlete.
 * Returns true if the athlete belongs to the coach.
 */
export async function assertCoachOwnsAthlete(coachId: string, athleteId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('athletes')
    .select('id')
    .eq('id', athleteId)
    .eq('coach_id', coachId)
    .single()
  return !!data
}
