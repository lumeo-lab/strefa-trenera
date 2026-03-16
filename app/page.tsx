'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

export default function LandingPage() {
  const [isYearly, setIsYearly] = useState(false)
  const [navScrolled, setNavScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const prices = { starter: isYearly ? 79 : 99, pro: isYearly ? 159 : 199, studio: isYearly ? 239 : 299 }

  return (
    <div className="min-h-screen" style={{ background: '#0D0F14', color: '#E8EAF0' }}>
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all ${navScrolled ? 'py-2.5' : 'py-4'}`}
        style={{ background: 'rgba(13,15,20,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <a href="#"><Logo size="md" /></a>
          <ul className="hidden md:flex items-center gap-8 text-sm" style={{ color: '#8A92A8' }}>
            {[['#features', 'Funkcje'], ['#comparison', 'Porównanie'], ['#pricing', 'Cennik'], ['#how', 'Jak zacząć']].map(([href, label]) => (
              <li key={href}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>Logowanie</Link>
            <Link href="/register" className="px-4 py-2 rounded-xl text-sm font-medium text-white whitespace-nowrap" style={{ background: '#FF5C1B' }}>Zacznij za darmo</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section id="hero" className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,92,27,0.15) 0%, transparent 60%)' }} />
        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex px-4 py-2 rounded-full text-sm font-medium mb-8" style={{ background: 'rgba(255,92,27,0.1)', border: '1px solid rgba(255,92,27,0.2)', color: '#FF5C1B' }}>
            Platforma dla trenerów biegania
          </div>
          <h1 className="font-black tracking-tight mb-6 leading-tight" style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)' }}>
            Prowadź swoich biegaczy.<br />
            <span style={{ background: 'linear-gradient(135deg, #FF5C1B, #FF9A5C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Nie papierkową robotę.</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: '#8A92A8' }}>
            Planer treningowy dla trenerów biegania — plany, feedback zawodników i zarządzanie biznesem w jednym miejscu. Bez Excela i WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <a href="#pricing" className="px-8 py-4 rounded-2xl font-semibold text-white" style={{ background: 'linear-gradient(135deg, #FF5C1B, #FF7A42)' }}>Zacznij za darmo</a>
            <a href="#features" className="px-8 py-4 rounded-2xl font-semibold" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>Zobacz jak działa</a>
          </div>
          <p className="text-sm" style={{ color: '#8A92A8' }}>Bezpłatnie do 2 zawodników · Bez karty kredytowej · Zacznij w 5 minut</p>
        </div>

        {/* Stats boxes */}
        <div className="max-w-6xl mx-auto px-6 mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { n: '8–12h', l: 'tygodniowo zaoszczędza trener', sub: 'mniej administracji' },
            { n: '<20s', l: 'zajmuje feedback zawodnika', sub: 'głosem lub tekstem' },
            { n: '1 system', l: 'zamiast 5 narzędzi', sub: 'wszystko w jednym miejscu' },
            { n: '100%', l: 'historii treningowej pod ręką', sub: 'plan vs wykonanie' },
          ].map(({ n, l, sub }) => (
            <div key={n} className="text-center p-6 rounded-2xl relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #FF5C1B, transparent)' }} />
              <div className="text-3xl font-black mb-1" style={{ color: '#FF5C1B' }}>{n}</div>
              <div className="text-sm font-medium mb-1">{l}</div>
              <div className="text-xs" style={{ color: '#8A92A8' }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <SectionBadge>Problem</SectionBadge>
            <h2 className="font-bold tracking-tight mb-4 mt-4" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}>
              Dziś praca trenera<br />jest <GradText>rozproszona</GradText>
            </h2>
            <p className="max-w-2xl mx-auto" style={{ color: '#8A92A8' }}>Trener planuje w jednym miejscu, zawodnik raportuje w innym, finanse gdzie indziej, a komunikacja w WhatsApp.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <IconChaos />,
                t: 'Chaos w komunikacji',
                d: 'Feedback gubi się w WhatsApp. Trener nie ma historii, zawodnik nie ma nawyku raportowania. Coaching oparty na przeczuciu.',
              },
              {
                icon: <IconPlanning />,
                t: 'Brak narzędzi do planowania',
                d: 'Plany treningowe w Excelu, kopiowane ręcznie. Brak analizy realizacji, porównania plan vs wykonanie.',
              },
              {
                icon: <IconBusiness />,
                t: 'Rozproszony biznes',
                d: 'Faktury, płatności i lista klientów w różnych miejscach. Trener traci 8–12h tygodniowo na administrację.',
              },
            ].map(p => (
              <div key={p.t} className="p-8 rounded-2xl" style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="mb-5 flex justify-center">{p.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{p.t}</h3>
                <p className="text-sm" style={{ color: '#8A92A8' }}>{p.d}</p>
              </div>
            ))}
          </div>
          <div className="text-center flex flex-col items-center gap-3">
            <span className="text-2xl" style={{ color: '#FF5C1B' }}>↓</span>
            <p className="text-lg font-medium">Strefa Trenera łączy to wszystko w jednym ekosystemie</p>
            <span className="text-2xl" style={{ color: '#FF5C1B' }}>↓</span>
          </div>
        </div>
      </section>

      {/* Two Perspectives */}
      <section id="perspectives" className="py-24" style={{ background: '#0a0b10' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <SectionBadge>Dwie strony, jedna platforma</SectionBadge>
            <h2 className="font-bold tracking-tight mb-4 mt-4" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}>Zaprojektowane osobno<br />dla trenera i zawodnika</h2>
            <p style={{ color: '#8A92A8' }}>Trener potrzebuje pełnej kontroli przy komputerze. Zawodnik potrzebuje zera tarcia na telefonie.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <PerspCard color="#FF5C1B" tag="Trener" title="Desktop-first. Pełna kontrola."
              desc="Rozbudowany interfejs webowy zoptymalizowany pod duże ekrany, szybką nawigację i pracę z wieloma zawodnikami jednocześnie."
              items={['📋 Dashboard ze wszystkimi zawodnikami i ich statusem', '🗓️ Kalendarz z sesjami, kopiowaniem tygodni i szablonami', '📥 Feed feedbacku jak skrzynka odbiorcza', '💼 CRM, fakturowanie i analityka retencji', '⚡ Keyboard shortcuts dla zaawansowanych']}
              meta={[['Urządzenie', 'Komputer (desktop)'], ['Częstotliwość', 'Kilka razy/tydzień'], ['Główna czynność', 'Planowanie i analiza'], ['Kluczowa wartość', 'Pełna kontrola']]}
            />
            <PerspCard color="#2ECC71" tag="Zawodnik" title="Mobile-first. Zero tarcia."
              desc="Maksymalnie prosta aplikacja mobilna. Plan na dziś na ekranie głównym. Feedback w 20 sekund. Dwa tapnięcia do każdej akcji."
              items={['📱 Trening na dziś od razu po otwarciu', '🎤 Feedback głosowy w 1 kliknięcie', '🔔 Automatyczny trigger po treningu', '📶 Tryb offline — plan dostępny bez internetu', '💬 Odpowiedź trenera przy konkretnym treningu']}
              meta={[['Urządzenie', 'Telefon (iOS/Android)'], ['Częstotliwość', 'Codziennie, krótko'], ['Główna czynność', 'Feedback i plan dnia'], ['Kluczowa wartość', 'Zero tarcia']]}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <SectionBadge>Moduły</SectionBadge>
            <h2 className="font-bold tracking-tight mb-4 mt-4" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}>Trzy moduły. Jeden ekosystem.</h2>
            <p style={{ color: '#8A92A8' }}>Każdy moduł rozwiązuje konkretny problem. Razem tworzą kompletne narzędzie pracy trenera.</p>
          </div>

          <FeatureBlock
            num="01" title="Planer Treningowy" heading={<>Centrum operacyjne<br />codziennej pracy</>}
            desc="Jeden ekran ze wszystkimi zawodnikami. Pełny profil każdego w jednym kliknięciu. Kalendarz z sesjami, szablonami i kopiowaniem bloków."
            points={['Dashboard ze statusem każdego zawodnika — wykonany / niewykonany / brak danych', 'Szczegółowe sesje z parametrami: tętno, tempo, dystans, strefa intensywności', 'Biblioteka szablonów sesji i tygodniowych bloków — raz stwórz, używaj wielokrotnie', 'Historia każdego zawodnika: plan vs wykonanie, wykresy trendów, HRV, kadencja', 'Alerty priorytetowe — czerwona flaga przy zawodnikach wymagających uwagi']}
            visual={<MockupDashboard />}
          />
          <FeatureBlock
            num="02" title="Feedback po treningu" heading={<>Feedback który<br />faktycznie się robi</>}
            desc="Filozofia: feedback działa tylko jeśli danie go jest łatwiejsze niż jego pominięcie. Każda sekunda ponad 20 wydłuża współczynnik pominięcia wykładniczo."
            points={['Trigger automatyczny po treningu — powiadomienie push zanim zawodnik zdąży zapomnieć', 'Feedback głosowy w 15–30 sekund — nagraj krótką notatkę po biegu', 'Samopoczucie, ból, zmęczenie, trudność zapisane w jednym miejscu', 'Trener widzi sygnał (zielony/żółty/czerwony) bez otwierania profilu', 'Link z zegarka (Garmin, Strava) bezpośrednio przy treningu']}
            visual={<MockupFeedback />}
            reverse
          />
          <FeatureBlock
            num="03" title="Biznes Trenerski" heading={<>Zarządzaj biznesem<br />jak zawodnik formą</>}
            desc="CRM z listą klientów, kompletne fakturowanie, alerty retencji i analityka przychodów — wszystko czego potrzebuje trener-przedsiębiorca."
            points={['Tablica Kanban: Zapytanie → Onboarding → Aktywny — przeciągaj karty', 'Faktury PDF zgodne z polskim prawem', 'Automatyczne przypomnienia o płatnościach', 'Alerty retencji: system wykrywa sygnały rezygnacji zanim zawodnik odejdzie', 'MRR, churn rate, LTV, zaległości — dashboard w czasie rzeczywistym']}
            visual={<MockupAnalytics />}
          />
        </div>
      </section>

      {/* How */}
      <section id="how" className="py-24" style={{ background: '#0a0b10' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <SectionBadge>Jak zacząć</SectionBadge>
            <h2 className="font-bold tracking-tight mb-4 mt-4" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}>Gotowy do pracy<br />w 15 minut</h2>
            <p style={{ color: '#8A92A8' }}>Bez wdrożenia, bez szkoleń, bez migracji. Zaproś zawodników i zacznij pracować.</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              ['01', 'Załóż konto trenera', 'Rejestracja zajmuje minutę. Bez karty kredytowej — zacznij bezpłatnie.'],
              ['02', 'Zaproś zawodników', 'Wpisz e-mail, kliknij "Zaproś". Zawodnik dostaje link i od razu ma dostęp do swojego panelu.'],
              ['03', 'Stwórz pierwsze plany', 'Zaplanuj tydzień treningowy w kalendarzu. Skorzystaj z gotowych szablonów.'],
              ['04', 'Odbieraj feedback zawodników', 'Zawodnik daje feedback głosowo w 20 sekund. Trener widzi sygnał bez otwierania profilu.'],
            ].map(([n, t, d]) => (
              <div key={n} className="p-6 rounded-2xl" style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-3xl font-black mb-4" style={{ color: '#FF5C1B' }}>{n}</div>
                <h3 className="font-semibold mb-2">{t}</h3>
                <p className="text-sm" style={{ color: '#8A92A8' }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section id="comparison" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <SectionBadge>Porównanie</SectionBadge>
            <h2 className="font-bold tracking-tight mb-4 mt-4" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}>Jedyna platforma z<br />pełnym ekosystemem</h2>
            <p style={{ color: '#8A92A8' }}>Strefa Trenera to jedyne narzędzie łączące trening, feedback i biznes w jednym miejscu — po polsku.</p>
          </div>
          <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <th className="text-left p-4 font-medium" style={{ color: '#8A92A8' }}>Funkcja</th>
                  {['Strefa Trenera', 'Good Coach App', 'TrainingPeaks', 'Final Surge'].map((h, i) => (
                    <th key={h} className="p-4 text-center font-semibold" style={{ background: i === 0 ? 'rgba(255,92,27,0.08)' : undefined, color: i === 0 ? '#FF5C1B' : '#8A92A8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Feedback głosowy po treningu', true, false, false, false],
                  ['Automatyczny trigger feedbacku', true, false, false, false],
                  ['CRM i zarządzanie klientami', true, false, false, false],
                  ['Fakturowanie zintegrowane', true, false, false, 'partial'],
                  ['Alerty retencji', true, false, false, false],
                  ['Planer treningowy', true, true, true, true],
                  ['Język polski', true, true, false, false],
                  ['Desktop-first dla trenera', true, 'partial', true, true],
                  ['Mobile-first dla zawodnika', true, true, 'partial', 'partial'],
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="p-4" style={{ color: '#8A92A8' }}>{row[0] as string}</td>
                    {row.slice(1).map((v, j) => (
                      <td key={j} className="p-4 text-center" style={{ background: j === 0 ? 'rgba(255,92,27,0.05)' : undefined }}>
                        {v === true ? <span className="text-green-400">✓</span> : v === 'partial' ? <span className="text-xs text-yellow-400">Częściowo</span> : <span style={{ color: '#8A92A8' }}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24" style={{ background: '#0a0b10' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <SectionBadge>Cennik</SectionBadge>
            <h2 className="font-bold tracking-tight mb-4 mt-4" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}>Zacznij bezpłatnie,<br />skaluj kiedy chcesz.</h2>
            <p style={{ color: '#8A92A8' }}>Do 2 zawodników zawsze za darmo. Płacisz dopiero gdy naprawdę potrzebujesz więcej.</p>
          </div>
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className="text-sm font-medium" style={{ color: !isYearly ? '#E8EAF0' : '#8A92A8' }}>Miesięcznie</span>
            <button onClick={() => setIsYearly(!isYearly)} className="relative w-12 h-6 rounded-full transition-colors cursor-pointer" style={{ background: isYearly ? '#FF5C1B' : 'rgba(255,255,255,0.2)' }}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isYearly ? 'left-7' : 'left-1'}`} />
            </button>
            <span className="text-sm font-medium" style={{ color: isYearly ? '#E8EAF0' : '#8A92A8' }}>Rocznie</span>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: 'rgba(46,204,113,0.15)', color: '#2ECC71' }}>Oszczędzasz 20%</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Bezpłatny', desc: 'Na start — bez żadnych zobowiązań', price: 0, athletes: 'do 2 zawodników', features: ['Planer treningowy z kalendarzem', 'Feedback głosowy i tekstowy', 'Czat z zawodnikami', 'Profil zawodnika'], featured: false, free: true },
              { name: 'Starter', desc: 'Dla trenerów stawiających pierwsze kroki online', price: prices.starter, athletes: 'do 15 zawodników', features: ['Wszystko z planu Bezpłatnego', 'Nieograniczona liczba treningów', 'Fakturowanie podstawowe', 'Historia i analityka'], featured: true, free: false },
              { name: 'Pro', desc: 'Dla aktywnych trenerów z rosnącą bazą zawodników', price: prices.pro, athletes: 'do 50 zawodników', features: ['Wszystko ze Starter', 'CRM z listą klientów', 'Analityka retencji i alerty', 'Szablony i automatyzacje', 'Auto-przypomnienia płatności', 'Broadcast do grup zawodników'], featured: false, free: false },
              { name: 'Studio', desc: 'Dla dużych trenerów i małych akademii biegowych', price: prices.studio, athletes: 'do 150 zawodników', features: ['Wszystko z Pro', 'Biały label (własne logo)', 'Priorytetowe wsparcie', 'Dostęp do API', 'Eksport danych', 'Zaawansowana analityka'], featured: false, free: false },
            ].map(plan => (
              <div key={plan.name} className="p-6 rounded-2xl relative" style={{ background: plan.featured ? 'rgba(255,92,27,0.08)' : '#161920', border: plan.featured ? '2px solid rgba(255,92,27,0.4)' : '1px solid rgba(255,255,255,0.07)' }}>
                {plan.featured && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: '#FF5C1B' }}>Najpopularniejszy</div>}
                <div className="font-bold text-lg mb-1">{plan.name}</div>
                <div className="text-xs mb-4" style={{ color: '#8A92A8' }}>{plan.desc}</div>
                <div className="mb-1">
                  {plan.free
                    ? <><span className="text-4xl font-black">0</span><span style={{ color: '#8A92A8' }}> zł/mies.</span></>
                    : <><span className="text-4xl font-black">{plan.price}</span><span style={{ color: '#8A92A8' }}> zł/mies.</span></>
                  }
                </div>
                <div className="text-xs mb-6" style={{ color: '#8A92A8' }}>{plan.athletes}</div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#8A92A8' }}><span className="text-green-400 shrink-0">✓</span>{f}</li>)}
                </ul>
                <Link href="/register" className="block text-center py-3 rounded-xl font-semibold text-sm transition-all" style={{ background: plan.featured ? '#FF5C1B' : 'rgba(255,255,255,0.08)', border: plan.featured ? 'none' : '1px solid rgba(255,255,255,0.1)', color: plan.featured ? 'white' : '#E8EAF0' }}>
                  Zacznij za darmo
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-6 p-5 rounded-2xl text-center" style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="font-semibold">Enterprise</span>
            <span className="text-sm ml-3" style={{ color: '#8A92A8' }}>150+ zawodników · Federacje i akademie biegowe · Dedykowane SLA · Własny serwer</span>
            <a href="mailto:kontakt@strefa-trenera.pl" className="ml-4 text-sm font-medium" style={{ color: '#FF5C1B' }}>Skontaktuj się →</a>
          </div>
          <p className="text-center text-sm mt-8" style={{ color: '#8A92A8' }}>
            ✓ Bezpłatnie do 2 zawodników &nbsp;·&nbsp; ✓ Bez karty kredytowej &nbsp;·&nbsp; ✓ Zacznij w 5 minut
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <SectionBadge>Opinie trenerów</SectionBadge>
            <h2 className="font-bold tracking-tight mb-4 mt-4" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}>Co mówią trenerzy,<br />którzy używają Strefa Trenera</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { q: '"Wcześniej spędzałam 3 godziny dziennie na administracji. Teraz mam to ogarnięte w 30 minut. Zawodnicy dają feedback regularnie bo zajmuje im to dosłownie kilkanaście sekund."', name: 'Monika Krawczyk', role: 'Trenerka biegania · 38 zawodników', av: 'MK', color: 'from-pink-500 to-rose-600' },
              { q: '"CRM z alertami retencji uratował mi 4 klientów w pierwszym miesiącu. System sam powiedział mi kto może odejść — zanim zdążyli mi o tym powiedzieć."', name: 'Tomasz Wróbel', role: 'Trener biegania · 62 zawodników', av: 'TW', color: 'from-blue-500 to-cyan-600' },
              { q: '"Feedback głosowy to game-changer. Zawodniczka w krótkiej notatce wspomniała o bólu biodra — bez tego w ogóle bym nie wiedziała. Złapałam kontuzję w zarodku."', name: 'Agnieszka Zając', role: 'Trenerka biegania · 25 zawodników', av: 'AZ', color: 'from-green-500 to-emerald-600' },
            ].map(t => (
              <div key={t.name} className="p-8 rounded-2xl" style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-yellow-400 mb-4">★★★★★</div>
                <p className="text-sm italic mb-6" style={{ color: '#8A92A8' }}>{t.q}</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center font-bold text-sm text-white shrink-0`}>{t.av}</div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs" style={{ color: '#8A92A8' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24" style={{ background: '#0a0b10' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="p-12 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(255,92,27,0.1), rgba(255,92,27,0.05))', border: '1px solid rgba(255,92,27,0.2)' }}>
            <SectionBadge>Zacznij dziś</SectionBadge>
            <h2 className="font-bold mb-4 mt-6" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}>
              Miej więcej czasu na coaching.<br /><GradText>Zacznij prowadzić, nie administrować.</GradText>
            </h2>
            <p className="mb-8" style={{ color: '#8A92A8' }}>Bezpłatnie do 2 zawodników. Zaproś pierwszych zawodników i zacznij pracować już dziś.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="px-8 py-4 rounded-2xl font-semibold text-white" style={{ background: 'linear-gradient(135deg, #FF5C1B, #FF7A42)', fontSize: '1.05rem' }}>Zacznij za darmo</Link>
              <a href="#features" className="px-8 py-4 rounded-2xl font-semibold" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>Dowiedz się więcej</a>
            </div>
            <p className="text-sm mt-4" style={{ color: '#8A92A8' }}>Bez karty kredytowej · Konfiguracja w 5 minut</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4"><Logo size="md" /></div>
              <p className="text-sm" style={{ color: '#8A92A8' }}>Platforma łącząca trenerów biegania i zawodników — planer, feedback i biznes w jednym miejscu.</p>
            </div>
            {[
              { t: 'Produkt', l: ['Planer treningowy', 'Moduł feedbacku', 'Moduł biznesowy', 'Cennik'] },
              { t: 'Firma', l: ['O nas', 'Blog', 'Kontakt', 'Kariera'] },
              { t: 'Wsparcie', l: ['Centrum pomocy', 'Dokumentacja API', 'Status systemu', 'Polityka prywatności', 'Regulamin'] },
            ].map(col => (
              <div key={col.t}>
                <h4 className="font-semibold mb-4 text-sm">{col.t}</h4>
                <ul className="space-y-2">{col.l.map(l => <li key={l}><a href="#" className="text-sm hover:text-white transition-colors" style={{ color: '#8A92A8' }}>{l}</a></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <span className="text-sm" style={{ color: '#8A92A8' }}>© 2026 Strefa Trenera. Wszystkie prawa zastrzeżone.</span>
            <span className="flex items-center gap-2 text-sm" style={{ color: '#8A92A8' }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              System działa poprawnie
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

// SVG Icons for Problem section
function IconChaos() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="4" y="6" width="24" height="16" rx="5" fill="rgba(255,92,27,0.15)" stroke="#FF5C1B" strokeWidth="1.5"/>
      <rect x="36" y="14" width="24" height="16" rx="5" fill="rgba(52,152,219,0.15)" stroke="#3498DB" strokeWidth="1.5"/>
      <rect x="10" y="40" width="24" height="16" rx="5" fill="rgba(155,89,182,0.15)" stroke="#9B59B6" strokeWidth="1.5"/>
      <path d="M28 14 L36 22" stroke="#8A92A8" strokeWidth="1.5" strokeDasharray="3 3"/>
      <path d="M22 40 L40 30" stroke="#8A92A8" strokeWidth="1.5" strokeDasharray="3 3"/>
      <path d="M48 30 L34 40" stroke="#8A92A8" strokeWidth="1.5" strokeDasharray="3 3"/>
      <circle cx="48" cy="44" r="6" fill="rgba(241,196,15,0.15)" stroke="#F1C40F" strokeWidth="1.5"/>
      <line x1="46" y1="42" x2="50" y2="46" stroke="#F1C40F" strokeWidth="1.5"/>
      <line x1="50" y1="42" x2="46" y2="46" stroke="#F1C40F" strokeWidth="1.5"/>
    </svg>
  )
}

function IconPlanning() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="6" y="10" width="52" height="44" rx="4" fill="rgba(46,204,113,0.06)" stroke="rgba(46,204,113,0.3)" strokeWidth="1.5"/>
      <line x1="6" y1="22" x2="58" y2="22" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <line x1="6" y1="34" x2="58" y2="34" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <line x1="6" y1="46" x2="58" y2="46" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <line x1="22" y1="10" x2="22" y2="54" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <line x1="40" y1="10" x2="40" y2="54" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <rect x="10" y="14" width="8" height="4" rx="1" fill="#2ECC71" opacity="0.5"/>
      <rect x="26" y="26" width="10" height="4" rx="1" fill="#FF5C1B" opacity="0.5"/>
      <rect x="44" y="38" width="8" height="4" rx="1" fill="#2ECC71" opacity="0.5"/>
      <circle cx="50" cy="16" r="8" fill="#161920" stroke="#E74C3C" strokeWidth="1.5"/>
      <line x1="47" y1="13" x2="53" y2="19" stroke="#E74C3C" strokeWidth="2"/>
      <line x1="53" y1="13" x2="47" y2="19" stroke="#E74C3C" strokeWidth="2"/>
    </svg>
  )
}

function IconBusiness() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="12" cy="12" r="6" fill="rgba(255,92,27,0.15)" stroke="#FF5C1B" strokeWidth="1.5"/>
      <circle cx="52" cy="18" r="5" fill="rgba(52,152,219,0.15)" stroke="#3498DB" strokeWidth="1.5"/>
      <circle cx="20" cy="48" r="7" fill="rgba(241,196,15,0.15)" stroke="#F1C40F" strokeWidth="1.5"/>
      <circle cx="50" cy="50" r="5" fill="rgba(155,89,182,0.15)" stroke="#9B59B6" strokeWidth="1.5"/>
      <circle cx="34" cy="30" r="9" fill="rgba(46,204,113,0.08)" stroke="rgba(46,204,113,0.3)" strokeWidth="1.5" strokeDasharray="3 3"/>
      <path d="M18 12 L30 26" stroke="#8A92A8" strokeWidth="1" strokeDasharray="2 2" opacity="0.5"/>
      <path d="M47 20 L38 26" stroke="#8A92A8" strokeWidth="1" strokeDasharray="2 2" opacity="0.5"/>
      <path d="M26 44 L30 36" stroke="#8A92A8" strokeWidth="1" strokeDasharray="2 2" opacity="0.5"/>
      <path d="M46 47 L40 34" stroke="#8A92A8" strokeWidth="1" strokeDasharray="2 2" opacity="0.5"/>
    </svg>
  )
}

// Helper components
function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex px-4 py-2 rounded-full text-sm font-medium" style={{ background: 'rgba(255,92,27,0.1)', border: '1px solid rgba(255,92,27,0.2)', color: '#FF5C1B' }}>{children}</div>
  )
}

function GradText({ children }: { children: React.ReactNode }) {
  return <span style={{ background: 'linear-gradient(135deg, #FF5C1B, #FF9A5C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{children}</span>
}

function PerspCard({ color, tag, title, desc, items, meta }: { color: string; tag: string; title: string; desc: string; items: string[]; meta: string[][] }) {
  return (
    <div className="p-8 rounded-2xl" style={{ background: '#161920', border: `1px solid ${color}33` }}>
      <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: `${color}20`, color }}>{tag}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="mb-6 text-sm" style={{ color: '#8A92A8' }}>{desc}</p>
      <ul className="space-y-2 mb-6">
        {items.map(item => <li key={item} className="flex items-start gap-3 text-sm" style={{ color: '#8A92A8' }}><span>{item.slice(0, 2)}</span><span>{item.slice(3)}</span></li>)}
      </ul>
      <div className="grid grid-cols-2 gap-3">
        {meta.map(([k, v]) => (
          <div key={k} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="text-xs mb-1" style={{ color: '#8A92A8' }}>{k}</div>
            <div className="text-sm font-medium">{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeatureBlock({ num, title, heading, desc, points, visual, reverse }: { num: string; title: string; heading: React.ReactNode; desc: string; points: string[]; visual: React.ReactNode; reverse?: boolean }) {
  return (
    <div className={`grid md:grid-cols-2 gap-16 items-center mb-28 ${reverse ? 'md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1' : ''}`}>
      <div>
        <div className="text-sm font-semibold mb-4" style={{ color: '#FF5C1B' }}>Moduł {num} — {title}</div>
        <h2 className="font-bold mb-4" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)' }}>{heading}</h2>
        <p className="mb-6" style={{ color: '#8A92A8' }}>{desc}</p>
        <ul className="space-y-3">
          {points.map(p => <li key={p} className="flex items-start gap-3 text-sm" style={{ color: '#8A92A8' }}><span className="text-green-400 mt-0.5 shrink-0">✓</span><span>{p}</span></li>)}
        </ul>
      </div>
      <div>{visual}</div>
    </div>
  )
}

function MockupDashboard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#1E2330' }}>
      <MockupBar title="Strefa Trenera — Dashboard trenera" />
      <div className="p-4 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#8A92A8' }}>Zawodnicy (6)</div>
        {[
          { i: 'KW', n: 'Katarzyna Wiśniewska', s: 'Interwały 5×1km · dziś', c: 'green' },
          { i: 'MK', n: 'Marek Kowalczyk', s: 'Long run · 4 dni bez kontaktu', c: 'yellow' },
          { i: 'PZ', n: 'Piotr Zieliński', s: 'Brak aktywności · 8 dni', c: 'red' },
        ].map(a => (
          <div key={a.n} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">{a.i}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{a.n}</div>
              <div className="text-xs truncate" style={{ color: '#8A92A8' }}>{a.s}</div>
            </div>
            <div className={`w-2 h-2 rounded-full shrink-0 ${a.c === 'green' ? 'bg-green-400' : a.c === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'}`} />
          </div>
        ))}
      </div>
    </div>
  )
}

