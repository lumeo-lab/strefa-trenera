export const BUSINESS_TIME_ZONE = 'Europe/Warsaw'

function getDateParts(date: Date, timeZone = BUSINESS_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  return {
    year: parts.find((part) => part.type === 'year')?.value ?? '1970',
    month: parts.find((part) => part.type === 'month')?.value ?? '01',
    day: parts.find((part) => part.type === 'day')?.value ?? '01',
  }
}

export function toBusinessDate(date: Date, timeZone = BUSINESS_TIME_ZONE): string {
  const { year, month, day } = getDateParts(date, timeZone)
  return `${year}-${month}-${day}`
}

export function getBusinessToday(timeZone = BUSINESS_TIME_ZONE): string {
  return toBusinessDate(new Date(), timeZone)
}

export function addDaysToBusinessDate(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return toBusinessDate(date)
}

export function getBusinessWeekday(date = new Date(), timeZone = BUSINESS_TIME_ZONE): number {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  }).format(date)

  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 0,
  }

  return map[weekday] ?? 0
}
