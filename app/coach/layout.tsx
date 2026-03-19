import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CoachShell } from './_components/CoachShell'

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch coach profile + unread counts in parallel
  const [{ data: coach }, { count: unreadFeedback }, { count: unreadMessages }] = await Promise.all([
    supabase
      .from('coaches')
      .select('name, plan, avatar')
      .eq('id', user.id)
      .single(),
    supabase
      .from('feedbacks')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', user.id)
      .eq('read', false),
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', user.id)
      .eq('sender_type', 'athlete')
      .eq('read', false),
  ])

  const coachName = coach?.name || user.email?.split('@')[0] || 'Trener'
  const coachPlan = coach?.plan || 'starter'
  const coachAvatar = coach?.avatar || ''

  return (
    <CoachShell
      coachName={coachName}
      coachPlan={coachPlan}
      coachAvatar={coachAvatar}
      unreadFeedback={unreadFeedback ?? 0}
      unreadMessages={unreadMessages ?? 0}
    >
      {children}
    </CoachShell>
  )
}
