import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { adminClient } from '@/lib/supabase/admin'
import { AthleteProfileClient } from './_components/AthleteProfileClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: athlete } = await supabase.from('athletes').select('name').eq('id', id).single()
  return { title: athlete ? `${athlete.name} | Strefa Trenera` : 'Zawodnik | Strefa Trenera' }
}

export default async function AthleteProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const supabase = await createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const paramsFromUrl = (await searchParams) ?? {}
  const requestedTab = Array.isArray(paramsFromUrl.tab) ? paramsFromUrl.tab[0] : paramsFromUrl.tab

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: athlete } = await supabase
    .from('athletes')
    .select('*')
    .eq('id', id)
    .eq('coach_id', user.id)
    .single()

  if (!athlete) notFound()

  const [
    { data: sessions },
    { data: feedbacks },
    { data: invoices },
    { data: packages },
    { data: races },
    { data: stravaActivities },
    { count: unreadMessagesCount },
    { count: overdueInvoicesCount },
    { count: pendingInvoicesCount },
    { data: nextRace },
  ] = await Promise.all([
    supabase
      .from('training_sessions')
      .select('*')
      .eq('athlete_id', id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('feedbacks')
      .select('*')
      .eq('athlete_id', id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('invoices')
      .select('*')
      .eq('athlete_id', id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('packages')
      .select('id, name, description, price')
      .eq('coach_id', user.id)
      .order('name'),
    supabase
      .from('athlete_races')
      .select('*')
      .eq('athlete_id', id)
      .order('date', { ascending: true }),
    supabase
      .from('strava_activities')
      .select('*')
      .eq('athlete_id', id)
      .order('start_date', { ascending: false })
      .limit(100),
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', id)
      .eq('sender_type', 'athlete')
      .eq('read', false),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', id)
      .eq('status', 'overdue'),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', id)
      .eq('status', 'pending'),
    supabase
      .from('athlete_races')
      .select('id, name, date, distance')
      .eq('athlete_id', id)
      .gte('date', new Date().toISOString().slice(0, 10))
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  const nowIso = new Date().toISOString()
  const { data: activeSession } = await adminClient
    .from('athlete_sessions')
    .select('id, last_seen_at, created_at, expires_at')
    .eq('athlete_id', id)
    .is('revoked_at', null)
    .gt('expires_at', nowIso)
    .order('last_seen_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <AthleteProfileClient
      athlete={athlete}
      sessions={sessions ?? []}
      feedbacks={feedbacks ?? []}
      invoices={invoices ?? []}
      packages={packages ?? []}
      races={races ?? []}
      stravaActivities={stravaActivities ?? []}
      unreadMessagesCount={unreadMessagesCount ?? 0}
      appUrl={appUrl}
      initialTab={requestedTab ?? 'plan'}
      accessInfo={{
        inviteUsedAt: athlete.invite_token_used_at ?? null,
        hasActiveSession: !!activeSession,
        lastSeenAt: activeSession?.last_seen_at ?? null,
        sessionCreatedAt: activeSession?.created_at ?? null,
      }}
      summaryInfo={{
        unpaidInvoicesCount: (overdueInvoicesCount ?? 0) + (pendingInvoicesCount ?? 0),
        overdueInvoicesCount: overdueInvoicesCount ?? 0,
        pendingInvoicesCount: pendingInvoicesCount ?? 0,
        nextRace: nextRace
          ? {
              name: nextRace.name,
              date: nextRace.date,
              distance: nextRace.distance,
            }
          : null,
      }}
    />
  )
}