function MockupFeedback() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#1E2330' }}>
      <MockupBar title="Feed feedbacku" />
      <div className="p-4 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8A92A8' }}>Dziś · 3 nowe</div>
        {[
          { i: 'KW', n: 'Katarzyna Wiśniewska', t: '🎤 Głosówka · 47 sek', sg: 'green', s: 'Doskonały długi bieg. Stabilne tempo, wysoka efektywność.' },
          { i: 'AD', n: 'Anna Dąbrowska', t: '🎤 Głosówka · 23 sek', sg: 'green', s: 'Pierwsze 5km bez przerwy! Łydka OK.' },
          { i: 'MK', n: 'Marek Kowalczyk', t: '✏️ Tekst', sg: 'yellow', s: 'Nogi ciężkie po przerwie. Warto stopniować powrót.' },
        ].map(fb => (
          <div key={fb.n} className="p-3 rounded-xl border-l-2" style={{ background: 'rgba(255,255,255,0.04)', borderLeftColor: fb.sg === 'green' ? '#2ECC71' : fb.sg === 'yellow' ? '#F1C40F' : '#E74C3C' }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white">{fb.i}</div>
              <span className="text-xs font-medium">{fb.n}</span>
              <span className="text-xs ml-auto" style={{ color: '#8A92A8' }}>{fb.t}</span>
            </div>
            <div className="text-xs" style={{ color: '#8A92A8' }}>{fb.s}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockupAnalytics() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#1E2330' }}>
      <MockupBar title="Analityka biznesowa" />
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[['8 940 zł', 'MRR', '↑ +12%', true], ['6', 'Aktywni', '↑ +1', true], ['4,2%', 'Churn', '↓ −0.8%', false]].map(([v, l, t, up]) => (
            <div key={l as string} className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="text-sm font-bold mb-0.5">{v}</div>
              <div className="text-xs mb-1" style={{ color: '#8A92A8' }}>{l}</div>
              <div className="text-xs" style={{ color: up ? '#2ECC71' : '#E74C3C' }}>{t}</div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[['Katarzyna W. · Pro', '599 zł', 'paid'], ['Marek K. · Standard', '399 zł', 'pending'], ['Piotr Z. · Pro', '599 zł', 'overdue']].map(([n, a, s]) => (
            <div key={n} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span className="flex-1 text-xs truncate" style={{ color: '#8A92A8' }}>{n}</span>
              <span className="text-xs font-medium">{a}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: s === 'paid' ? 'rgba(46,204,113,0.15)' : s === 'pending' ? 'rgba(241,196,15,0.15)' : 'rgba(231,76,60,0.15)', color: s === 'paid' ? '#2ECC71' : s === 'pending' ? '#F1C40F' : '#E74C3C' }}>
                {s === 'paid' ? 'Opłacona' : s === 'pending' ? 'Oczekuje' : 'Przeterminowana'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MockupBar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3" style={{ background: '#252B3B', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="w-3 h-3 rounded-full bg-red-500/70" />
      <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
      <div className="w-3 h-3 rounded-full bg-green-500/70" />
      <span className="text-xs ml-2" style={{ color: '#8A92A8' }}>{title}</span>
    </div>
  )
}
