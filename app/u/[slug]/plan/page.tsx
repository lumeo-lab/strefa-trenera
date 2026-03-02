import { redirect } from 'next/navigation'
import { getAthleteFromSession } from '@/lib/athlete-auth'
import { adminClient } from '@/lib/supabase/admin'
import { AthletePlanPage } from '../_components/AthletePlanPage'

export default async function PlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const athlete = await getAthleteFromSession(slug)

  if (!athlete) {
    redirect(`/u/${slug}`)
  }

  const today = new Date().toISOString().split('T')[0]

  // Fetch 6 weeks of sessions around today
  const from = new Date()
  from.setDate(from.getDate() - 14)
  const to = new Date()
  to.setDate(to.getDate() + 42)

  const { data: sessions } = await adminClient
    .from('training_sessions')
    .select('*')
    .eq('athlete_id', athlete.id)
    .gte('date', from.toISOString().split('T')[0])
    .lte('date', to.toISOString().split('T')[0])
    .order('date')

  const { data: feedbacksArr } = await adminClient
    .from('feedbacks')
    .select('id, date, signal, ai_summary, coach_reply, transcript, source')
    .eq('athlete_id', athlete.id)
    .gte('date', from.toISOString().split('T')[0])
    .lte('date', to.toISOString().split('T')[0])

  const feedbacks = Object.fromEntries((feedbacksArr ?? []).map(f => [f.date, f]))

  return <AthletePlanPage athlete={athlete} sessions={sessions ?? []} feedbacks={feedbacks} today={today} />
}
