'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { INPUT_STYLE } from '@/lib/styles'
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP } from '@/lib/constants'

type HelpCategory =
  | 'start'
  | 'zawodnicy'
  | 'plan'
  | 'feedback'
  | 'czat'
  | 'faktury'
  | 'pakiety'
  | 'konto'

type FaqItem = {
  id: string
  category: HelpCategory
  q: string
  a: string
  href?: string
  cta?: string
}

const CATEGORY_LABELS: Record<HelpCategory, string> = {
  start: 'Pierwsze kroki',
  zawodnicy: 'Zawodnicy',
  plan: 'Plan',
  feedback: 'Feedback',
  czat: 'Czat',
  faktury: 'Faktury',
  pakiety: 'Pakiety',
  konto: 'Konto',
}

const QUICK_ACTIONS = [
  { label: 'Dodaj zawodnika', href: '/coach/athletes', icon: '👤' },
  { label: 'Otwórz planer', href: '/coach/planner', icon: '📅' },
  { label: 'Sprawdź feedback', href: '/coach/feedback', icon: '📝' },
  { label: 'Przejdź do faktur', href: '/coach/invoices', icon: '💳' },
]

const FAQ: FaqItem[] = [
  {
    id: 'add-athlete',
    category: 'start',
    q: 'Jak dodać nowego zawodnika?',
    a: 'Przejdź do zakładki „Zawodnicy" i kliknij „+ Dodaj zawodnika". Po dodaniu zawodnika skopiuj link zaproszenia i wyślij go zawodnikowi z jego profilu.',
    href: '/coach/athletes',
    cta: 'Otwórz zawodników',
  },
  {
    id: 'invite-link',
    category: 'zawodnicy',
    q: 'Co zrobić, jeśli zawodnik zgubi link do panelu?',
    a: 'Wejdź w profil zawodnika i skopiuj link zaproszenia ponownie. Ten sam link może być używany wielokrotnie.',
    href: '/coach/athletes',
    cta: 'Przejdź do zawodników',
  },
  {
    id: 'athlete-access',
    category: 'zawodnicy',
    q: 'Jak zawodnik uzyskuje dostęp do swojego panelu?',
    a: 'Zawodnik klika w link zaproszenia, który automatycznie otwiera jego panel. Nie widzi innych zawodników ani danych trenera poza swoim kontekstem.',
  },
  {
    id: 'plan-add',
    category: 'plan',
    q: 'Jak dodać trening do planu zawodnika?',
    a: 'W planerze lub w profilu zawodnika w zakładce „Plan" wybierz dzień i dodaj sesję. Możesz ustawić typ treningu, tytuł, dystans, czas i tempo.',
    href: '/coach/planner',
    cta: 'Otwórz planer',
  },
  {
    id: 'no-plan',
    category: 'plan',
    q: 'Co oznacza, że zawodnik nie ma planu do końca tygodnia?',
    a: 'To sygnał, że od dziś do niedzieli nie ma dla niego żadnej zaplanowanej sesji. Najszybciej uzupełnisz to z planera lub z jego profilu.',
    href: '/coach/planner',
    cta: 'Uzupełnij plan',
  },
  {
    id: 'feedback-read',
    category: 'feedback',
    q: 'Jak działa feedback od zawodnika?',
    a: 'Zawodnik po treningu może dodać opis, samopoczucie i komentarz głosowy. Trener widzi feedback w zakładce „Feedback" oraz przy zawodniku. Sygnał kolorowy (zielony/żółty/czerwony) zależy od samopoczucia.',
    href: '/coach/feedback',
    cta: 'Otwórz feedback',
  },
  {
    id: 'feedback-signals',
    category: 'feedback',
    q: 'Co oznaczają kolory sygnałów w feedbacku?',
    a: 'Zielony (😊🤩) = dobre samopoczucie. Żółty (😐) = średnie. Czerwony (😕😫) = słabe lub fatalne. Filtr „Wymaga reakcji" pokazuje żółte i czerwone bez odpowiedzi trenera.',
    href: '/coach/feedback',
    cta: 'Sprawdź feedback',
  },
  {
    id: 'chat-send',
    category: 'czat',
    q: 'Jak wysłać wiadomość do zawodnika?',
    a: 'Przejdź do zakładki „Czat", wybierz zawodnika z listy po lewej i napisz wiadomość. Enter wysyła, Shift+Enter nowa linia.',
    href: '/coach/chat',
    cta: 'Otwórz czat',
  },
  {
    id: 'chat-unread',
    category: 'czat',
    q: 'Co oznacza „Wymaga odpowiedzi" w czacie?',
    a: 'To rozmowy, w których ostatnia wiadomość jest od zawodnika — trener jeszcze nie odpowiedział. Filtr pomaga szybko wyłapać, komu trzeba odpisać.',
    href: '/coach/chat',
    cta: 'Przejdź do czatu',
  },
  {
    id: 'invoice-create',
    category: 'faktury',
    q: 'Jak wystawić fakturę?',
    a: 'Przejdź do zakładki „Faktury" i kliknij „+ Nowa faktura". Wybierz zawodnika, wpisz opis i termin płatności. Kwota może wypełnić się automatycznie z ceny pakietu.',
    href: '/coach/invoices',
    cta: 'Otwórz faktury',
  },
  {
    id: 'invoice-status',
    category: 'faktury',
    q: 'Jak działa status oczekująca, opłacona i przeterminowana?',
    a: 'Opłacona oznacza, że płatność została zaksięgowana. Oczekująca to faktura jeszcze nieopłacona w terminie. Przeterminowana — faktura po terminie płatności. Anulowana — wycofana.',
    href: '/coach/invoices',
    cta: 'Sprawdź płatności',
  },
  {
    id: 'packages',
    category: 'pakiety',
    q: 'Jak działają pakiety i cennik?',
    a: 'W ustawieniach w zakładce „Pakiety i cennik" tworzysz własne pakiety z nazwą, opisem i ceną miesięczną. Potem przypisujesz je zawodnikom w ich danych.',
    href: '/coach/settings?tab=packages',
    cta: 'Przejdź do pakietów',
  },
  {
    id: 'account',
    category: 'konto',
    q: 'Jak zmienić hasło, email lub awatar?',
    a: 'W ustawieniach w zakładce „Profil" zmienisz nazwę i awatar. Email i hasło znajdziesz w sekcji „Bezpieczeństwo" na tej samej stronie.',
    href: '/coach/settings',
    cta: 'Otwórz ustawienia',
  },
  {
    id: 'privacy',
    category: 'konto',
    q: 'Czy zawodnicy mogą widzieć wzajemnie swoje dane?',
    a: 'Nie. Każdy zawodnik ma dostęp tylko do swojego panelu i własnych danych.',
  },
]

