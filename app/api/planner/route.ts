import { NextResponse } from 'next/server'
import { z } from 'zod'
import { assertCoachOwnsAthlete } from '@/lib/auth-guards'
import { createClient } from '@/lib/supabase/server'

const plannerQuerySchema = z.object({
  athleteId: z.string().uuid('Nieprawidłowy zawodnik'),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowy zakres daty'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowy zakres daty'),
})

export async function GET(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Brak autoryzacji.' }, { status: 401 })
  }

  const url = new URL(req.url)
  const parsed = plannerQuerySchema.safeParse({
    athleteId: url.searchParams.get('athleteId'),
    from: url.searchParams.get('from'),
    to: url.searchParams.get('to'),
  })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Nieprawidłowe parametry.' }, { status: 400 })
  }

  const { athleteId, from, to } = parsed.data
  const ownsAthlete = await assertCoachOwnsAthlete(user.id, athleteId)

  if (!ownsAthlete) {
    return NextResponse.json({ error: 'Brak dostępu do tego zawodnika.' }, { status: 403 })
  }

  const [{ data: sessions, error: sessionsError }, { data: feedbacks, error: feedbacksError }] = await Promise.all([
    supabase
      .from('training_sessions')
      .select('*')
      .eq('coach_id', user.id)
      .eq('athlete_id', athleteId)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: true }),
    supabase
      .from('feedbacks')
      .select('*')
      .eq('coach_id', user.id)
      .eq('athlete_id', athleteId)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false }),
  ])

  if (sessionsError || feedbacksError) {
    return NextResponse.json(
      { error: sessionsError?.message || feedbacksError?.message || 'Nie udało się pobrać planera.' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    sessions: sessions ?? [],
    feedbacks: feedbacks ?? [],
  })
}
