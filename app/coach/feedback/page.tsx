import { createClient } from '@/lib/supabase/server'
import { FeedbackClient } from './_components/FeedbackClient'

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

  return <FeedbackClient feedbacks={feedbacks ?? []} />
}
