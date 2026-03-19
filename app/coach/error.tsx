'use client'

import { useEffect } from 'react'
import { classifyError, ErrorScreen } from '@/components/ui/ErrorScreen'

export default function CoachError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('CoachError:', error) }, [error])

  const variant = classifyError(error)

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <ErrorScreen
        variant={variant}
        actions={[
          { label: 'Spróbuj ponownie', onClick: reset, primary: true },
          { label: 'Dashboard', href: '/coach/dashboard' },
          { label: 'Zawodnicy', href: '/coach/athletes' },
          ...(variant === 'access' ? [{ label: 'Zaloguj się', href: '/login' }] : []),
        ]}
      />
    </div>
  )
}
