import { redirect } from 'next/navigation'
import { getAthleteFromSession } from '@/lib/athlete-auth'
import { adminClient } from '@/lib/supabase/admin'
import { AthleteTodayPage } from './_components/AthleteTodayPage'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ t?: string; invalid?: string; info?: string }>
}

export default async function SlugPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { t: token, invalid, info } = await searchParams

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
            Potrzebujesz linku zaproszenia
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
            {invalid
              ? 'Link jest nieprawidłowy lub wygasł. Poproś trenera o nowy link.'
              : info
              ? 'Aby uzyskać dostęp do swojego panelu, skorzystaj z linku zaproszenia przesłanego przez trenera.'
              : 'Ten panel jest dostępny tylko przez link zaproszenia od trenera.'}
          </p>
          <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-muted)' }}>
            Napisz do swojego trenera z prośbą o przesłanie linku do Twojego panelu treningowego.
          </div>
        </div>
      </div>
    )
  }

  // Fetch today's session
  const today = new Date().toISOString().split('T')[0]
  const { data: sessions } = await adminClient
    .from('training_sessions')
    .select('*')
    .eq('athlete_id', athlete.id)
    .gte('date', (() => {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      return d.toISOString().split('T')[0]
    })())
    .lte('date', (() => {
      const d = new Date()
      d.setDate(d.getDate() + 7)
      return d.toISOString().split('T')[0]
    })())
    .order('date')

  const { data: recentFeedback } = await adminClient
    .from('feedbacks')
    .select('coach_reply, date')
    .eq('athlete_id', athlete.id)
    .not('coach_reply', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <AthleteTodayPage
      athlete={athlete}
      sessions={sessions ?? []}
      recentFeedback={recentFeedback}
      today={today}
    />
  )
}
