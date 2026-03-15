import { SessionType } from './types'

export const FEELING_LABELS: Record<string, string> = {
  '😫': 'Fatalnie',
  '😕': 'Słabo',
  '😐': 'Średnio',
  '😊': 'Dobrze',
  '🤩': 'Świetnie',
}

export const SESSION_TYPES: SessionType[] = ['easy', 'interval', 'tempo', 'long', 'rest', 'gym']

// Server Action error messages
export const AUTH_ERROR = 'Brak autoryzacji'
export const FIELDS_ERROR = 'Brak wymaganych pól'
