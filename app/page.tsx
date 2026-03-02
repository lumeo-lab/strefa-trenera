'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

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
          <a href="#" className="text-xl font-black tracking-tight">Strefa<span style={{ color: '#FF5C1B' }}> Trenera</span></a>
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
            <a href="#pricing" className="px-8 py-4 rounded-2xl font-semibold text-white" style={{ background: 'linear-gradient(135deg, #FF5C1B, #FF7A42)' }}>Zacznij 30-dniowy trial za darmo</a>
            <a href="#features" className="px-8 py-4 rounded-2xl font-semibold" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>Zobacz jak działa</a>
          </div>
          <p className="text-sm" style={{ color: '#8A92A8' }}>Bez karty kredytowej · Pełna funkcjonalność planu Pro · Anuluj kiedy chcesz</p>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[['8–12h', 'tygodniowo oszczędza trener'], ['<20s', 'zajmuje feedback zawodnika'], ['1', 'platforma zamiast 5 narzędzi'], ['5', 'integracji zegarków sportowych']].map(([n, l]) => (
            <div key={n} className="text-center p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-3xl font-black mb-1" style={{ color: '#FF5C1B' }}>{n}</div>
              <div className="text-sm" style={{ color: '#8A92A8' }}>{l}</div>
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
              { icon: '💬', t: 'Chaos w komunikacji', d: 'Feedback gubi się w WhatsApp. Trener nie ma historii, zawodnik nie ma nawyku raportowania. Coaching oparty na przeczuciu.' },
              { icon: '📊', t: 'Brak narzędzi do planowania', d: 'Plany treningowe w Excelu, kopiowane ręcznie. Brak analizy realizacji, porównania plan vs wykonanie.' },
              { icon: '💸', t: 'Rozproszony biznes', d: 'Faktury, płatności i lista klientów w różnych miejscach. Trener traci 8–12h tygodniowo na administrację.' },
            ].map(p => (
              <div key={p.t} className="p-8 rounded-2xl" style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-4xl mb-4">{p.icon}</div>
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
            points={['Trigger automatyczny po treningu — powiadomienie push zanim zawodnik zdąży zapomnieć', 'Feedback głosowy w 15–30 sekund — nagraj krótką notatkę po biegu', 'Samopoczucie, ból, zmęczenie, trudność zapisane w jednym miejscu', 'Trener widzi sygnał (zielony/żółty/czerwony) bez otwierania profilu', 'Automatyczny raport gdy brak feedbacku — dane z zegarka zawsze są']}
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
              ['01', 'Załóż konto trenera', '30-dniowy trial z pełną funkcjonalnością planu Pro. Bez karty kredytowej.'],
              ['02', 'Zaproś zawodników', 'Wpisz e-mail, kliknij "Zaproś". Zawodnik dostaje link i łączy zegarek.'],
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

      {/* Integrations */}
      <section id="integrations" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <SectionBadge>Integracje</SectionBadge>
            <h2 className="font-bold tracking-tight mb-4 mt-4" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}>Pracuje z narzędziami,<br />które już masz</h2>
            <p style={{ color: '#8A92A8' }}>Zawodnik łączy zegarek raz. Potem synchronizacja działa automatycznie w tle.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ['⌚', 'Garmin Connect', 'Krytyczna', '#2ECC71'],
              ['🟠', 'Strava', 'Krytyczna', '#2ECC71'],
              ['🍎', 'Apple Health', 'Wysoki', '#3498DB'],
              ['🔵', 'Polar Flow', 'Wysoki', '#3498DB'],
              ['🔺', 'Suunto App', 'Średni', '#F1C40F'],
              ['💳', 'Przelewy24', 'Płatności PL', '#2ECC71'],
              ['💜', 'Stripe', 'Płatności INT', '#3498DB'],
              ['📅', 'Google Calendar', 'Synchronizacja', '#3498DB'],
            ].map(([logo, name, priority, color]) => (
              <div key={name} className="p-5 rounded-xl text-center" style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-3xl mb-2">{logo}</div>
                <div className="font-medium text-sm mb-1">{name}</div>
                <div className="text-xs px-2 py-0.5 rounded-full inline-block" style={{ background: `${color}20`, color }}>{priority}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section id="comparison" className="py-24" style={{ background: '#0a0b10' }}>
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
      <section id="pricing" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <SectionBadge>Cennik</SectionBadge>
            <h2 className="font-bold tracking-tight mb-4 mt-4" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}>Płaci trener.<br />Zawodnicy za darmo.</h2>
            <p style={{ color: '#8A92A8' }}>Liczba zawodników determinuje plan. Bez limitu treningów, feedbacków i faktur.</p>
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
              { name: 'Starter', desc: 'Dla trenerów stawiających pierwsze kroki online', price: prices.starter, athletes: 'do 15 zawodników', features: ['Planer treningowy z kalendarzem', 'Feedback głosowy i tekstowy', 'Czat z zawodnikami', 'Fakturowanie podstawowe', 'Integracje zegarków (Garmin, Strava)'], featured: false },
              { name: 'Pro', desc: 'Dla aktywnych trenerów z rosnącą bazą zawodników', price: prices.pro, athletes: 'do 50 zawodników', features: ['Wszystko ze Starter', 'CRM z listą klientów', 'Analityka retencji i alerty', 'Szablony i automatyzacje', 'Auto-przypomnienia płatności', 'Broadcast do grup zawodników'], featured: true },
              { name: 'Studio', desc: 'Dla dużych trenerów i małych akademii biegowych', price: prices.studio, athletes: 'do 150 zawodników', features: ['Wszystko z Pro', 'Biały label (własne logo)', 'Priorytetowe wsparcie', 'Dostęp do API', 'Eksport danych', 'Zaawansowana analityka'], featured: false },
              { name: 'Enterprise', desc: 'Dla federacji, akademii i dużych organizacji', price: null, athletes: '150+ zawodników', features: ['Wszystko ze Studio', 'Dedykowane SLA', 'Wdrożenie i szkolenie', 'Własny serwer (on-premise)', 'Dedykowany account manager'], featured: false },
            ].map(plan => (
              <div key={plan.name} className="p-6 rounded-2xl relative" style={{ background: plan.featured ? 'rgba(255,92,27,0.08)' : '#161920', border: plan.featured ? '2px solid rgba(255,92,27,0.4)' : '1px solid rgba(255,255,255,0.07)' }}>
                {plan.featured && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: '#FF5C1B' }}>Najpopularniejszy</div>}
                <div className="font-bold text-lg mb-1">{plan.name}</div>
                <div className="text-xs mb-4" style={{ color: '#8A92A8' }}>{plan.desc}</div>
                <div className="mb-1">
                  {plan.price ? <><span className="text-4xl font-black">{plan.price}</span><span style={{ color: '#8A92A8' }}> zł/mies.</span></> : <span className="text-2xl font-black">Wycena</span>}
                </div>
                <div className="text-xs mb-6" style={{ color: '#8A92A8' }}>{plan.athletes}</div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#8A92A8' }}><span className="text-green-400 shrink-0">✓</span>{f}</li>)}
                </ul>
                <a href="#" className="block text-center py-3 rounded-xl font-semibold text-sm transition-all" style={{ background: plan.featured ? '#FF5C1B' : 'rgba(255,255,255,0.08)', border: plan.featured ? 'none' : '1px solid rgba(255,255,255,0.1)', color: plan.featured ? 'white' : '#E8EAF0' }}>
                  {plan.name === 'Enterprise' ? 'Skontaktuj się' : 'Zacznij za darmo'}
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-sm mt-8" style={{ color: '#8A92A8' }}>
            ✓ 30-dniowy bezpłatny trial z pełną funkcjonalnością planu Pro &nbsp;·&nbsp; ✓ Bez karty kredytowej &nbsp;·&nbsp; ✓ Anuluj kiedy chcesz
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24" style={{ background: '#0a0b10' }}>
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
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="p-12 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(255,92,27,0.1), rgba(255,92,27,0.05))', border: '1px solid rgba(255,92,27,0.2)' }}>
            <SectionBadge>Zacznij dziś</SectionBadge>
            <h2 className="font-bold mb-4 mt-6" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}>
              Miej więcej czasu na coaching.<br /><GradText>Zacznij prowadzić, nie administrować.</GradText>
            </h2>
            <p className="mb-8" style={{ color: '#8A92A8' }}>30-dniowy trial z pełną funkcjonalnością. Zapraszaj zawodników od pierwszego dnia.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#pricing" className="px-8 py-4 rounded-2xl font-semibold text-white" style={{ background: 'linear-gradient(135deg, #FF5C1B, #FF7A42)', fontSize: '1.05rem' }}>Zacznij 30-dniowy trial za darmo</a>
              <a href="#features" className="px-8 py-4 rounded-2xl font-semibold" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>Dowiedz się więcej</a>
            </div>
            <p className="text-sm mt-4" style={{ color: '#8A92A8' }}>Bez karty kredytowej · Pełna funkcjonalność Pro · Anuluj kiedy chcesz</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="text-xl font-black mb-4">Coach<span style={{ color: '#FF5C1B' }}>Biz</span></div>
              <p className="text-sm" style={{ color: '#8A92A8' }}>Platforma łącząca trenerów biegania i zawodników — planer, feedback i biznes w jednym miejscu.</p>
            </div>
            {[
              { t: 'Produkt', l: ['Planer treningowy', 'Moduł feedbacku', 'Moduł biznesowy', 'Integracje', 'Cennik'] },
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
