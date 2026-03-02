import { redirect } from 'next/navigation'
import { getAthleteFromSession } from '@/lib/athlete-auth'
import { adminClient } from '@/lib/supabase/admin'
import { AthleteHistoryPage } from '../_components/AthleteHistoryPage'

export default async function HistoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const athlete = await getAthleteFromSession(slug)

  if (!athlete) {
    redirect(`/u/${slug}`)
  }

  const { data: sessions } = await adminClient
    .from('training_sessions')
    .select('*')
    .eq('athlete_id', athlete.id)
    .eq('completed', true)
    .order('date', { ascending: false })
    .limit(50)

  return <AthleteHistoryPage athlete={athlete} sessions={sessions ?? []} />
}
