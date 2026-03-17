import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const customTypeSchema = z.object({
  key: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(120),
  color: z.string().trim().regex(/^#([A-Fa-f0-9]{6})$/, 'Nieprawidłowy kolor'),
  position: z.number().int().min(0).optional(),
})

const payloadSchema = z.object({
  overrides: z.record(z.string(), z.string().trim().min(1).max(120)),
  custom: z.array(customTypeSchema),
})

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Brak autoryzacji.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('coach_session_types')
    .select('key, label, color, is_builtin, position')
    .eq('coach_id', user.id)
    .order('position', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Brak autoryzacji.' }, { status: 401 })
  }

  const json = await req.json().catch(() => null)
  const parsed = payloadSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane typów sesji.' },
      { status: 400 },
    )
  }

  const { overrides, custom } = parsed.data
  const rows = [
    ...Object.entries(overrides).map(([key, label], index) => ({
      coach_id: user.id,
      key,
      label,
      color: null as string | null,
      is_builtin: true,
      position: index,
    })),
    ...custom.map((type, index) => ({
      coach_id: user.id,
      key: type.key,
      label: type.label,
      color: type.color,
      is_builtin: false,
      position: Object.keys(overrides).length + (type.position ?? index),
    })),
  ]

  const { error: deleteError } = await supabase
    .from('coach_session_types')
    .delete()
    .eq('coach_id', user.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from('coach_session_types').insert(rows)
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
