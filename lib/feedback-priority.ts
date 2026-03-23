import type { FeedbackRow } from './supabase/database.types'

// ── Priority levels ─────────────────────────────────────────────────────────

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low'

export type PriorityResult = {
  score: number
  level: PriorityLevel
  reasons: string[]
}

// ── Scoring ─────────────────────────────────────────────────────────────────

const SCORE_SIGNAL_RED = 50
const SCORE_SIGNAL_YELLOW = 25
const SCORE_PAIN = 35
const SCORE_RPE_9_10 = 25
const SCORE_RPE_8 = 15
const SCORE_NO_REPLY = 20
const SCORE_UNREAD = 15
const SCORE_RECENT_24H = 10

const LEVEL_CRITICAL = 80
const LEVEL_HIGH = 50
const LEVEL_MEDIUM = 25

/** Compute priority score + human-readable reasons for a single feedback */
export function getFeedbackPriority(fb: FeedbackRow, now?: Date): PriorityResult {
  let score = 0
  const reasons: string[] = []

  // Signal
  if (fb.signal === 'red') {
    score += SCORE_SIGNAL_RED
    reasons.push('Czerwony sygnał')
  } else if (fb.signal === 'yellow') {
    score += SCORE_SIGNAL_YELLOW
    reasons.push('Żółty sygnał')
  }

  // Pain
  if (fb.pain_flag) {
    score += SCORE_PAIN
    const painText = fb.pain_note && fb.pain_note.length > 30 ? fb.pain_note.slice(0, 30) + '…' : fb.pain_note
    reasons.push(painText ? `Ból: ${painText}` : 'Ból zgłoszony')
  }

  // RPE
  if (fb.rpe != null) {
    if (fb.rpe >= 9) {
      score += SCORE_RPE_9_10
      reasons.push(`RPE ${fb.rpe}/10`)
    } else if (fb.rpe === 8) {
      score += SCORE_RPE_8
      reasons.push(`RPE ${fb.rpe}/10`)
    }
  }

  // No reply
  if (!fb.coach_reply) {
    score += SCORE_NO_REPLY
    reasons.push('Brak odpowiedzi')
  }

  // Unread
  if (!fb.read) {
    score += SCORE_UNREAD
    reasons.push('Nowy')
  }

  // Recency (last 24h)
  const ref = now ?? new Date()
  const created = new Date(fb.created_at)
  const hoursDiff = (ref.getTime() - created.getTime()) / (1000 * 60 * 60)
  if (hoursDiff <= 24) {
    score += SCORE_RECENT_24H
  }

  return {
    score,
    level: scoreToLevel(score),
    reasons,
  }
}

function scoreToLevel(score: number): PriorityLevel {
  if (score >= LEVEL_CRITICAL) return 'critical'
  if (score >= LEVEL_HIGH) return 'high'
  if (score >= LEVEL_MEDIUM) return 'medium'
  return 'low'
}

// ── Display helpers ─────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<PriorityLevel, string> = {
  critical: 'Pilne',
  high: 'Do sprawdzenia',
  medium: 'Do wglądu',
  low: '',
}

const LEVEL_COLORS: Record<PriorityLevel, { bg: string; text: string }> = {
  critical: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
  high: { bg: 'rgba(255,92,27,0.12)', text: '#FF5C1B' },
  medium: { bg: 'rgba(234,179,8,0.12)', text: '#ca8a04' },
  low: { bg: 'transparent', text: 'transparent' },
}

export function getPriorityLabel(level: PriorityLevel): string {
  return LEVEL_LABELS[level]
}

export function getPriorityColors(level: PriorityLevel): { bg: string; text: string } {
  return LEVEL_COLORS[level]
}

// ── Sort comparator ─────────────────────────────────────────────────────────

/** Sort feedbacks by priority score (highest first), then by created_at (newest first) */
export function comparePriority(
  a: { score: number; created_at: string },
  b: { score: number; created_at: string },
): number {
  if (a.score !== b.score) return b.score - a.score
  return b.created_at.localeCompare(a.created_at)
}

// ── Group label for sidebar separators ──────────────────────────────────────

const GROUP_LABELS: Record<PriorityLevel, string> = {
  critical: 'Pilne',
  high: 'Do sprawdzenia',
  medium: 'Średni priorytet',
  low: 'Informacyjne',
}

export function getPriorityGroupLabel(level: PriorityLevel): string {
  return GROUP_LABELS[level]
}
