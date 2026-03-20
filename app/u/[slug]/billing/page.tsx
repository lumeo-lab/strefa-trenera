import { redirect } from 'next/navigation'
import { getAthleteFromSession } from '@/lib/athlete-auth'
import { getAthleteInvoices } from '@/lib/athlete-data'
import { AthleteBillingPage } from '../_components/AthleteBillingPage'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function BillingPage({ params }: Props) {
  const { slug } = await params
  const athlete = await getAthleteFromSession(slug)

  if (!athlete) redirect(`/u/${slug}?invalid=1`)

  const invoices = await getAthleteInvoices(athlete.id)

  return <AthleteBillingPage athlete={athlete} invoices={invoices} />
}
