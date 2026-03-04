import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './_components/SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: coach } = await supabase
    .from('coaches')
    .select('name, plan')
    .eq('id', user!.id)
    .single()

  return (
    <SettingsClient
      email={user!.email ?? ''}
      name={coach?.name ?? ''}
      plan={coach?.plan ?? 'starter'}
    />
  )
}
