import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CoachShell } from './_components/CoachShell'

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch coach profile
  const { data: coach } = await supabase
    .from('coaches')
    .select('name, plan')
    .eq('id', user.id)
    .single()

  const coachName = coach?.name || user.email?.split('@')[0] || 'Trener'
  const coachPlan = coach?.plan || 'starter'

  return (
    <CoachShell coachName={coachName} coachPlan={coachPlan}>
      {children}
    </CoachShell>
  )
}
