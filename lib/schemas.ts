import { z } from 'zod'

// ── Athlete ─────────────────────────────────────────────────────────────────

export const createAthleteSchema = z.object({
  name: z.string().min(1, 'Imię jest wymagane'),
  email: z.string().email('Nieprawidłowy email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  goal: z.string().optional().or(z.literal('')),
  package: z.string().optional(),
  package_price: z.coerce.number().min(0).default(249),
  age: z.coerce.number().int().min(10).max(99).nullable().optional(),
  city: z.string().optional().or(z.literal('')),
  height: z.coerce.number().int().min(100).max(250).nullable().optional(),
  weight: z.coerce.number().min(30).max(300).nullable().optional(),
})

// ── Session ─────────────────────────────────────────────────────────────────

export const createSessionSchema = z.object({
  athlete_id: z.string().uuid('Nieprawidłowy ID zawodnika'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowy format daty'),
  type: z.string().min(1),
  title: z.string().min(1, 'Tytuł jest wymagany'),
  description: z.string().optional().or(z.literal('')),
  planned_distance: z.coerce.number().positive().nullable().optional(),
  planned_duration: z.coerce.number().int().positive().nullable().optional(),
  planned_pace: z.string().optional().or(z.literal('')),
})

// ── Invoice ─────────────────────────────────────────────────────────────────

export const createInvoiceSchema = z.object({
  athlete_id: z.string().uuid('Nieprawidłowy ID zawodnika'),
  amount: z.coerce.number().positive('Kwota musi być większa od 0'),
  description: z.string().optional().or(z.literal('')),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowy format daty'),
  package: z.string().optional().or(z.literal('')),
})

// ── Package ─────────────────────────────────────────────────────────────────

export const createPackageSchema = z.object({
  name: z.string().min(1, 'Nazwa pakietu jest wymagana'),
  description: z.string().optional().or(z.literal('')),
  price: z.coerce.number().min(0, 'Cena musi być >= 0'),
  sessions_per_week: z.coerce.number().int().min(0).optional(),
})

// ── Race ────────────────────────────────────────────────────────────────────

export const createRaceSchema = z.object({
  athlete_id: z.string().uuid(),
  name: z.string().min(1, 'Nazwa zawodów jest wymagana'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  distance: z.string().optional().or(z.literal('')),
  goal_time: z.string().optional().or(z.literal('')),
  result: z.string().optional().or(z.literal('')),
  status: z.enum(['planned', 'completed', 'dns', 'dnf']).default('planned'),
  notes: z.string().optional().or(z.literal('')),
})

// ── Feedback ────────────────────────────────────────────────────────────────

export const createFeedbackSchema = z.object({
  athlete_id: z.string().uuid(),
  coach_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.enum(['text', 'voice']).default('text'),
  transcript: z.string().optional().or(z.literal('')),
  session_id: z.string().uuid().nullable().optional(),
})

// ── Message ─────────────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  athlete_id: z.string().uuid(),
  content: z.string().min(1, 'Treść wiadomości jest wymagana'),
})

// ── Helper ──────────────────────────────────────────────────────────────────

/** Extract FormData into object and validate with Zod schema */
export function validateFormData<T>(schema: z.ZodSchema<T>, formData: FormData): { data: T } | { error: string } {
  const raw: Record<string, unknown> = {}
  formData.forEach((value, key) => {
    if (value === '') raw[key] = undefined
    else raw[key] = value
  })
  const result = schema.safeParse(raw)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    return { error: firstIssue?.message ?? 'Nieprawidłowe dane' }
  }
  return { data: result.data }
}
