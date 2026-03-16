import { redirect } from 'next/navigation'
import { getAthleteFromSession } from '@/lib/athlete-auth'
import { getAthletePlanData } from '@/lib/athlete-data'
import { addDaysToBusinessDate, getBusinessToday } from '@/lib/date'
import { AthletePlanPage } from '../_components/AthletePlanPage'

export default async function PlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const athlete = await getAthleteFromSession(slug)

  if (!athlete) {
    redirect(`/u/${slug}`)
  }

  const today = getBusinessToday()
  const fromStr = addDaysToBusinessDate(today, -14)
  const toStr = addDaysToBusinessDate(today, 42)

  const { sessions, feedbacks: feedbacksArr } = await getAthletePlanData(athlete.id, fromStr, toStr)

  const feedbacks = Object.fromEntries((feedbacksArr ?? []).map(f => [f.date, f]))

  return <AthletePlanPage athlete={athlete} sessions={sessions} feedbacks={feedbacks} today={today} />
}
