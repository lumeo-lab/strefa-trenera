import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { BUILTIN_ATHLETE_STATUS_KEYS, BUILTIN_STATUS_COLORS, DEFAULT_STATUSES } from '@/lib/athlete-status-defs'

const payloadSchema = z.object({
  builtins: z.array(z.any()).optional(),
  custom: z.array(z.any()).optional(),
})

function normalizeColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#([A-Fa-f0-9]{6})$/.test(value.trim()) ? value.trim() : fallback
}

function normalizeLabel(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim().slice(0, 120) : fallback
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Brak autoryzacji.' }, { status: 401 })

    const { data, error } = await supabase
      .from('coach_athlete_statuses')
      .select('key, label, color, is_builtin, position')
      .eq('coach_id', user.id)
      .order('position', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ items: data ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się pobrać statusów.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Brak autoryzacji.' }, { status: 401 })

    const json = await req.json().catch(() => null)
    const parsed = payloadSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane statusów.' },
        { status: 400 },
      )
    }

    const { data: coachRow, error: coachError } = await adminClient
      .from('coaches')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (coachError) return NextResponse.json({ error: coachError.message }, { status: 500 })
    if (!coachRow) return NextResponse.json({ error: 'Nie znaleziono profilu trenera.' }, { status: 400 })

    const builtins = DEFAULT_STATUSES.map((status, index) => {
      const incoming = parsed.data.builtins?.find((item) => item?.key === status.key)
      return {
        key: status.key,
        label: normalizeLabel(incoming?.label, status.label),
        color: normalizeColor(incoming?.color, BUILTIN_STATUS_COLORS[status.key]),
        position: index,
      }
    })

    const custom = (parsed.data.custom ?? [])
      .map((item, index) => {
        const key = typeof item?.key === 'string' && item.key.trim().length > 0 ? item.key.trim().slice(0, 120) : `custom_${index}`
        return {
          key,
          label: normalizeLabel(item?.label, 'Nowy status'),
          color: normalizeColor(item?.color, '#3B82F6'),
          position: typeof item?.position === 'number' ? item.position : builtins.length + index,
        }
      })
      .filter((item) => !BUILTIN_ATHLETE_STATUS_KEYS.includes(item.key))

    const rows = [
      ...builtins.map((status, index) => ({
        coach_id: user.id,
        key: status.key,
        label: status.label,
        color: status.color,
        is_builtin: true,
        position: index,
      })),
      ...custom.map((status, index) => ({
        coach_id: user.id,
        key: status.key,
        label: status.label,
        color: status.color,
        is_builtin: false,
        position: builtins.length + (status.position ?? index),
      })),
    ]

    const { error: deleteError } = await adminClient
      .from('coach_athlete_statuses')
      .delete()
      .eq('coach_id', user.id)

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

    if (rows.length > 0) {
      const { error: insertError } = await adminClient.from('coach_athlete_statuses').insert(rows)
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się zapisać statusów.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
