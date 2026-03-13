import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './_components/SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: coach }, { data: packages }] = await Promise.all([
    supabase.from('coaches').select('name, plan, avatar').eq('id', user!.id).single(),
    supabase.from('packages').select('id, name, description, price').eq('coach_id', user!.id).order('name'),
  ])

  return (
    <SettingsClient
      email={user!.email ?? ''}
      name={coach?.name ?? ''}
      plan={coach?.plan ?? 'starter'}
      avatar={coach?.avatar ?? ''}
      packages={packages ?? []}
    />
  )
}
