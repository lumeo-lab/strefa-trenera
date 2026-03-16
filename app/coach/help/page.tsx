'use client'

import { useState } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'

const FAQ = [
  {
    q: 'Jak dodać nowego zawodnika?',
    a: 'Przejdź do zakładki „Zawodnicy" i kliknij „+ Dodaj zawodnika". Po dodaniu zawodnika skopiuj link zaproszenia i wyślij go zawodnikowi — możesz to zrobić przez WhatsApp lub email bezpośrednio z jego profilu.',
  },
  {
    q: 'Jak zawodnik uzyskuje dostęp do swojego panelu?',
    a: 'Zawodnik klika w link zaproszenia, który go automatycznie loguje. Link działa wielokrotnie — zawodnik może go zapisać w zakładkach. Jeśli zawodnik zgubi link, możesz go skopiować ponownie z profilu zawodnika.',
  },
  {
    q: 'Jak dodać trening do planu zawodnika?',
    a: 'Wejdź w profil zawodnika → zakładka „Plan". W widoku tygodniowym kliknij „+ dodaj" pod wybranym dniem. W widoku miesięcznym kliknij „+" przy numerze dnia. Możesz ustawić typ treningu, dystans, czas i tempo.',
  },
  {
    q: 'Jak działa feedback od zawodnika?',
    a: 'Zawodnik po treningu otwiera swój panel i wypełnia formularz feedbacku — wybiera samopoczucie, typ treningu, dystans, czas i intensywność. Może też nagrać komentarz głosowy (przeglądarka automatycznie zamienia mowę na tekst). Trener widzi feedback w zakładce „Feedback" oraz przy konkretnym treningu w planie.',
  },
  {
    q: 'Jak wystawić fakturę?',
    a: 'Przejdź do zakładki „Faktury" i kliknij „+ Nowa faktura". Wybierz zawodnika (kwota wypełni się automatycznie z ceny pakietu), wpisz opis i termin płatności. Możesz dołączyć plik PDF/JPG. Status faktury zmieniasz klikając na badge statusu w tabeli.',
  },
  {
    q: 'Jak wysłać wiadomość do zawodnika?',
    a: 'Przejdź do zakładki „Czat", wybierz zawodnika z listy po lewej i napisz wiadomość. Zawodnik zobaczy ją w swoim panelu. Nowe wiadomości od zawodników są oznaczone liczbą przy jego nazwie.',
  },
  {
    q: 'Jak zmienić hasło lub email?',
    a: 'Przejdź do „Ustawienia" w dolnej części menu. Tam możesz zmienić imię i nazwisko, adres email (wymaga potwierdzenia) oraz hasło.',
  },
  {
    q: 'Czy zawodnicy mogą widzieć wzajemnie swoje dane?',
    a: 'Nie. Każdy zawodnik ma dostęp tylko do swojego panelu. Dane są oddzielone na poziomie bazy danych.',
  },
  {
    q: 'Co oznacza „Obciążenie 7 dni" na liście zawodników?',
    a: 'To suma kilometrów z treningów z ostatnich 7 dni. Pomaga szybko ocenić aktualny poziom obciążenia bez wchodzenia w profil każdego zawodnika.',
  },
  {
    q: 'Jak działają pakiety i cennik?',
    a: 'Przejdź do „Ustawienia" → zakładka „Pakiety i cennik". Tam tworzysz pakiety (np. Plan Pro, Plan Standard) z opisem i ceną miesięczną. Pakiet przypisujesz zawodnikowi w jego profilu w zakładce „Dane". Cena pakietu automatycznie wypełnia się przy tworzeniu faktury.',
  },
]

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div>
      <CoachTopbar title="Pomoc" subtitle="FAQ i kontakt" />

      <div className="p-6 max-w-3xl mx-auto space-y-8">

        {/* Contact info */}
        <Card className="p-6">
          <h2 className="font-bold text-lg mb-4">Kontakt</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <a href="mailto:kontakt@strefa-trenera.pl"
              className="flex items-center gap-3 p-4 rounded-xl transition-colors hover:opacity-80"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <span className="text-2xl">📧</span>
              <div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Email</div>
                <div className="text-sm font-medium">kontakt@strefa-trenera.pl</div>
              </div>
            </a>
            <a href="https://wa.me/48662110067" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl transition-colors hover:opacity-80"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <span className="text-2xl">💬</span>
              <div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>WhatsApp / telefon</div>
                <div className="text-sm font-medium">662-110-067</div>
              </div>
            </a>
          </div>
          <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
            Odpowiadamy zazwyczaj w ciągu 24 godzin w dni robocze.
          </p>
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
