import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { PackagesClient } from './_components/PackagesClient'

export default async function PackagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: packages } = await supabase
    .from('packages')
    .select('id, name, description, price')
    .eq('coach_id', user.id)
    .order('name')

  return (
    <>
      <CoachTopbar title="Pakiety" subtitle="Twoje oferty dla zawodników" />
      <div className="p-6 max-w-4xl mx-auto">
        <PackagesClient packages={packages ?? []} />
      </div>
    </>
  )
}
