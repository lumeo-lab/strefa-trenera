import { FEELING_LABELS } from './constants'
import type { FeedbackRow } from './supabase/database.types'
import { parseFeedbackTranscript } from './utils'

// ── Display data: structural fields first, parser fallback ──────────────────

export interface FeedbackDisplayData {
  feeling: string        // emoji
  feelingLabel: string   // "Dobrze", "Słabo" etc.
  rpe: string
  pain: string
  notes: string
  voice: string
  trainingType: string
  distance: string
  duration: string
  intensity: string
}

/** Build display data preferring structural DB fields, falling back to transcript parser for old records */
export function getFeedbackDisplayData(fb: FeedbackRow): FeedbackDisplayData {
  const parsed = parseFeedbackTranscript(fb.transcript ?? '')

  const feeling = fb.feeling || parsed.feeling || ''
  const rpe = fb.rpe != null ? `${fb.rpe}/10` : parsed.rpe || ''
  const painRaw = fb.pain_flag ? (fb.pain_note || 'Tak') : parsed.pain || ''
  const notes = fb.notes_structured || parsed.notes || ''
  const voice = fb.voice_transcript || parsed.voice || ''

  return {
    feeling,
    feelingLabel: feeling ? (FEELING_LABELS[feeling] ?? '') : '',
    rpe,
    pain: painRaw,
    notes,
    voice,
    // These don't have structural fields — always from parser
    trainingType: parsed.trainingType,
    distance: parsed.distance,
    duration: parsed.duration,
    intensity: parsed.intensity,
  }
}

/** Check if feedback has any displayable structured content (excluding voice) */
export function hasDisplayContent(d: FeedbackDisplayData): boolean {
  return !!(d.feeling || d.rpe || d.pain || d.trainingType || d.distance || d.duration || d.intensity || d.notes)
}

// ── Source label ─────────────────────────────────────────────────────────────

export function getSourceLabel(fb: FeedbackRow, display: FeedbackDisplayData): string {
  const hasText = !!(display.feeling || display.rpe || display.pain || display.trainingType || display.distance || display.duration || display.intensity || display.notes)
  if (hasText && display.voice) return '📝🎤 Tekst + głos'
  if (display.voice) return '🎤 Głos'
  if (fb.source === 'auto') return '⌚ Zegarek'
  return '✏️ Tekst'
}

// ── Sidebar label (compact one-liner) ───────────────────────────────────────

export function getFeedbackLabel(display: FeedbackDisplayData): string {
  const parts: string[] = []
  if (display.feeling) parts.push(display.feeling)
  if (display.rpe) parts.push(display.rpe)
  if (display.trainingType) parts.push(display.trainingType)
  if (!parts.length && display.voice) return 'Komentarz głosowy'
  if (!parts.length && display.notes) return 'Notatka'
  return parts.join(' · ') || 'Feedback'
}

// ── Preview text for sidebar ────────────────────────────────────────────────

