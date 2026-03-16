'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUnreadNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('feedbacks')
    .select('id, created_at, source, transcript, athletes(name)')
    .eq('coach_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(20)

  return (data ?? []).map((fb: { id: string; created_at: string; source: string; transcript: string; athletes: { name: string }[] }) => ({
    id: fb.id,
    athlete_name: fb.athletes?.[0]?.name ?? 'Zawodnik',
    source: fb.source as string,
    transcript: fb.transcript as string,
    created_at: fb.created_at as string,
  }))
}

export async function markNotificationsRead(ids: string[]) {
  if (!ids.length) return
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('feedbacks')
    .update({ read: true })
    .in('id', ids)
    .eq('coach_id', user.id)

  revalidatePath('/coach/feedback')
}
