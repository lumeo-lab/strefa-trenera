'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { classifyError, ErrorScreen } from '@/components/ui/ErrorScreen'

export default function AthleteError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('AthleteError:', error) }, [error])

  const pathname = usePathname()
  const slug = pathname.split('/')[2] ?? ''
  const variant = classifyError(error)

  const accessActions = [
    { label: 'Spróbuj ponownie', onClick: reset, primary: true },
    { label: 'Wróć na start', href: `/u/${slug}` },
  ]

  const defaultActions = [
    { label: 'Spróbuj ponownie', onClick: reset, primary: true },
    { label: 'Wróć do dziś', href: `/u/${slug}` },
    { label: 'Napisz do trenera', href: `/u/${slug}/chat` },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--bg-base)' }}>
      <ErrorScreen
        variant={variant}
        title={variant === 'access' ? 'Sesja wygasła' : variant === 'data' ? 'Błąd ładowania' : 'Coś poszło nie tak'}
        description={variant === 'access'
          ? 'Twoja sesja wygasła. Kliknij ponownie link od trenera, żeby się zalogować.'
          : variant === 'data'
          ? 'Nie udało się załadować danych. Sprawdź połączenie i spróbuj ponownie.'
          : 'Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę.'
        }
        actions={variant === 'access' ? accessActions : defaultActions}
      />
    </div>
  )
}
