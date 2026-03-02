import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'

export interface AthleteSession {
  id: string
  name: string
  avatar: string
  slug: string
  goal: string
  package: string
  package_price: number
  coach_id: string
  email: string | null
  phone: string | null
}

export async function getAthleteFromSession(slug: string): Promise<AthleteSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('athlete_session')?.value

  if (!token) return null

  const { data } = await adminClient
    .from('athlete_sessions')
    .select(`
      athlete_id,
      expires_at,
      athletes!inner(
        id, name, avatar, slug, goal, package,
        package_price, coach_id, email, phone
      )
    `)
    .eq('token', token)
    .eq('athletes.slug', slug)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!data) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any).athletes as AthleteSession
}
