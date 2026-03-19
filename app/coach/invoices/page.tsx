import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { InvoicesClient } from './_components/InvoicesClient'

export const metadata: Metadata = { title: 'Faktury | Strefa Trenera' }

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const coachId = user?.id ?? ''
  const params = (await searchParams) ?? {}
  const athleteParam = Array.isArray(params.athlete) ? params.athlete[0] : params.athlete
  const filterParam = Array.isArray(params.filter) ? params.filter[0] : params.filter

  const [{ data: invoices }, athletesResult] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, athletes(id, name, package)')
      .eq('coach_id', coachId)
      .order('date', { ascending: false }),
    supabase
      .from('athletes')
      .select('id, name, package, package_price')
      .eq('coach_id', coachId)
      .is('archived_at', null)
      .order('name'),
  ])

  const fallbackAthletesResult = athletesResult.error
    ? await supabase
      .from('athletes')
      .select('id, name, package, package_price')
      .eq('coach_id', coachId)
      .order('name')
    : null

  const athletes = athletesResult.error ? (fallbackAthletesResult?.data ?? []) : (athletesResult.data ?? [])

  return (
    <InvoicesClient
      invoices={invoices ?? []}
      athletes={athletes}
      initialAthleteId={athleteParam ?? ''}
      initialFilter={filterParam ?? 'all'}
    />
  )
}
