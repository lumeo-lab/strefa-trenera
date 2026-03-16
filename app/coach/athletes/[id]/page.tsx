import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
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

  const { data: { user } } = await supabase.auth.getUser()

  const { data: athlete } = await supabase
    .from('athletes')
    .select('*')
    .eq('id', id)
    .eq('coach_id', user!.id)
    .single()

  if (!athlete) notFound()

  const [
    { data: sessions },
    { data: feedbacks },
    { data: invoices },
    { data: packages },
    { data: races },
    { count: unreadMessagesCount },
  ] = await Promise.all([
    supabase
      .from('training_sessions')
      .select('*')
      .eq('athlete_id', id)
      .order('date', { ascending: false })
      .limit(200),
    supabase
      .from('feedbacks')
      .select('*')
      .eq('athlete_id', id)
      .order('date', { ascending: false })
      .limit(200),
    supabase
      .from('invoices')
      .select('*')
      .eq('athlete_id', id)
      .order('date', { ascending: false })
      .limit(100),
    supabase
      .from('packages')
      .select('id, name, description, price')
      .eq('coach_id', user!.id)
      .order('name'),
    supabase
      .from('athlete_races')
      .select('*')
      .eq('athlete_id', id)
      .order('date', { ascending: true }),
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', id)
      .eq('sender_type', 'athlete')
      .eq('read', false),
  ])

  return (
    <AthleteProfileClient
      athlete={athlete}
      sessions={sessions ?? []}
      feedbacks={feedbacks ?? []}
      invoices={invoices ?? []}
      packages={packages ?? []}
      races={races ?? []}
      unreadMessagesCount={unreadMessagesCount ?? 0}
    />
  )
}
