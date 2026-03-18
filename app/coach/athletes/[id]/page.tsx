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

export default async function AthleteProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

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
    { data: packages },
    { count: unreadMessagesCount },
    { count: unpaidInvoicesCount },
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
      .from('packages')
      .select('id, name, description, price')
      .eq('coach_id', user.id)
      .order('name'),
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
      .in('status', ['pending', 'overdue']),
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
      invoices={[]}
      packages={packages ?? []}
      races={[]}
      unreadMessagesCount={unreadMessagesCount ?? 0}
      appUrl={appUrl}
      accessInfo={{
        inviteUsedAt: athlete.invite_token_used_at ?? null,
        hasActiveSession: !!activeSession,
        lastSeenAt: activeSession?.last_seen_at ?? null,
        sessionCreatedAt: activeSession?.created_at ?? null,
      }}
      summaryInfo={{
        unpaidInvoicesCount: unpaidInvoicesCount ?? 0,
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
