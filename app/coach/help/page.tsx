'use client'

import { useState } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'

const FAQ = [
  {
    q: 'Jak dodać nowego zawodnika?',
    a: 'Przejdź do zakładki „Zawodnicy" i kliknij „+ Dodaj zawodnika" obok pola wyszukiwania. Po dodaniu zawodnika skopiuj link zaproszenia i wyślij go zawodnikowi — może to zrobić przez WhatsApp lub email bezpośrednio z jego profilu.',
  },
  {
    q: 'Jak zawodnik uzyskuje dostęp do swojego panelu?',
    a: 'Zawodnik klika w link zaproszenia, który go automatycznie loguje. Link jest ważny bezterminowo. Jeśli zawodnik zgubi link, możesz go skopiować ponownie z profilu zawodnika w zakładce „Zawodnicy".',
  },
  {
    q: 'Jak dodać trening do planu zawodnika?',
    a: 'Wejdź w profil zawodnika → zakładka „Plan". W widoku tygodniowym kliknij „+ dodaj" pod wybranym dniem. W widoku miesięcznym kliknij „+" przy numerze dnia. Możesz ustawić typ treningu, dystans, czas i tempo.',
  },
  {
    q: 'Jak działa feedback głosowy?',
    a: 'Zawodnik po treningu otwiera swój panel i klika przycisk mikrofonu. Nagrywa krótką notatką głosową (15–30 sek). Transkrypcja pojawia się automatycznie. Trener widzi feedback w zakładce „Feedback" oraz przy konkretnym treningu w planie.',
  },
  {
    q: 'Jak wystawić fakturę zawodnikowi?',
    a: 'Przejdź do zakładki „Faktury" i kliknij „+ Nowa faktura". Wybierz zawodnika, wpisz kwotę i opis. Fakturę możesz oznaczyć jako opłaconą po otrzymaniu płatności.',
  },
  {
    q: 'Jak zmienić hasło lub email?',
    a: 'Przejdź do zakładki „Ustawienia" w dolnej części menu. Tam możesz zmienić imię i nazwisko, adres email (wymaga potwierdzenia) oraz hasło.',
  },
  {
    q: 'Czy zawodnicy mogą widzieć wzajemnie swoje dane?',
    a: 'Nie. Każdy zawodnik ma dostęp tylko do swojego panelu. Dane są oddzielone na poziomie bazy danych.',
  },
  {
    q: 'Co to jest „Obciążenie treningowe" na liście zawodników?',
    a: 'To suma kilometrów z ostatnich 7 dni — zarówno z zrealizowanych treningów jak i zaplanowanych. Pomaga szybko ocenić aktualny poziom obciążenia bez wchodzenia w profil każdego zawodnika.',
  },
]

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formMsg, setFormMsg] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Opens mailto with pre-filled data
    const subject = encodeURIComponent('Pytanie od trenera — Strefa Trenera')
    const body = encodeURIComponent(`Imię: ${formName}\nEmail: ${formEmail}\n\n${formMsg}`)
    window.open(`mailto:kontakt@strefa-trenera.pl?subject=${subject}&body=${body}`)
    setSent(true)
  }

  return (
    <div>
      <CoachTopbar title="Pomoc" subtitle="FAQ i kontakt" />

      <div className="p-6 max-w-3xl space-y-8">

        {/* Contact info */}
        <Card className="p-6">
          <h2 className="font-bold text-lg mb-4">Dane kontaktowe</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: '📧', label: 'Email', value: 'kontakt@strefa-trenera.pl', href: 'mailto:kontakt@strefa-trenera.pl' },
              { icon: '💬', label: 'WhatsApp', value: '+48 500 000 000', href: 'https://wa.me/48500000000' },
              { icon: '🌐', label: 'Strona', value: 'strefa-trenera.pl', href: 'https://strefa-trenera.pl' },
            ].map(c => (
              <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl transition-colors hover:opacity-80"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <span className="text-2xl">{c.icon}</span>
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.label}</div>
                  <div className="text-sm font-medium">{c.value}</div>
                </div>
              </a>
            ))}
          </div>
          <p className="text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
            Odpowiadamy zazwyczaj w ciągu 24 godzin w dni robocze.
          </p>
        </Card>

        {/* Contact form */}
        <Card className="p-6">
          <h2 className="font-bold text-lg mb-4">Napisz do nas</h2>
          {sent ? (
            <div className="py-6 text-center">
              <div className="text-4xl mb-3">✅</div>
              <div className="font-semibold mb-1">Otworzyliśmy Twój program pocztowy</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Wyślij wiadomość, aby skontaktować się z naszym zespołem.</p>
              <button onClick={() => setSent(false)} className="mt-4 text-sm cursor-pointer" style={{ color: '#FF5C1B', background: 'none', border: 'none' }}>
                Napisz ponownie
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Imię i nazwisko</label>
                  <input
                    value={formName} onChange={e => setFormName(e.target.value)}
                    required placeholder="np. Anna Kowalska"
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Email</label>
                  <input
                    type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)}
                    required placeholder="twoj@email.com"
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Wiadomość</label>
                <textarea
                  value={formMsg} onChange={e => setFormMsg(e.target.value)}
                  required rows={5} placeholder="Opisz swój problem lub pytanie..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
                style={{ background: '#FF5C1B', border: 'none' }}
              >
                Wyślij wiadomość
              </button>
            </form>
          )}
        </Card>

        {/* FAQ */}
        <div>
          <h2 className="font-bold text-lg mb-4">Najczęstsze pytania</h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
                  style={{ background: 'none', border: 'none', color: 'var(--text-primary)' }}
                >
                  <span className="font-medium text-sm pr-4">{item.q}</span>
                  <span className="text-lg shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {open === i ? '−' : '+'}
                  </span>
                </button>
                {open === i && (
                  <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                    <div className="pt-3">{item.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
