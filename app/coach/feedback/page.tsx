import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { FeedbackClient } from './_components/FeedbackClient'

export const metadata: Metadata = { title: 'Feedback | Strefa Trenera' }

export default async function FeedbackPage() {
  const supabase = await createClient()

  const { data: feedbacks } = await supabase
    .from('feedbacks')
    .select(`
      *,
      athletes(id, name, avatar),
      training_sessions(id, title)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  return <FeedbackClient feedbacks={feedbacks ?? []} />
}