const HELP_VOTES_KEY = 'coach-help-votes'

export default function HelpPage() {
  const [open, setOpen] = useState<string | null>(FAQ[0]?.id ?? null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'all' | HelpCategory>('all')
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formSubject, setFormSubject] = useState('')
  const [formMsg, setFormMsg] = useState('')
  const [contactState, setContactState] = useState<'idle' | 'success' | 'error'>('idle')
  const [contactMessage, setContactMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)
  const [votes, setVotes] = useState<Record<string, 'yes' | 'no'>>(() => {
    if (typeof window === 'undefined') return {}
    const raw = window.localStorage.getItem(HELP_VOTES_KEY)
    if (!raw) return {}
    try {
      return JSON.parse(raw) as Record<string, 'yes' | 'no'>
    } catch {
      window.localStorage.removeItem(HELP_VOTES_KEY)
      return {}
    }
  })

  function saveVote(id: string, vote: 'yes' | 'no') {
    const next = { ...votes, [id]: vote }
    setVotes(next)
    window.localStorage.setItem(HELP_VOTES_KEY, JSON.stringify(next))
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      setEmailCopied(true)
      window.setTimeout(() => setEmailCopied(false), 1800)
    } catch {
      setEmailCopied(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setContactState('idle')
    setContactMessage('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          subject: formSubject,
          message: formMsg,
        }),
      })

      const data = (await res.json().catch(() => null)) as { error?: string } | null

      if (!res.ok) {
        throw new Error(data?.error || 'Nie udało się wysłać wiadomości. Spróbuj ponownie.')
      }

      setContactState('success')
      setContactMessage('Wiadomość została wysłana. Odpowiemy możliwie szybko.')
      setFormName('')
      setFormEmail('')
      setFormSubject('')
      setFormMsg('')
    } catch (error) {
      setContactState('error')
      setContactMessage(
        error instanceof Error ? error.message : 'Nie udało się wysłać wiadomości. Spróbuj ponownie.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const visibleFaq = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return FAQ.filter((item) => {
      const inCategory = category === 'all' || item.category === category
      const inSearch = !normalized
        || item.q.toLowerCase().includes(normalized)
        || item.a.toLowerCase().includes(normalized)
      return inCategory && inSearch
    })
  }, [category, query])

  return (
    <div>
      <CoachTopbar title="Pomoc" subtitle="FAQ, szybkie skróty i kontakt" />

      <div className="p-6 max-w-4xl mx-auto space-y-8">

        {/* Quick actions */}
        <Card className="p-6">
          <h2 className="font-bold text-lg">Szybkie skróty</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Najczęstsze miejsca, do których trener wraca podczas codziennej pracy.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-5">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 transition-opacity hover:opacity-85"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <span className="text-xl">{action.icon}</span>
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </Card>

        {/* FAQ section — moved above contact */}
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

          {/* Category pills only (removed duplicate select) */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className="rounded-xl px-3 py-2 text-sm cursor-pointer"
              style={{
                background: category === 'all' ? 'rgba(255,92,27,0.15)' : 'var(--bg-elevated)',
                border: category === 'all' ? '1px solid rgba(255,92,27,0.25)' : '1px solid var(--border)',
                color: category === 'all' ? '#FF5C1B' : 'var(--text-muted)',
              }}
            >
              Wszystkie
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

        {/* Contact section — combined quick contact + form */}
        <Card className="p-6">
          <h2 className="font-bold text-lg">Kontakt</h2>
          <p className="text-sm mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>
            Napisz mailowo, przez WhatsApp albo wypełnij formularz poniżej.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <div
              className="flex items-center justify-between gap-3 rounded-xl p-4"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-85"
              >
                <span className="text-2xl">📧</span>
                <div className="min-w-0">
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Email</div>
                  <div className="truncate text-sm font-medium">{SUPPORT_EMAIL}</div>
                </div>
              </a>
              <button
                type="button"
                onClick={copyEmail}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg cursor-pointer transition-opacity hover:opacity-85"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                aria-label="Skopiuj adres email"
                title={emailCopied ? 'Skopiowano email' : 'Skopiuj email'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9 9.75A2.25 2.25 0 0 1 11.25 7.5h7.5A2.25 2.25 0 0 1 21 9.75v9A2.25 2.25 0 0 1 18.75 21h-7.5A2.25 2.25 0 0 1 9 18.75v-9Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M15 7.5V5.25A2.25 2.25 0 0 0 12.75 3h-7.5A2.25 2.25 0 0 0 3 5.25v9a2.25 2.25 0 0 0 2.25 2.25H9" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </button>
            </div>
            <a
              href={SUPPORT_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl p-4 transition-opacity hover:opacity-85"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <span className="text-2xl">💬</span>
              <div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>WhatsApp / telefon</div>
                <div className="text-sm font-medium">{SUPPORT_PHONE}</div>
              </div>
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            <span>Odpowiadamy zazwyczaj w ciągu 24 godzin w dni robocze.</span>
            {emailCopied ? <span style={{ color: '#22C55E' }}>Adres email skopiowany.</span> : null}
          </div>

          {/* Contact form */}
          <div style={{ borderTop: '1px solid var(--border)' }} className="pt-5">
            <h3 className="font-semibold text-sm mb-4">Napisz do nas</h3>
            {contactState === 'success' ? (
              <div className="rounded-xl p-4" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.22)' }}>
                <div className="font-medium">Wiadomość została wysłana.</div>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{contactMessage}</p>
                <button
                  type="button"
                  onClick={() => { setContactState('idle'); setContactMessage('') }}
                  className="mt-4 text-sm cursor-pointer"
                  style={{ color: '#FF5C1B', background: 'none', border: 'none' }}
                >
                  Wyślij kolejną wiadomość
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Imię i nazwisko</label>
                    <input value={formName} onChange={(e) => setFormName(e.target.value)} required
                      placeholder="np. Anna Kowalska" className="w-full rounded-xl px-3 py-2.5 text-sm" style={INPUT_STYLE} />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Email</label>
                    <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required
                      placeholder="twoj@email.com" className="w-full rounded-xl px-3 py-2.5 text-sm" style={INPUT_STYLE} />
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Temat</label>
                  <input value={formSubject} onChange={(e) => setFormSubject(e.target.value)} required
                    placeholder="Krótko opisz, czego dotyczy wiadomość" className="w-full rounded-xl px-3 py-2.5 text-sm" style={INPUT_STYLE} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Wiadomość</label>
                  <textarea value={formMsg} onChange={(e) => setFormMsg(e.target.value)} required rows={5}
                    placeholder="Opisz swój problem lub pytanie..." className="w-full resize-none rounded-xl px-3 py-2.5 text-sm" style={INPUT_STYLE} />
                </div>
                {contactState === 'error' && (
                  <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.22)', color: '#DC2626' }}>
                    {contactMessage}
                  </div>
                )}
                <button type="submit" disabled={isSubmitting}
                  className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ background: '#FF5C1B', border: 'none' }}>
                  {isSubmitting ? 'Wysyłanie...' : 'Wyślij wiadomość'}
                </button>
              </form>
            )}
          </div>
        </Card>

      </div>
    </div>
  )
}
