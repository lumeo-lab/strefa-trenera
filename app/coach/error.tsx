'use client'

export default function CoachError({ error, reset }: { error: Error; reset: () => void }) {
  void error
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Coś poszło nie tak
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: '#FF5C1B', color: 'white' }}
        >
          Spróbuj ponownie
        </button>
      </div>
    </div>
  )
}
