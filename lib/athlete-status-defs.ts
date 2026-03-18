export const DEFAULT_STATUSES = [
  { key: 'ok', label: 'OK', color: '#2ECC71' },
  { key: 'warning', label: 'Pod obserwacją', color: '#F1C40F' },
  { key: 'alert', label: 'Kontuzja', color: '#E74C3C' },
  { key: 'inactive', label: 'Przerwa', color: '#6B7280' },
] as const

export type StatusDef = { key: string; label: string; color: string }

export const BUILTIN_ATHLETE_STATUS_KEYS = DEFAULT_STATUSES.map((status) => status.key)

export const BUILTIN_STATUS_COLORS = Object.fromEntries(
  DEFAULT_STATUSES.map((status) => [status.key, status.color]),
) as Record<string, string>
