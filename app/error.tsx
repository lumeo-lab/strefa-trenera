'use client'

export default function GlobalError({ error: _error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '32px', background: '#0D0F14', color: '#E8EAF0' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
          Coś poszło nie tak
        </h2>
        <p style={{ fontSize: '14px', color: '#8A92A8', marginBottom: '24px' }}>
          Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę.
        </p>
        <button
          onClick={reset}
          style={{ padding: '10px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, background: '#FF5C1B', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Spróbuj ponownie
        </button>
      </div>
    </div>
  )
}
