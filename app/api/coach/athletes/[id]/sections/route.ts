import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const section = request.nextUrl.searchParams.get('section')

    if (section !== 'races' && section !== 'invoices') {
      return NextResponse.json({ error: 'Nieprawidłowa sekcja.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Brak autoryzacji.' }, { status: 401 })
    }

    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .select('id')
      .eq('id', id)
      .eq('coach_id', user.id)
      .maybeSingle()

    if (athleteError) {
      return NextResponse.json({ error: athleteError.message }, { status: 500 })
    }

    if (!athlete) {
      return NextResponse.json({ error: 'Nie znaleziono zawodnika.' }, { status: 404 })
    }

    if (section === 'races') {
      const { data, error } = await supabase
        .from('athlete_races')
        .select('*')
        .eq('athlete_id', id)
        .order('date', { ascending: true })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ items: data ?? [] })
    }

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('athlete_id', id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: data ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się pobrać danych sekcji.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
