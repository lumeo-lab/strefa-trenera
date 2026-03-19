'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const QUICK_LINKS = [
  { label: 'Dashboard', href: '/coach/dashboard', icon: '🏠' },
  { label: 'Zawodnicy', href: '/coach/athletes', icon: '👟' },
  { label: 'Planer', href: '/coach/planner', icon: '📅' },
  { label: 'Feedback', href: '/coach/feedback', icon: '📥' },
  { label: 'Czat', href: '/coach/chat', icon: '💬' },
  { label: 'Faktury', href: '/coach/invoices', icon: '💳' },
  { label: 'Analityka', href: '/coach/analytics', icon: '📊' },
  { label: 'Ustawienia', href: '/coach/settings', icon: '⚙️' },
  { label: 'Pomoc', href: '/coach/help', icon: '❓' },
]

export function QuickSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => { if (!o) setQuery(''); return !o })
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = query.trim()
    ? QUICK_LINKS.filter(l => l.label.toLowerCase().includes(query.toLowerCase()))
    : QUICK_LINKS

  function navigate(href: string) {
    setOpen(false)
    router.push(href)
  }

  if (!open) {
    return (
      <button
        onClick={() => { setQuery(''); setOpen(true) }}
        className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm cursor-pointer transition-opacity hover:opacity-80"
        style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)', minWidth: 180 }}
        title="Szybkie przejście (Ctrl+K)"
      >
        <span>🔍</span>
        <span className="hidden lg:inline">Szukaj...</span>
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 cursor-pointer" onClick={() => setOpen(false)} />

      {/* Modal */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[51] w-full max-w-md">
        <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Szukaj strony lub zawodnika..."
              className="w-full text-sm bg-transparent outline-none"
              style={{ color: 'var(--text-primary)' }}
              onKeyDown={e => {
                if (e.key === 'Enter' && filtered.length > 0) navigate(filtered[0].href)
              }}
            />
          </div>
          <div className="max-h-80 overflow-y-auto py-2">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Brak wyników
              </div>
            ) : (
              filtered.map(link => (
                <button
                  key={link.href}
                  onClick={() => navigate(link.href)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <span className="text-base w-5 text-center">{link.icon}</span>
                  <span className="text-sm">{link.label}</span>
                </button>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            ↵ Przejdź · Esc Zamknij
          </div>
        </div>
      </div>
    </>
  )
}
