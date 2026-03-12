'use client'

import { useActionState } from 'react'
import { register } from '@/lib/actions/auth'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(register, null)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <Logo size="xl" />
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>
            Dołącz bezpłatnie — zacznij w 60 sekund
          </p>
        </div>

        {/* Form */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px' }}>
          <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Imię i nazwisko
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="np. Tomasz Kowalski"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-mid)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-mid)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Hasło
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                placeholder="min. 6 znaków"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-mid)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {state?.error && (
              <p style={{ color: '#f87171', fontSize: '13px', margin: 0, padding: '10px 14px', background: 'rgba(248,113,113,0.08)', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.2)' }}>
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              style={{
                width: '100%',
                padding: '13px',
                background: 'var(--orange)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: pending ? 'not-allowed' : 'pointer',
                opacity: pending ? 0.7 : 1,
                marginTop: '4px',
              }}
            >
              {pending ? 'Tworzenie konta...' : 'Zarejestruj się za darmo'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Masz już konto?{' '}
          <Link href="/login" style={{ color: 'var(--orange)', fontWeight: '600' }}>
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  )
}
