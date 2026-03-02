'use client'

import { useActionState } from 'react'
import { login } from '@/lib/actions/auth'
import Link from 'next/link'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '52px', height: '52px', background: 'var(--orange)', borderRadius: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ width: '26px', height: '26px' }}>
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
            Strefa<span style={{ color: 'var(--orange)' }}> Trenera</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>
            Zaloguj się do panelu trenera
          </p>
        </div>

        {/* Form */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px' }}>
          <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                autoComplete="current-password"
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
              {pending ? 'Logowanie...' : 'Zaloguj się'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Nie masz konta?{' '}
          <Link href="/register" style={{ color: 'var(--orange)', fontWeight: '600' }}>
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  )
}
