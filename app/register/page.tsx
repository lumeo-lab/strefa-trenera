'use client'

import { useActionState } from 'react'
import { register } from '@/lib/actions/auth'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { INPUT_STYLE } from '@/lib/styles'

const inputClass = 'w-full px-3.5 py-3 rounded-xl text-sm'

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(register, null)

  // Email confirmation required — show info instead of form
  if (state?.success && state?.needsConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-base)' }}>
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3.5">
              <Logo size="xl" />
            </div>
          </div>
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-4xl mb-4">📧</div>
            <h2 className="text-lg font-semibold mb-2">Sprawdź swoją skrzynkę email</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Wysłaliśmy link potwierdzający na Twój adres email. Kliknij w niego, żeby aktywować konto i zacząć korzystać z panelu.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'var(--orange)', color: 'white' }}
            >
              Przejdź do logowania
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3.5">
            <Logo size="xl" />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Dołącz bezpłatnie — zacznij w 60 sekund
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <form action={formAction} className="flex flex-col gap-4">
            <div>
              <label htmlFor="reg-name" className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Imię i nazwisko</label>
              <input
                id="reg-name"
                name="name"
                type="text"
                required
                autoFocus
                placeholder="np. Tomasz Kowalski"
                className={inputClass}
                style={INPUT_STYLE}
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Email</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="twoj@email.com"
                className={inputClass}
                style={INPUT_STYLE}
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Hasło</label>
              <input
                id="reg-password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                placeholder="min. 6 znaków"
                className={inputClass}
                style={INPUT_STYLE}
              />
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Powtórz hasło</label>
              <input
                id="reg-confirm"
                name="confirm_password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                placeholder="Wpisz hasło ponownie"
                className={inputClass}
                style={INPUT_STYLE}
              />
            </div>

            {state?.error && (
              <p role="alert" className="text-[13px] m-0 px-3.5 py-2.5 rounded-lg" style={{ color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full py-3.5 rounded-xl text-[15px] font-semibold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 transition-opacity hover:opacity-90 mt-1"
              style={{ background: 'var(--orange)', border: 'none' }}
            >
              {pending ? 'Tworzenie konta...' : 'Zarejestruj się za darmo'}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-sm" style={{ color: 'var(--text-muted)' }}>
          Masz już konto?{' '}
          <Link href="/login" style={{ color: 'var(--orange)', fontWeight: 600 }}>
            Zaloguj się
          </Link>
        </p>

        <div className="flex flex-col items-center gap-1.5 mt-6 text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
          <div className="flex items-center gap-4">
            <span>✓ Bezpłatnie do 2 zawodników</span>
            <span>·</span>
            <span>✓ Bez karty kredytowej</span>
          </div>
          <span>🔒 Dane szyfrowane · Prywatność gwarantowana</span>
        </div>
      </div>
    </div>
  )
}
