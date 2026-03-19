'use client'

import { useActionState, useState } from 'react'
import { login, resetPassword } from '@/lib/actions/auth'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { INPUT_STYLE } from '@/lib/styles'

const inputClass = 'w-full px-3.5 py-3 rounded-xl text-sm'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null)
  const [showReset, setShowReset] = useState(false)
  const [resetState, resetAction, resetPending] = useActionState(resetPassword, null)

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3.5">
            <Logo size="xl" />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Wróć do swojego panelu trenera
          </p>
        </div>

        {/* Login Form */}
        {!showReset ? (
          <div className="rounded-2xl p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <form action={formAction} className="flex flex-col gap-4">
              <div>
                <label htmlFor="login-email" className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Email</label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  placeholder="twoj@email.com"
                  className={inputClass}
                  style={INPUT_STYLE}
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Hasło</label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Twoje hasło"
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
                {pending ? 'Logowanie...' : 'Zaloguj się'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setShowReset(true)}
              className="block w-full text-center text-sm mt-4 cursor-pointer hover:opacity-80"
              style={{ color: 'var(--text-muted)', background: 'none', border: 'none' }}
            >
              Nie pamiętam hasła
            </button>
          </div>
        ) : (
          /* Reset Password Form */
          <div className="rounded-2xl p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-base font-semibold mb-1">Resetowanie hasła</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              Podaj email, a wyślemy Ci link do zmiany hasła.
            </p>

            {resetState?.success ? (
              <div>
                <div className="px-3.5 py-3 rounded-xl text-sm mb-4" style={{ background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.22)', color: '#2ECC71' }}>
                  Link do zresetowania hasła został wysłany na Twój email.
                </div>
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                  Nie widzisz wiadomości? Sprawdź folder spam lub spróbuj ponownie za kilka minut.
                </p>
                <button
                  type="button"
                  onClick={() => setShowReset(false)}
                  className="w-full py-3 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                >
                  Wróć do logowania
                </button>
              </div>
            ) : (
              <form action={resetAction} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="reset-email" className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Email</label>
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    autoFocus
                    placeholder="twoj@email.com"
                    className={inputClass}
                    style={INPUT_STYLE}
                  />
                </div>

                {resetState?.error && (
                  <p role="alert" className="text-[13px] m-0 px-3.5 py-2.5 rounded-lg" style={{ color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                    {resetState.error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={resetPending}
                  className="w-full py-3.5 rounded-xl text-[15px] font-semibold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 transition-opacity hover:opacity-90"
                  style={{ background: 'var(--orange)', border: 'none' }}
                >
                  {resetPending ? 'Wysyłanie...' : 'Wyślij link resetujący'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowReset(false)}
                  className="text-sm cursor-pointer hover:opacity-80"
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none' }}
                >
                  ← Wróć do logowania
                </button>
              </form>
            )}
          </div>
        )}

        <p className="text-center mt-5 text-sm" style={{ color: 'var(--text-muted)' }}>
          Nie masz konta?{' '}
          <Link href="/register" style={{ color: 'var(--orange)', fontWeight: 600 }}>
            Zarejestruj się
          </Link>
        </p>

        <div className="flex items-center justify-center gap-4 mt-6 text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
          <span>🔒 Bezpieczne logowanie</span>
          <span>·</span>
          <span>Dane szyfrowane</span>
        </div>
      </div>
    </div>
  )
}