export function getFeedbackPreview(display: FeedbackDisplayData, maxLen = 70): string {
  const text = display.notes || display.voice || ''
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

// ── Actuals: unified from Strava / session / watch_data ─────────────────────

export type StravaData = {
  distance: number | null
  moving_time: number | null
  average_speed: number | null
  average_heartrate: number | null
  max_heartrate: number | null
  total_elevation_gain: number | null
}

export type SessionActuals = {
  actual_distance: number | null
  actual_duration: number | null
  actual_pace: string | null
  avg_hr: number | null
  max_hr: number | null
}

export type ActualsDisplay = {
  source: 'strava' | 'session' | 'watch' | null
  distance: number | null     // always km
  duration: number | null      // always minutes
  pace: string | null
  avgHr: number | null
  maxHr: number | null
  elevation: number | null
}

/** Get unified actuals from the best available source. Priority: Strava > session > watch_data */
export function getActualsDisplay(
  strava: StravaData | null,
  session: SessionActuals | null,
  watchData: Record<string, unknown> | null,
): ActualsDisplay {
  // Strava: distance in meters, moving_time in seconds
  if (strava && (strava.distance != null || strava.moving_time != null || strava.average_heartrate != null)) {
    return {
      source: 'strava',
      distance: strava.distance != null ? strava.distance / 1000 : null,
      duration: strava.moving_time != null ? strava.moving_time / 60 : null,
      pace: strava.average_speed && strava.average_speed > 0 ? formatPace(strava.average_speed) : null,
      avgHr: strava.average_heartrate,
      maxHr: strava.max_heartrate,
      elevation: strava.total_elevation_gain,
    }
  }

  // Session: actual_distance stored in km (from athlete form input as km float)
  if (session && (session.actual_distance != null || session.actual_duration != null || session.avg_hr != null)) {
    return {
      source: 'session',
      distance: session.actual_distance,
      duration: session.actual_duration,
      pace: session.actual_pace,
      avgHr: session.avg_hr,
      maxHr: session.max_hr,
      elevation: null,
    }
  }

  // Watch data: legacy JSONB
  const wd = watchData as { avgHR?: number; maxHR?: number; distance?: number; elevation?: number; pace?: string } | null
  if (wd && (wd.distance != null || wd.avgHR != null || wd.pace)) {
    return {
      source: 'watch',
      distance: wd.distance ?? null,
      duration: null,
      pace: wd.pace ?? null,
      avgHr: wd.avgHR ?? null,
      maxHr: wd.maxHR ?? null,
      elevation: wd.elevation ?? null,
    }
  }

  return { source: null, distance: null, duration: null, pace: null, avgHr: null, maxHr: null, elevation: null }
}

export function hasActuals(a: ActualsDisplay): boolean {
  return a.distance != null || a.duration != null || !!a.pace || a.avgHr != null || a.maxHr != null || a.elevation != null
}

// ── Summary chips for detail panel ──────────────────────────────────────────

export type SummaryChip = { label: string; color: string }

/** Build summary chips highlighting key signals for the detail panel header area */
export function getFeedbackSummaryChips(fb: FeedbackRow, hasStravaData: boolean): SummaryChip[] {
  const chips: SummaryChip[] = []

  if (fb.signal === 'red') chips.push({ label: 'Czerwony sygnał', color: '#ef4444' })
  else if (fb.signal === 'yellow') chips.push({ label: 'Żółty sygnał', color: '#ca8a04' })

  if (fb.pain_flag) {
    const painText = fb.pain_note && fb.pain_note.length > 30 ? fb.pain_note.slice(0, 30) + '…' : fb.pain_note
    chips.push({ label: painText ? `Ból: ${painText}` : 'Ból zgłoszony', color: '#ef4444' })
  }

  if (fb.rpe != null && fb.rpe >= 7) {
    chips.push({ label: `RPE ${fb.rpe}/10`, color: fb.rpe >= 9 ? '#ef4444' : '#ca8a04' })
  }

  if (!fb.coach_reply) chips.push({ label: 'Brak odpowiedzi', color: '#FF5C1B' })

  if (hasStravaData) chips.push({ label: 'Strava', color: '#FC5200' })

  return chips
}

// ── Reply templates ─────────────────────────────────────────────────────────

export const REPLY_TEMPLATES = [
  { label: 'Dobra robota!', text: 'Świetna robota! Tak trzymaj.' },
  { label: 'Zwolnij tempo', text: 'Widzę, że dawka była duża. Następnym razem zwolnij tempo i skup się na regeneracji.' },
  { label: 'Zgłoś się na wizytę', text: 'Ból wymaga uwagi. Umów się na wizytę u fizjoterapeuty i daj znać jak będzie.' },
  { label: 'Odpoczywaj', text: 'Organizm daje sygnały. Dziś i jutro lekko — regeneracja jest częścią treningu.' },
  { label: 'Doprecyzuj', text: 'Dzięki za feedback. Możesz doprecyzować co dokładnie czułeś podczas treningu?' },
  { label: 'Porozmawiajmy', text: 'Muszę lepiej zrozumieć sytuację. Odezwę się na czacie.' },
] as const

// ── Formatting helpers ──────────────────────────────────────────────────────

export function formatDuration(minutes: number): string {
  if (minutes < 0) minutes = 0
  const totalMin = Math.round(minutes)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} min`
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function formatPace(avgSpeedMs: number): string {
  if (!avgSpeedMs || avgSpeedMs <= 0) return '–'
  const paceSecondsPerKm = 1000 / avgSpeedMs
  if (paceSecondsPerKm > 3600) return '–' // slower than 60 min/km = invalid
  const min = Math.floor(paceSecondsPerKm / 60)
  const sec = Math.round(paceSecondsPerKm % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}
