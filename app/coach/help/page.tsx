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
  featured?: boolean
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
  { label: 'Zawodnicy', href: '/coach/athletes', icon: '👤' },
  { label: 'Otwórz planer', href: '/coach/planner', icon: '📅' },
  { label: 'Sprawdź feedback', href: '/coach/feedback', icon: '📝' },
  { label: 'Przejdź do faktur', href: '/coach/invoices', icon: '💳' },
]

const FAQ: FaqItem[] = [
  // ── Pierwsze kroki ──
  {
    id: 'start-first-steps',
    category: 'start',
    featured: true,
    q: 'Od czego zacząć pracę w panelu?',
    a: '1. Dodaj pierwszego zawodnika w zakładce „Zawodnicy". 2. Skopiuj jego link zaproszenia i wyślij mu go (SMS, email, WhatsApp). 3. Dodaj mu pierwszy plan treningowy w planerze. 4. Zawodnik otworzy link, zobaczy swój plan i będzie mógł wysyłać feedback po treningach.',
    href: '/coach/athletes',
    cta: 'Dodaj zawodnika',
  },
  {
    id: 'add-athlete',
    category: 'start',
    q: 'Jak dodać nowego zawodnika?',
    a: 'Przejdź do zakładki „Zawodnicy" i kliknij „+ Dodaj zawodnika". Podaj imię, email (opcjonalnie) i przypisz pakiet. Po zapisaniu wejdź w profil zawodnika — tam znajdziesz link zaproszenia do wysłania.',
    href: '/coach/athletes',
    cta: 'Otwórz zawodników',
  },
  {
    id: 'start-dashboard',
    category: 'start',
    q: 'Jak działa dashboard?',
    a: 'Dashboard to Twoje centrum dowodzenia. Pokazuje co wymaga uwagi dziś: nieprzeczytane feedbacki, wiadomości czekające na odpowiedź, zaległe płatności, zawodników bez planu i nadchodzące zawody. Każdy element prowadzi do właściwego miejsca w panelu. Możesz dostosować widoczność sekcji klikając „Dostosuj widok".',
  },
  {
    id: 'start-cmd-k',
    category: 'start',
    q: 'Jak szybko przejść do innej strony?',
    a: 'Naciśnij Ctrl+K (lub Cmd+K na Macu), żeby otworzyć szybkie wyszukiwanie. Możesz wpisać nazwę modułu i od razu do niego przejść bez klikania w menu.',
  },
  {
    id: 'start-dashboard-customize',
    category: 'start',
    featured: true,
    q: 'Jak dostosować dashboard do swoich potrzeb?',
    a: 'Kliknij „⚙️ Dostosuj widok" w prawym górnym rogu dashboardu. Możesz: włączać i wyłączać karty KPI (np. schować „Szacowany przychód"), włączać i wyłączać sekcje (np. „Nadchodzące zawody"), zmieniać kolejność kart i sekcji strzałkami ▲▼. Zmiany zapisują się automatycznie. Przycisk „Przywróć domyślne" resetuje wszystko do ustawień fabrycznych.',
    href: '/coach/dashboard',
    cta: 'Otwórz dashboard',
  },
  {
    id: 'start-dashboard-collapse',
    category: 'start',
    q: 'Czy mogę zwijać sekcje na dashboardzie?',
    a: 'Tak — każda sekcja dashboardu (poza kartami KPI na górze) ma klikalny nagłówek. Kliknij w niego, żeby zwinąć lub rozwinąć sekcję. Stan zwinięcia zapamiętuje się między wizytami.',
  },
  {
    id: 'start-sidebar',
    category: 'start',
    q: 'Jak zwinąć menu boczne?',
    a: 'Kliknij przycisk ze strzałką na dole menu bocznego (sidebar). Menu zwinie się do samych ikon. Kliknij ponownie, żeby rozwinąć. Na telefonie menu otwiera się przyciskiem hamburger (☰) w lewym górnym rogu.',
  },

  // ── Zawodnicy ──
  {
    id: 'invite-link',
    category: 'zawodnicy',
    featured: true,
    q: 'Jak wysłać zawodnikowi link do jego panelu?',
    a: 'Wejdź w profil zawodnika — w nagłówku zobaczysz przycisk „Skopiuj link zaproszenia". Wyślij go zawodnikowi dowolnym kanałem (SMS, WhatsApp, email). Link jest stały — można go używać wielokrotnie i nie wygasa.',
    href: '/coach/athletes',
    cta: 'Przejdź do zawodników',
  },
  {
    id: 'athlete-access',
    category: 'zawodnicy',
    q: 'Jak zawodnik loguje się do panelu?',
    a: 'Zawodnik nie potrzebuje hasła ani konta. Klika w link zaproszenia — to automatycznie otwiera jego panel. Zawodnik widzi tylko swoje dane: plan treningowy, historię, czat z trenerem. Nie widzi innych zawodników.',
  },
  {
    id: 'athlete-lost-link',
    category: 'zawodnicy',
    q: 'Zawodnik zgubił link — co zrobić?',
    a: 'Wejdź w profil zawodnika i skopiuj link ponownie. Jest zawsze ten sam i zawsze aktywny. Wyślij go jeszcze raz.',
    href: '/coach/athletes',
    cta: 'Znajdź zawodnika',
  },
  {
    id: 'athlete-access-status',
    category: 'zawodnicy',
    q: 'Co oznacza status dostępu zawodnika (zielony/żółty/szary)?',
    a: 'Zielony „Dostęp aktywny" — zawodnik korzystał z panelu. Żółty „Link użyty" — zawodnik kliknął link, ale nie wrócił od dawna. Szary „Nie aktywowany" — link zaproszenia nie został jeszcze użyty. Status dostępu znajdziesz w profilu zawodnika.',
  },
  {
    id: 'athlete-archive',
    category: 'zawodnicy',
    q: 'Jak zarchiwizować lub przywrócić zawodnika?',
    a: 'Archiwizacja: wejdź w profil zawodnika → zakładka „Dane" → na dole kliknij „Archiwizuj". Zarchiwizowany zawodnik znika z aktywnej listy, ale jego dane zostają. Przywrócenie: Ustawienia → Archiwum zawodników → „Przywróć".',
    href: '/coach/settings?tab=archive',
    cta: 'Otwórz archiwum',
  },
  {
    id: 'athlete-statuses',
    category: 'zawodnicy',
    q: 'Co oznaczają statusy zawodników (OK, Uwaga, Kontuzja)?',
    a: 'Statusy to Twoje oznaczenia. Domyślne to: OK (zielony), Uwaga (żółty), Kontuzja (czerwony), Przerwa (szary). Możesz je edytować, dodawać własne i zmieniać kolory w Ustawieniach. Status ustala się ręcznie w profilu zawodnika. Zawodnicy z „Uwaga" lub „Kontuzja" pojawiają się w sekcji alertów na dashboardzie.',
  },
  {
    id: 'athlete-injuries',
    category: 'zawodnicy',
    q: 'Jak śledzić kontuzje zawodnika?',
    a: 'W profilu zawodnika → zakładka „Dane" → sekcja „Sport i zdrowie" dodaj kontuzję z opisem i datą rozpoczęcia. Aktywne kontuzje (bez daty zakończenia) widać w profilu. Gdy kontuzja minie — ustaw datę zakończenia, trafi do historii.',
  },
  {
    id: 'athlete-table-columns',
    category: 'zawodnicy',
    q: 'Jak dostosować kolumny w tabeli zawodników?',
    a: 'Kliknij „⚙️ Edytuj tabelę" nad tabelą. Możesz włączać i wyłączać kolumny (np. telefon, wiek, miasto, pakiet, obciążenie 7 dni) oraz zmieniać ich kolejność strzałkami ↑↓. Domyślnie widoczne są: ostatni trening, następna sesja, realizacja, obciążenie i następne zawody. Przycisk „Przywróć domyślne" resetuje ustawienia.',
    href: '/coach/athletes',
    cta: 'Otwórz zawodników',
  },
  {
    id: 'athlete-reorder',
    category: 'zawodnicy',
    q: 'Czy mogę zmienić kolejność zawodników na liście?',
    a: 'Tak — przeciągnij wiersz zawodnika w górę lub w dół (drag & drop). Kolejność zapisuje się na serwerze, więc jest taka sama na każdym urządzeniu. Uwaga: zmiana kolejności działa tylko gdy nie sortujesz po żadnej kolumnie. Jeśli kliknąłeś nagłówek kolumny — wyczyść sortowanie, żeby wrócić do ręcznej kolejności.',
    href: '/coach/athletes',
    cta: 'Otwórz zawodników',
  },
  {
    id: 'athlete-search-filter',
    category: 'zawodnicy',
    q: 'Jak filtrować i szukać zawodników?',
    a: 'Nad tabelą masz: wyszukiwarkę (szuka po imieniu, emailu, telefonie, celu, pakiecie), filtr statusu (np. OK, Uwaga, Kontuzja) i filtr pakietu (widoczny gdy kolumna „Pakiet" jest włączona). Klikając nagłówki kolumn sortujesz tabelę rosnąco lub malejąco.',
    href: '/coach/athletes',
    cta: 'Otwórz zawodników',
  },
  {
    id: 'athlete-weekly-load',
    category: 'zawodnicy',
    q: 'Co oznacza „Obciążenie 7 dni" w tabeli?',
    a: 'To suma dystansów z zrealizowanych sesji treningowych w ostatnich 7 dniach plus liczba tych sesji, np. „42 km · 5 sesji". Bazuje na danych z planera (dystans faktyczny lub planowany jeśli nie ma faktycznego).',
  },
  {
    id: 'athlete-what-sees',
    category: 'zawodnicy',
    q: 'Co dokładnie widzi zawodnik w swoim panelu?',
    a: 'Zawodnik widzi: plan treningowy na bieżący tydzień, historię sesji, czat z trenerem oraz formularz feedbacku po treningu. Może wysyłać feedback (samopoczucie, notatki, nagranie głosowe) i pisać wiadomości. Nie widzi innych zawodników, faktur ani analityki.',
  },

  // ── Plan ──
  {
    id: 'plan-add',
    category: 'plan',
    featured: true,
    q: 'Jak dodać trening do planu?',
    a: 'Masz dwa sposoby: 1. Planer — wybierz zawodnika z listy, kliknij na dzień i dodaj sesję. 2. Profil zawodnika → zakładka „Plan" — tu też możesz dodawać sesje. Każda sesja ma: typ treningu, tytuł, dystans, czas, notatki.',
    href: '/coach/planner',
    cta: 'Otwórz planer',
  },
  {
    id: 'plan-session-types',
    category: 'plan',
    q: 'Jakie typy treningów mogę wybrać?',
    a: 'Domyślne typy to: łatwy bieg, interwały, tempo, długi, odpoczynek, siłownia. Możesz dodawać własne typy treningów z dowolnymi nazwami i kolorami w Ustawieniach. Twoje niestandardowe typy będą widoczne w planerze i w profilu zawodnika.',
    href: '/coach/settings',
    cta: 'Zarządzaj typami treningów',
  },
  {
    id: 'no-plan',
    category: 'plan',
    q: 'Dashboard pokazuje „Bez planu do końca tygodnia" — co to znaczy?',
    a: 'Oznacza, że od dziś (lub od jutra jeśli dzisiejszy trening jest zrealizowany) do niedzieli zawodnik nie ma żadnej zaplanowanej sesji. Kliknij w zawodnika, żeby szybko uzupełnić plan w planerze.',
    href: '/coach/planner',
    cta: 'Uzupełnij plan',
  },
  {
    id: 'plan-week-templates',
    category: 'plan',
    q: 'Czy mogę kopiować plany między tygodniami?',
    a: 'Tak — w Ustawieniach możesz tworzyć szablony tygodniowe (poniedziałek–niedziela) z gotowymi sesjami. Potem w planerze stosujesz szablon do wybranego tygodnia jednym kliknięciem.',
    href: '/coach/settings',
    cta: 'Zarządzaj szablonami',
  },
  {
    id: 'plan-views',
    category: 'plan',
    q: 'Jakie widoki ma planer?',
    a: 'Planer ma dwa widoki: tygodniowy i miesięczny. Przełączasz je przyciskami w pasku narzędzi. Możesz też włączyć widok feedbacku (checkbox „Pokaż feedback"), żeby zobaczyć co zawodnik zgłosił przy każdym treningu. Wybrany widok zapamiętuje się osobno dla każdego zawodnika.',
    href: '/coach/planner',
    cta: 'Otwórz planer',
  },
  {
    id: 'plan-compliance',
    category: 'plan',
    q: 'Co oznacza „realizacja" (compliance) w liście zawodników?',
    a: 'To stosunek zrealizowanych sesji do zaplanowanych w ostatnich 30 dniach, np. „8/12" = 8 wykonanych z 12 zaplanowanych. Pomaga ocenić, jak regularnie zawodnik trenuje zgodnie z planem.',
  },

  // ── Feedback ──
  {
    id: 'feedback-how',
    category: 'feedback',
    q: 'Jak działa feedback od zawodnika?',
    a: 'Po treningu zawodnik może wypełnić formularz: samopoczucie (emoji), typ treningu, dystans, czas, intensywność, notatka tekstowa i opcjonalnie komentarz głosowy. Feedback trafia do zakładki „Feedback" i do profilu zawodnika. System automatycznie przypisuje kolor sygnału na podstawie samopoczucia.',
    href: '/coach/feedback',
    cta: 'Otwórz feedback',
  },
  {
    id: 'feedback-signals',
    category: 'feedback',
    featured: true,
    q: 'Co oznaczają kolory sygnałów (zielony/żółty/czerwony)?',
    a: 'Kolor zależy od emoji samopoczucia: 🟢 zielony = 😊 lub 🤩 (dobrze/świetnie). 🟡 żółty = 😐 (średnio). 🔴 czerwony = 😕 lub 😫 (słabo/fatalnie). Filtr „Wymaga reakcji" pokazuje żółte i czerwone feedbacki, które są nieprzeczytane lub bez odpowiedzi trenera.',
  },
  {
    id: 'feedback-reply',
    category: 'feedback',
    q: 'Jak odpowiedzieć na feedback zawodnika?',
    a: 'Rozwiń feedback klikając „Rozwiń" i kliknij „Odpowiedz". Twoja odpowiedź będzie widoczna dla zawodnika w jego panelu. Możesz też edytować wcześniejszą odpowiedź.',
    href: '/coach/feedback',
    cta: 'Sprawdź feedback',
  },
  {
    id: 'feedback-bulk',
    category: 'feedback',
    q: 'Jak szybko oznaczyć wiele feedbacków jako przeczytane?',
    a: 'Nad listą feedbacków pojawia się przycisk „Oznacz widoczne jako przeczytane" — działa na aktualnie przefiltrowany widok. W trybie grupowania po zawodniku możesz oznaczyć feedbacki konkretnej osoby przyciskiem przy jej nazwisku.',
    href: '/coach/feedback',
    cta: 'Otwórz feedback',
  },
  {
    id: 'feedback-views',
    category: 'feedback',
    q: 'Jakie tryby widoku ma strona Feedback?',
    a: 'Trzy tryby: „Chronologicznie" — najnowsze na górze. „Po zawodniku" — feedbacki zgrupowane per osoba z podsumowaniem (można zwijać grupy). „Wg pilności" — najpierw czerwone, potem żółte, na końcu zielone. Wybrany tryb zapamiętuje się między wizytami.',
    href: '/coach/feedback',
    cta: 'Otwórz feedback',
  },
  {
    id: 'feedback-voice',
    category: 'feedback',
    q: 'Czy zawodnik może nagrać komentarz głosowy?',
    a: 'Tak. W formularzu feedbacku zawodnik ma opcję nagrania komentarza głosowego. Nagranie jest automatycznie transkrybowane na tekst i widoczne w feedbacku obok danych tekstowych. To opcjonalna funkcja — nie jest wymagana.',
  },

  // ── Czat ──
  {
    id: 'chat-send',
    category: 'czat',
    q: 'Jak wysłać wiadomość do zawodnika?',
    a: 'Przejdź do „Czat", wybierz zawodnika z listy po lewej i napisz wiadomość. Enter wysyła, Shift+Enter nowa linia. Zawodnik zobaczy wiadomość w swoim panelu. Czat jest indywidualny — każdy zawodnik ma osobną rozmowę.',
    href: '/coach/chat',
    cta: 'Otwórz czat',
  },
  {
    id: 'chat-needs-reply',
    category: 'czat',
    q: 'Co oznacza „Wymaga odpowiedzi" i „Czeka" w czacie?',
    a: '„Wymaga odpowiedzi" to filtr pokazujący rozmowy, w których ostatnia wiadomość jest od zawodnika — Twoja kolej, żeby odpowiedzieć. „Czeka" przy zawodniku na liście oznacza to samo. Rozmowy z oznaczeniem „Czeka" są wyżej na liście.',
  },
  {
    id: 'chat-notifications',
    category: 'czat',
    q: 'Czy dostaję powiadomienia o nowych wiadomościach?',
    a: 'Tak, jeśli włączysz powiadomienia push. Przy pierwszym wejściu do czatu pojawi się przycisk „Włącz powiadomienia". Nowe wiadomości od zawodników wyświetlają powiadomienie w przeglądarce. Liczba nieprzeczytanych wiadomości jest też widoczna przy ikonie czatu w menu bocznym.',
  },

  // ── Faktury ──
  {
    id: 'invoice-create',
    category: 'faktury',
    featured: true,
    q: 'Jak wystawić fakturę?',
    a: 'Kliknij „+ Nowa faktura" na górze strony Faktur. Wybierz zawodnika — kwota wypełni się automatycznie z ceny jego pakietu (możesz ją zmienić). Podaj opis, termin płatności i opcjonalnie załącz plik PDF. Numer faktury generuje się automatycznie.',
    href: '/coach/invoices',
    cta: 'Otwórz faktury',
  },
  {
    id: 'invoice-status',
    category: 'faktury',
    q: 'Co oznaczają statusy faktur?',
    a: 'Oczekująca — faktura wystawiona, termin jeszcze nie minął. Przeterminowana — termin płatności minął, faktura nieopłacona. Opłacona — wpłata zaksięgowana (ustawiasz ręcznie). Anulowana — faktura wycofana. Status zmieniasz klikając na niego w tabeli.',
    href: '/coach/invoices',
    cta: 'Sprawdź płatności',
  },
  {
    id: 'invoice-overdue',
    category: 'faktury',
    q: 'Skąd wiem, które faktury są przeterminowane?',
    a: 'Faktura staje się przeterminowana automatycznie, gdy minie jej termin płatności. W tabeli widać ile dni po terminie (np. „7 dni po terminie"). Filtr „Przeterminowane" pokazuje tylko takie faktury. Na dashboardzie w sekcji „Najważniejsze na dziś" też zobaczysz zaległości.',
    href: '/coach/invoices?filter=overdue',
    cta: 'Pokaż przeterminowane',
  },
  {
    id: 'invoice-manual',
    category: 'faktury',
    q: 'Czy faktury wystawiają się automatycznie co miesiąc?',
    a: 'Nie — faktury wystawiasz ręcznie. System nie generuje ich automatycznie na podstawie pakietu. Dzięki temu masz pełną kontrolę nad terminami, kwotami i opisami.',
  },
  {
    id: 'invoice-attachment',
    category: 'faktury',
    q: 'Jakie pliki mogę załączyć do faktury?',
    a: 'Możesz załączyć PDF, JPG lub PNG do max 10 MB. Załącznik jest widoczny w tabeli faktur — przycisk „Pobierz" otwiera go w nowej karcie.',
  },

  {
    id: 'invoice-analytics',
    category: 'faktury',
    q: 'Gdzie znajdę podsumowanie finansowe i trendy?',
    a: 'W zakładce „Analityka" — zobaczysz opłacone w tym miesiącu vs poprzedni, łączne przychody, zaległości, wykres miesięczny, ranking zawodników po przychodzie i rozkład pakietów. Analityka pojawia się automatycznie po wystawieniu pierwszej faktury.',
    href: '/coach/analytics',
    cta: 'Otwórz analitykę',
  },

  // ── Pakiety ──
  {
    id: 'packages',
    category: 'pakiety',
    q: 'Jak działają pakiety i cennik?',
    a: 'Pakiety to Twoja oferta cenowa. Tworzysz je w Ustawieniach → „Pakiety i cennik" — nadajesz nazwę, opis i cenę miesięczną. Potem przypisujesz pakiet każdemu zawodnikowi w jego profilu (zakładka „Dane" → „Współpraca"). Cena pakietu automatycznie wypełnia się przy tworzeniu faktury.',
    href: '/coach/settings?tab=packages',
    cta: 'Zarządzaj pakietami',
  },
  {
    id: 'packages-change',
    category: 'pakiety',
    q: 'Czy mogę zmienić cenę pakietu?',
    a: 'Tak — edytujesz pakiet w Ustawieniach. Zmiana ceny dotyczy nowych faktur. Już wystawione faktury zachowują starą kwotę. Możesz też usunąć pakiet, jeśli żaden zawodnik go nie używa.',
    href: '/coach/settings?tab=packages',
    cta: 'Edytuj pakiety',
  },

  // ── Konto ──
  {
    id: 'account',
    category: 'konto',
    q: 'Jak zmienić hasło, email lub awatar?',
    a: 'Ustawienia → zakładka „Profil". Imię i awatar zmienisz u góry. Email i hasło — w sekcji „Bezpieczeństwo" niżej. Zmiana emaila wymaga potwierdzenia na nowym adresie — do tego czasu logowanie odbywa się starym emailem.',
    href: '/coach/settings',
    cta: 'Otwórz ustawienia',
  },
  {
    id: 'privacy',
    category: 'konto',
    q: 'Czy zawodnicy widzą swoje dane nawzajem?',
    a: 'Nie. Każdy zawodnik widzi wyłącznie swój plan, swoją historię, swój czat i swój feedback. Nie ma możliwości, żeby zobaczył dane innego zawodnika ani Twoje ustawienia.',
  },
  {
    id: 'account-reset-password',
    category: 'konto',
    q: 'Zapomniałem hasła — jak je odzyskać?',
    a: 'Na stronie logowania kliknij „Nie pamiętasz hasła?". Podaj email — otrzymasz link do ustawienia nowego hasła. Jeśli nie widzisz maila, sprawdź spam.',
    href: '/login',
    cta: 'Przejdź do logowania',
  },
  {
    id: 'account-export',
    category: 'konto',
    q: 'Czy mogę eksportować dane zawodników?',
    a: 'Tak — na stronie „Zawodnicy" kliknij przycisk eksportu (ikona arkusza). Lista zawodników z kluczowymi danymi zostanie pobrana jako plik Excel.',
    href: '/coach/athletes',
    cta: 'Otwórz zawodników',
  },
  {
    id: 'account-athlete-no-password',
    category: 'konto',
    featured: true,
    q: 'Zawodnik mówi, że nie może się zalogować — co zrobić?',
    a: 'Zawodnicy nie mają hasła ani konta. Dostęp uzyskują wyłącznie przez link zaproszenia. Wyślij mu link ponownie z jego profilu. Jeśli link nie działa — sprawdź, czy zawodnik nie został zarchiwizowany.',
  },
]

const HELP_VOTES_KEY = 'coach-help-votes'

export default function HelpPage() {
  const [open, setOpen] = useState<string | null>(FAQ[0]?.id ?? null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'top' | HelpCategory>('top')
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
      const inCategory = category === 'top' ? !!item.featured : item.category === category
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
