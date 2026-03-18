import { z } from 'zod'

const optionalTrimmedString = (max: number) =>
  z.preprocess(
    (value) => typeof value === 'string' ? value.trim().slice(0, max) : value,
    z.string().max(max).optional().or(z.literal(''))
  )

const nullableInt = (min?: number, max?: number) =>
  z.preprocess((value) => {
    if (value === '' || value === undefined || value === null) return null
    return value
  }, z.coerce.number().int().refine((n) => (min === undefined || n >= min) && (max === undefined || n <= max), 'Nieprawidłowa liczba').nullable())

const nullableNumber = (min?: number, max?: number) =>
  z.preprocess((value) => {
    if (value === '' || value === undefined || value === null) return null
    return value
  }, z.coerce.number().refine((n) => (min === undefined || n >= min) && (max === undefined || n <= max), 'Nieprawidłowa liczba').nullable())

const nullableDateString = z.preprocess(
  (value) => value === '' ? undefined : value,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowy format daty').optional()
)

// ── Athlete ─────────────────────────────────────────────────────────────────

export const createAthleteSchema = z.object({
  name: z.preprocess((value) => typeof value === 'string' ? value.trim().slice(0, 200) : value, z.string().min(1, 'Imię jest wymagane').max(200)),
  email: z.preprocess(
    (value) => typeof value === 'string' ? value.trim().slice(0, 200) : value,
    z.string().email('Nieprawidłowy email').optional().or(z.literal(''))
  ),
  phone: optionalTrimmedString(50),
  goal: optionalTrimmedString(500),
  package: optionalTrimmedString(100),
  package_price: z.coerce.number().min(0, 'Cena nie może być ujemna').default(249),
  age: nullableInt(10, 99).optional(),
  city: optionalTrimmedString(200),
  height: nullableInt(100, 250).optional(),
  weight: nullableNumber(30, 300).optional(),
})

export const updateAthleteSchema = z.object({
  id: z.string().uuid('Nieprawidłowy ID zawodnika'),
  name: optionalTrimmedString(200),
  email: z.preprocess(
    (value) => typeof value === 'string' ? value.trim().slice(0, 200) : value,
    z.string().email('Nieprawidłowy email').optional().or(z.literal(''))
  ),
  phone: optionalTrimmedString(50),
  goal: optionalTrimmedString(500),
  package: optionalTrimmedString(100),
  city: optionalTrimmedString(200),
  coach_notes: optionalTrimmedString(5000),
  join_date: nullableDateString,
  age: nullableInt(10, 99).optional(),
  height: nullableInt(100, 250).optional(),
  weight: nullableNumber(30, 300).optional(),
  package_price: z.preprocess((value) => value === '' ? undefined : value, z.coerce.number().min(0, 'Cena nie może być ujemna').optional()),
  status: z.preprocess(
    (value) => typeof value === 'string' ? value.trim().slice(0, 120) : value,
    z.string().min(1, 'Status jest wymagany').max(120).optional()
  ),
})

// ── Session ─────────────────────────────────────────────────────────────────

export const createSessionSchema = z.object({
  athlete_id: z.string().uuid('Nieprawidłowy ID zawodnika'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowy format daty'),
  type: z.preprocess((value) => typeof value === 'string' ? value.trim().slice(0, 50) : value, z.string().min(1).max(50)),
  title: z.preprocess((value) => typeof value === 'string' ? value.trim().slice(0, 200) : value, z.string().min(1, 'Tytuł jest wymagany').max(200)),
  description: optionalTrimmedString(5000),
  planned_distance: nullableNumber(0).optional(),
  planned_duration: nullableInt(0).optional(),
  planned_pace: optionalTrimmedString(50),
  url: optionalTrimmedString(1000),
  url_label: optionalTrimmedString(120),
  completed: z.preprocess((value) => value === 'true' || value === true, z.boolean()).optional(),
  actual_distance: nullableNumber(0).optional(),
  actual_duration: nullableInt(0).optional(),
  actual_pace: optionalTrimmedString(50),
  avg_hr: nullableInt(0, 260).optional(),
  max_hr: nullableInt(0, 260).optional(),
})

export const updateSessionSchema = createSessionSchema.extend({
  id: z.string().uuid('Nieprawidłowy ID sesji'),
})

// ── Invoice ─────────────────────────────────────────────────────────────────

export const createInvoiceSchema = z.object({
  athlete_id: z.string().uuid('Nieprawidłowy ID zawodnika'),
  amount: z.coerce.number().positive('Kwota musi być większa od 0'),
  description: optionalTrimmedString(1000),
  due_date: nullableDateString,
  package: optionalTrimmedString(100),
})

export const updateInvoiceSchema = z.object({
  description: optionalTrimmedString(1000),
  amount: z.coerce.number().positive('Kwota musi być większa od 0'),
  due_date: nullableDateString,
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']),
})

// ── Package ─────────────────────────────────────────────────────────────────

export const createPackageSchema = z.object({
  name: z.preprocess((value) => typeof value === 'string' ? value.trim().slice(0, 120) : value, z.string().min(1, 'Nazwa pakietu jest wymagana').max(120)),
  description: optionalTrimmedString(1000),
  price: z.coerce.number().min(0, 'Cena musi być >= 0'),
})

export const updatePackageSchema = createPackageSchema.extend({
  id: z.string().uuid('Nieprawidłowy ID pakietu'),
})

// ── Race ────────────────────────────────────────────────────────────────────

export const createRaceSchema = z.object({
  athlete_id: z.string().uuid('Nieprawidłowy ID zawodnika'),
  name: z.preprocess((value) => typeof value === 'string' ? value.trim().slice(0, 200) : value, z.string().min(1, 'Nazwa zawodów jest wymagana').max(200)),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  distance: optionalTrimmedString(100),
  goal_time: optionalTrimmedString(100),
  result: optionalTrimmedString(100),
  status: z.enum(['planned', 'completed', 'dns', 'dnf']).default('planned'),
  notes: optionalTrimmedString(2000),
})

export const updateRaceSchema = createRaceSchema.extend({
  id: z.string().uuid('Nieprawidłowy ID zawodów'),
})

// ── Feedback ────────────────────────────────────────────────────────────────

export const createFeedbackSchema = z.object({
  slug: z.preprocess((value) => typeof value === 'string' ? value.trim().slice(0, 120) : value, z.string().min(1, 'Brak slug').max(120)),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowy format daty'),
  session_id: z.preprocess((value) => value === '' ? null : value, z.string().uuid().nullable().optional()),
})

export const updateFeedbackSchema = createFeedbackSchema.extend({
  id: z.string().uuid('Nieprawidłowy ID feedbacku'),
})

export const replyFeedbackSchema = z.object({
  id: z.string().uuid('Nieprawidłowy ID feedbacku'),
  athlete_id: z.string().uuid('Nieprawidłowy ID zawodnika'),
  reply: z.preprocess((value) => typeof value === 'string' ? value.trim().slice(0, 2000) : value, z.string().min(1, 'Treść odpowiedzi jest wymagana').max(2000)),
})

// ── Message ─────────────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  athlete_id: z.string().uuid('Nieprawidłowy ID zawodnika'),
  content: z.preprocess((value) => typeof value === 'string' ? value.trim().slice(0, 5000) : value, z.string().min(1, 'Treść wiadomości jest wymagana').max(5000)),
  coach_name: optionalTrimmedString(120),
})

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']),
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
