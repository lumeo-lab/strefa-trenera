'use client'

import { useEffect } from 'react'
import { classifyError, ErrorScreen } from '@/components/ui/ErrorScreen'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('GlobalError:', error) }, [error])

  const variant = classifyError(error)

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#0D0F14', color: '#E8EAF0' }}>
      <ErrorScreen
        variant={variant}
        onRetry={reset}
        actions={[
          { label: 'Spróbuj ponownie', onClick: reset, primary: true },
          { label: 'Strona główna', href: '/' },
        ]}
      />
    </div>
  )
}
