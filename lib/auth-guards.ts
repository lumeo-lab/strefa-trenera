import { createClient } from '@/lib/supabase/server'
import { getAthleteFromSession, AthleteSession } from '@/lib/athlete-auth'
import { adminClient } from '@/lib/supabase/admin'
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
  const { data } = await adminClient
    .from('athletes')
    .select('id')
    .eq('id', athleteId)
    .eq('coach_id', coachId)
    .single()
  return !!data
}
