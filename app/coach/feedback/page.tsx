import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { FeedbackClient } from './_components/FeedbackClient'

export const metadata: Metadata = { title: 'Feedback | Strefa Trenera' }

export default async function FeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const coachId = user?.id ?? ''

  const { data: feedbacks } = await supabase
    .from('feedbacks')
    .select(`
      *,
      athletes(id, name, avatar),
      training_sessions(id, title)
    `)
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false })
    .limit(200)

  return <FeedbackClient feedbacks={feedbacks ?? []} />
}
