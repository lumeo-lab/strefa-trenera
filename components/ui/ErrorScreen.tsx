'use client'

import Link from 'next/link'

type ErrorVariant = 'temporary' | 'access' | 'data'

interface ErrorAction {
  label: string
  href?: string
  onClick?: () => void
  primary?: boolean
}

interface ErrorScreenProps {
  variant?: ErrorVariant
  title?: string
  description?: string
  actions?: ErrorAction[]
  onRetry?: () => void
}

const VARIANT_DEFAULTS: Record<ErrorVariant, { icon: string; title: string; description: string }> = {
  temporary: {
    icon: '⚠️',
    title: 'Coś poszło nie tak',
    description: 'Wystąpił chwilowy problem. Spróbuj odświeżyć stronę — w większości przypadków to wystarczy.',
  },
  access: {
    icon: '🔒',
    title: 'Brak dostępu',
    description: 'Twoja sesja mogła wygasnąć lub nie masz uprawnień do tego zasobu. Zaloguj się ponownie.',
  },
  data: {
    icon: '📡',
    title: 'Problem z ładowaniem danych',
    description: 'Nie udało się pobrać danych. Sprawdź połączenie internetowe i spróbuj ponownie.',
  },
}

export function classifyError(error: Error): ErrorVariant {
  const msg = error.message.toLowerCase()
  if (msg.includes('unauthorized') || msg.includes('auth') || msg.includes('session') || msg.includes('forbidden') || msg.includes('401') || msg.includes('403')) {
    return 'access'
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('timeout') || msg.includes('500') || msg.includes('502') || msg.includes('503')) {
    return 'data'
  }
  return 'temporary'
}

export function ErrorScreen({ variant = 'temporary', title, description, actions, onRetry }: ErrorScreenProps) {
  const defaults = VARIANT_DEFAULTS[variant]

  const finalActions: ErrorAction[] = actions ?? [
    ...(onRetry ? [{ label: 'Spróbuj ponownie', onClick: onRetry, primary: true }] : []),
  ]

  return (
    <div role="alert" className="text-center max-w-md mx-auto">
      <div className="text-5xl mb-4">{defaults.icon}</div>
      <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        {title ?? defaults.title}
      </h2>
      <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {description ?? defaults.description}
      </p>
      {finalActions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {finalActions.map((action) =>
            action.href ? (
              <Link
                key={action.label}
                href={action.href}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                style={action.primary
                  ? { background: '#FF5C1B', color: 'white' }
                  : { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
                }
              >
                {action.label}
              </Link>
            ) : (
              <button
                key={action.label}
                onClick={action.onClick}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
                style={action.primary
                  ? { background: '#FF5C1B', color: 'white', border: 'none' }
                  : { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
                }
              >
                {action.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
