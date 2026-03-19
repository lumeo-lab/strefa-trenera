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

export const SUPPORT_EMAIL = 'kontakt@strefa-trenera.pl'
export const SUPPORT_PHONE = '662-110-067'
export const SUPPORT_WHATSAPP = 'https://wa.me/48662110067'

// Shared avatar gradient colors (used by Avatar component and CoachSidebar)
export const AVATAR_GRADIENTS = [
  'from-orange-500 to-orange-600',
  'from-blue-500 to-blue-600',
  'from-green-500 to-green-600',
  'from-purple-500 to-purple-600',
  'from-pink-500 to-pink-600',
  'from-yellow-500 to-yellow-600',
  'from-red-500 to-red-600',
  'from-teal-500 to-teal-600',
]

export const GRADIENT_MAP: Record<string, string> = {
  orange: 'from-orange-500 to-orange-600',
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  purple: 'from-purple-500 to-purple-600',
  pink: 'from-pink-500 to-pink-600',
  red: 'from-red-500 to-red-600',
  teal: 'from-teal-500 to-teal-600',
  yellow: 'from-yellow-500 to-yellow-600',
}
