export interface AthleteInjuryRecord {
  id: string
  name: string
  started_at: string | null
  ended_at: string | null
}

function isDateString(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function normalizeName(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function buildId(name: string, startedAt: string | null, index: number): string {
  return `${name.toLowerCase().replace(/\s+/g, '-')}-${startedAt ?? 'unknown'}-${index}`
}

export function parseAthleteInjuryHistory(
  injuryHistory: unknown,
  legacyInjuries: unknown,
): AthleteInjuryRecord[] {
  if (Array.isArray(injuryHistory)) {
    const normalized = injuryHistory.flatMap((item, index) => {
      if (!item || typeof item !== 'object') return []
      const record = item as Record<string, unknown>
      const name = normalizeName(record.name)
      if (!name) return []
      const startedAt = isDateString(record.started_at) ? record.started_at : null
      const endedAt = isDateString(record.ended_at) ? record.ended_at : null
      const id = typeof record.id === 'string' && record.id.trim()
        ? record.id
        : buildId(name, startedAt, index)
      return [{ id, name, started_at: startedAt, ended_at: endedAt }]
    })

    if (normalized.length > 0) return normalized
  }

  if (Array.isArray(legacyInjuries)) {
    return legacyInjuries.flatMap((item, index) => {
      const name = normalizeName(item)
      if (!name) return []
      return [{
        id: buildId(name, null, index),
        name,
        started_at: null,
        ended_at: null,
      }]
    })
  }

  return []
}

export function getActiveAthleteInjuries(history: AthleteInjuryRecord[]): AthleteInjuryRecord[] {
  return history.filter((item) => !item.ended_at)
}

