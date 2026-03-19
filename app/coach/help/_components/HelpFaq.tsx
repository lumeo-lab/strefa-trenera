'use client'

import Link from 'next/link'
import { useMemo, useState, useSyncExternalStore } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { INPUT_STYLE } from '@/lib/styles'
import { SUPPORT_EMAIL } from '@/lib/constants'
import { CATEGORY_LABELS, FAQ } from './faq-data'
import type { HelpCategory } from './faq-data'

const HELP_VOTES_KEY = 'coach-help-votes'

export function HelpFaq() {
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false)
  const [open, setOpen] = useState<string | null>(FAQ[0]?.id ?? null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'top' | HelpCategory>('top')
  const [votesOverride, setVotesOverride] = useState<Record<string, 'yes' | 'no'> | null>(null)

  const storedVotes: Record<string, 'yes' | 'no'> = hydrated ? (() => {
    try {
      const raw = localStorage.getItem(HELP_VOTES_KEY)
      if (raw) return JSON.parse(raw) as Record<string, 'yes' | 'no'>
    } catch { /* ignore */ }
    return {}
  })() : {}

  const votes = votesOverride ?? storedVotes

  function saveVote(id: string, vote: 'yes' | 'no') {
    const next: Record<string, 'yes' | 'no'> = { ...votes, [id]: vote }
    setVotesOverride(next)
    try { localStorage.setItem(HELP_VOTES_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  const visibleFaq = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return FAQ.filter((item) => {
      const inCategory = category === 'top' ? !!item.featured : item.category === category
      const inSearch = !normalized
        || item.q.toLowerCase().includes(normalized)
        || item.a.toLowerCase().includes(normalized)
      return inCategory && inSearch
    })
  }, [category, query])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-bold text-lg">Najczęstsze pytania</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Szybko znajdź odpowiedź albo przejdź od razu do właściwego miejsca w panelu.
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj w pytaniach i odpowiedziach..."
          className="w-full lg:w-80 rounded-xl px-3 py-2.5 text-sm"
          style={INPUT_STYLE}
        />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory('top')}
          className="rounded-xl px-3 py-2 text-sm cursor-pointer"
          style={{
            background: category === 'top' ? 'rgba(255,92,27,0.15)' : 'var(--bg-elevated)',
            border: category === 'top' ? '1px solid rgba(255,92,27,0.25)' : '1px solid var(--border)',
            color: category === 'top' ? '#FF5C1B' : 'var(--text-muted)',
          }}
        >
          Najczęstsze
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategory(key as HelpCategory)}
            className="rounded-xl px-3 py-2 text-sm cursor-pointer"
            style={{
              background: category === key ? 'rgba(255,92,27,0.15)' : 'var(--bg-elevated)',
              border: category === key ? '1px solid rgba(255,92,27,0.25)' : '1px solid var(--border)',
              color: category === key ? '#FF5C1B' : 'var(--text-muted)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {visibleFaq.length === 0 ? (
        <EmptyState
          icon="🔎"
          title="Nie znaleziono pasującej odpowiedzi"
          description="Spróbuj innego słowa kluczowego albo skontaktuj się z nami przez email lub WhatsApp."
        />
      ) : (
        <div className="space-y-2">
          {visibleFaq.map((item) => (
            <div key={item.id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <button
                onClick={() => setOpen(open === item.id ? null : item.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)' }}
              >
                <div className="pr-4">
                  <div className="text-xs mb-1" style={{ color: '#FF5C1B' }}>{CATEGORY_LABELS[item.category]}</div>
                  <span className="font-medium text-sm">{item.q}</span>
                </div>
                <span className="text-lg shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {open === item.id ? '−' : '+'}
                </span>
              </button>
              {open === item.id && (
                <div className="px-5 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="pt-3 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {item.a}
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>Czy to pomogło?</span>
                      <button
                        type="button"
                        onClick={() => saveVote(item.id, 'yes')}
                        className="rounded-lg px-2.5 py-1.5 cursor-pointer"
                        style={{
                          background: votes[item.id] === 'yes' ? 'rgba(46,204,113,0.12)' : 'var(--bg-elevated)',
                          border: votes[item.id] === 'yes' ? '1px solid rgba(46,204,113,0.3)' : '1px solid var(--border)',
                          color: votes[item.id] === 'yes' ? '#2ECC71' : 'var(--text-muted)',
                        }}
                      >
                        Tak
                      </button>
                      <button
                        type="button"
                        onClick={() => saveVote(item.id, 'no')}
                        className="rounded-lg px-2.5 py-1.5 cursor-pointer"
                        style={{
                          background: votes[item.id] === 'no' ? 'rgba(231,76,60,0.12)' : 'var(--bg-elevated)',
                          border: votes[item.id] === 'no' ? '1px solid rgba(231,76,60,0.3)' : '1px solid var(--border)',
                          color: votes[item.id] === 'no' ? '#E74C3C' : 'var(--text-muted)',
                        }}
                      >
                        Nie
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* After "Nie" — show contact escalation */}
                      {votes[item.id] === 'no' && (
                        <a
                          href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(item.q)}`}
                          className="inline-flex items-center rounded-xl px-3 py-2 text-xs font-medium hover:opacity-85 transition-opacity"
                          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                        >
                          📧 Napisz do nas
                        </a>
                      )}
                      {item.href && item.cta && (
                        <Link
                          href={item.href}
                          className="inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium hover:opacity-85 transition-opacity"
                          style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}
                        >
                          {item.cta}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* "Nie znalazłeś odpowiedzi?" escalation */}
      {visibleFaq.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Nie znalazłeś odpowiedzi?</span>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-medium hover:opacity-80 transition-opacity"
            style={{ color: '#FF5C1B' }}
          >
            Napisz do nas →
          </a>
        </div>
      )}
    </div>
  )
}
