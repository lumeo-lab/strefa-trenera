import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Brak autoryzacji.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('coach_week_templates')
    .select('id, name, created_at, coach_week_template_items(count)')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const items = (data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    created_at: t.created_at,
    itemCount: Array.isArray(t.coach_week_template_items) && typeof (t.coach_week_template_items[0] as Record<string, unknown>)?.count === 'number' ? (t.coach_week_template_items[0] as Record<string, unknown>).count as number : 0,
  }))

  return NextResponse.json({ items })
}
