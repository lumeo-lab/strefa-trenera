import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Pakiety | Strefa Trenera' }

export default function PackagesPage() {
  redirect('/coach/settings')
}
