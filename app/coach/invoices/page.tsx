import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { InvoicesClient } from './_components/InvoicesClient'

export const metadata: Metadata = { title: 'Faktury | Strefa Trenera' }

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const coachId = user?.id ?? ''

  const [{ data: invoices }, { data: athletes }] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, athletes(id, name, package)')
      .eq('coach_id', coachId)
      .order('date', { ascending: false }),
    supabase
      .from('athletes')
      .select('id, name, package, package_price')
      .eq('coach_id', coachId)
      .order('name'),
  ])

  return <InvoicesClient invoices={invoices ?? []} athletes={athletes ?? []} />
}
