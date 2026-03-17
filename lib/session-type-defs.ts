import { SessionType } from './types'

export const BUILTIN_SESSION_TYPE_KEYS: SessionType[] = ['easy', 'interval', 'tempo', 'long', 'gym', 'bike', 'rest']

export const BUILTIN_TYPE_COLORS: Record<SessionType, string> = {
  easy: '#6366F1',
  interval: '#F97316',
  tempo: '#3B82F6',
  long: '#A855F7',
  gym: '#EAB308',
  bike: '#06B6D4',
  rest: '#6B7280',
}

export type SessionTypeDef = {
  key: string
  label: string
  color?: string
  isBuiltin: boolean
}
