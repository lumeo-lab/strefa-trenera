import { redirect } from 'next/navigation'
import { getAthleteFromSession } from '@/lib/athlete-auth'
import { type AthleteFeedbackByDay, getAthleteFeedbackWindow, getAthleteWindowSessions } from '@/lib/athlete-data'
import { addDaysToBusinessDate, getBusinessToday } from '@/lib/date'
import { AthleteTodayPage } from './_components/AthleteTodayPage'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ t?: string; invalid?: string; info?: string; d?: string }>
}

export default async function SlugPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { t: token, invalid, info, d } = await searchParams

  // If token in URL → redirect to verify API
  if (token) {
    redirect(`/api/athlete/verify?slug=${slug}&t=${token}`)
  }

  // Try to get athlete from session cookie
  const athlete = await getAthleteFromSession(slug)

  if (!athlete) {
    // No session — show invitation required screen
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔐</div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>
            {invalid ? 'Sesja wygasła' : 'Potrzebujesz linku zaproszenia'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
            {invalid
              ? 'Twój link wygasł. Poproś trenera o nowy link zaproszenia.'
              : info
              ? 'Aby uzyskać dostęp do swojego panelu, skorzystaj z linku zaproszenia przesłanego przez trenera.'
              : 'Ten panel jest dostępny tylko przez link zaproszenia od trenera.'}
          </p>
          <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-muted)' }}>
            Napisz do swojego trenera z prośbą o przesłanie nowego linku.
          </div>
        </div>
      </div>
    )
  }

  // Fetch today's session
  const today = getBusinessToday()
  const selectedDate = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : today
  const sessionsFrom = addDaysToBusinessDate(today, -7)
  const sessionsTo = addDaysToBusinessDate(today, 7)
  const sessions = await getAthleteWindowSessions(athlete.id, sessionsFrom, sessionsTo)

  const feedbacksArr = await getAthleteFeedbackWindow(
    athlete.id,
    addDaysToBusinessDate(today, -7),
    addDaysToBusinessDate(today, 7)
  )

  const feedbacksByDate: AthleteFeedbackByDay = {}
  for (const fb of feedbacksArr ?? []) {
    if (!feedbacksByDate[fb.date]) feedbacksByDate[fb.date] = { text: null, voice: null }
    if (fb.source === 'voice') feedbacksByDate[fb.date].voice = fb
    else feedbacksByDate[fb.date].text = fb
  }

  return (
    <AthleteTodayPage
      athlete={athlete}
      sessions={sessions}
      feedbacks={feedbacksByDate}
      today={today}
      initialDate={selectedDate}
    />
  )
}
