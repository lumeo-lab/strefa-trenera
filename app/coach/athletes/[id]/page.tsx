import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AthleteProfileClient } from './_components/AthleteProfileClient'

export default async function AthleteProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: athlete } = await supabase
    .from('athletes')
    .select('*')
    .eq('id', id)
    .single()

  if (!athlete) notFound()

  const [{ data: sessions }, { data: feedbacks }, { data: invoices }, { data: packages }, { data: races }] = await Promise.all([
    supabase
      .from('training_sessions')
      .select('*')
      .eq('athlete_id', id)
      .order('date', { ascending: false }),
    supabase
      .from('feedbacks')
      .select('*')
      .eq('athlete_id', id)
      .order('date', { ascending: false }),
    supabase
      .from('invoices')
      .select('*')
      .eq('athlete_id', id)
      .order('date', { ascending: false }),
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
  ])

  return (
    <AthleteProfileClient
      athlete={athlete}
      sessions={sessions ?? []}
      feedbacks={feedbacks ?? []}
      invoices={invoices ?? []}
      packages={packages ?? []}
      races={races ?? []}
    />
  )
}
