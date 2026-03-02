# Strefa Trenera — Dokumentacja projektu (dla AI)

> Ten plik opisuje CAŁĄ aplikację. Czytaj go na początku każdej sesji, żeby wiedzieć
> jak działa projekt, jak go modyfikować i na co uważać.

---

## 1. Co to jest

**Strefa Trenera** — platforma webowa dla trenerów biegania i ich zawodników.
Dwa niezależne interfejsy:
- **Panel trenera** (`/coach/*`) — desktop-first, zarządzanie zawodnikami
- **Panel zawodnika** (`/athlete/*`) — mobile-first, śledzenie treningów i feedback

Poprzednia nazwa: `CoachBiz` (zmieniona — jeśli znajdziesz gdzieś resztkę tej nazwy, zmień na Strefa Trenera).

---

## 2. Stack techniczny

| Co | Jak |
|----|-----|
| Framework | Next.js 16.1.6, App Router, TypeScript |
| Style | Tailwind CSS + CSS custom properties (zmienne) |
| Dane | Mock data (brak backendu) — wszystko w `lib/data.ts` |
| Stan | React `useState` / `useReducer` lokalnie, bez globalnego store |
| Motyw | Light/dark toggle — `lib/theme.tsx` + `ThemeProvider` |
| Deploy | Vercel, repo: `lumeo-lab/strefa-trenera` |

### Uruchamianie lokalne
```bash
# DEV — WAŻNE: nie `npm run dev`, bo PATH nie widzi `next`
node node_modules/next/dist/bin/next dev

# BUILD
node node_modules/next/dist/bin/next build
```

### Import alias
`@/*` mapuje na root projektu (`/Users/tomek/Desktop/trener/`).

---

## 3. Struktura plików

```
app/
├── layout.tsx                    # Root layout, <title>, <body>
├── globals.css                   # CSS variables (dark/light), reset
├── page.tsx                      # Landing page (strona główna /)
│
├── coach/
│   ├── layout.tsx                # CoachSidebar + CoachTopbar wrapper
│   ├── page.tsx                  # redirect → /coach/athletes
│   ├── athletes/
│   │   ├── page.tsx              # Lista zawodników (tabela + search)
│   │   └── [id]/page.tsx         # Profil zawodnika (5 zakładek)
│   ├── feedback/page.tsx         # Feed feedbacku z AI
│   ├── planner/page.tsx          # Tygodniowy planer treningów
│   ├── invoices/page.tsx         # Tabela faktur + modal tworzenia
│   ├── analytics/page.tsx        # KPI, wykresy SVG, alerty retencji
│   └── chat/page.tsx             # Czat dwupanelowy
│
└── athlete/
    ├── layout.tsx                # AthleteSidebar (desktop) + AthleteBottomNav (mobile)
    ├── page.tsx                  # "Dziś" — trening dnia + feedback
    ├── plan/page.tsx             # Plan tygodniowy (prev/next tydzień)
    ├── history/page.tsx          # Historia miesięczna (prev/next miesiąc)
    └── chat/page.tsx             # Czat z trenerem

components/
├── coach/
│   ├── CoachSidebar.tsx          # Lewa nawigacja (6 pozycji)
│   └── CoachTopbar.tsx           # Górny pasek z tytułem i akcjami
├── athlete/
│   ├── AthleteSidebar.tsx        # Lewa nawigacja desktop (hidden lg:flex)
│   └── AthleteBottomNav.tsx      # Dolna nawigacja mobile (lg:hidden)
└── ui/
    ├── Modal.tsx                 # Wycentrowany modal (items-center wszędzie)
    ├── Tabs.tsx                  # Zakładki
    ├── Button.tsx                # Przycisk (pomarańczowy)
    ├── Badge.tsx                 # Znacznik statusu
    ├── Card.tsx                  # Karta z tłem
    └── Avatar.tsx                # Awatar z inicjałami

lib/
├── types.ts                      # Wszystkie typy TypeScript
├── data.ts                       # Mock data (athletes, sessions, feedbacks, invoices...)
├── utils.ts                      # Funkcje pomocnicze
└── theme.tsx                     # ThemeProvider + useTheme hook
```

---

## 4. Design system — CSS variables

Zdefiniowane w `app/globals.css`. Zmieniają się automatycznie przy toggle motywu (`.theme-light` / `.theme-dark` na wrapperze):

| Zmienna | Dark | Light | Użycie |
|---------|------|-------|--------|
| `--bg-base` | #0D0F14 | #F4F5F7 | Tło strony |
| `--bg-card` | #161920 | #FFFFFF | Karty |
| `--bg-elevated` | #1E2330 | #F0F1F4 | Nagłówki, elevated |
| `--bg-subtle` | #252B3B | #E8EAF0 | Subtelne tła |
| `--bg-hover` | rgba(255,255,255,0.05) | rgba(0,0,0,0.04) | Hover state |
| `--border` | rgba(255,255,255,0.07) | rgba(0,0,0,0.08) | Linie obramowań |
| `--border-mid` | rgba(255,255,255,0.12) | rgba(0,0,0,0.15) | Mocniejsze obramowania |
| `--text-primary` | #E8EBF4 | #111827 | Tekst główny |
| `--text-muted` | #8A92A8 | #6B7280 | Tekst drugorzędny |
| `--orange` | #FF5C1B | #FF5C1B | Kolor brandowy (CTA, aktywne) |

**Kolor brandowy: `#FF5C1B`** — używaj zawsze dla aktywnych elementów, CTA, akcentów.

### Kolory typów sesji (Tailwind klasy)
```ts
easy:     'bg-green-500/20 text-green-400 border-green-500/30'
interval: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
tempo:    'bg-blue-500/20 text-blue-400 border-blue-500/30'
long:     'bg-purple-500/20 text-purple-400 border-purple-500/30'
rest:     'bg-gray-500/20 text-gray-400 border-gray-500/30'
gym:      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
```
Funkcja: `intensityColor(type)` w `lib/utils.ts`.

---

## 5. Dane mock — lib/data.ts

### Symulowana data "dziś"
```ts
const TODAY = '2026-02-28'  // hardcoded w lib/data.ts, lib/utils.ts, i kilku page.tsx
```
Przy zmianie daty — zmień w **wszystkich** miejscach (szukaj `2026-02-28`).

### Zawodnicy (6 sztuk)
| ID | Imię | Pakiet | Status | Alert |
|----|------|--------|--------|-------|
| a1 | Katarzyna Wiśniewska | Pro (599zł) | ok | — |
| a2 | Marek Kowalczyk | Standard (399zł) | warning | 4 dni bez kontaktu |
| a3 | Anna Dąbrowska | Starter (249zł) | ok | — |
| a4 | Piotr Zielński | Pro (599zł) | alert | 8 dni bez kontaktu |
| a5 | Monika Lewandowska | Standard (399zł) | ok | — |
| a6 | Tomasz Nowak | Pro (599zł) | warning | Pominął 2 sesje |

### Sesje (44 sztuki, s1–s44)
- Każda sesja ma: `id`, `athleteId`, `date`, `type`, `title`, `description`
- Opcjonalne: `plannedDistance/Duration/Pace`, `actualDistance/Duration/Pace`, `avgHR`, `maxHR`, `completed`, `feedbackId`
- Daty generowane przez helper `d(daysOffset)` — offset od `2026-02-28`

### Feedbacki (11 sztuk, f1–f11)
- `sessionId` łączy feedback z sesją
- `source`: `'voice'` | `'text'` | `'auto'`
- `signal`: `'green'` | `'yellow'` | `'red'`
- `transcript` — co powiedział/napisał zawodnik
- `aiSummary` — krótkie podsumowanie AI (1 zdanie)
- `aiAnalysis` — dłuższa analiza AI
- `watchData` — opcjonalne dane z zegarka (HR, dystans, tempo, HRV...)
- `coachReply` — opcjonalna odpowiedź trenera

### Faktury (15 sztuk)
Różne statusy: `paid`, `pending`, `overdue`, `cancelled`

---

## 6. Panel trenera (/coach)

### Nawigacja (CoachSidebar.tsx)
6 pozycji (bez CRM):
1. 👟 Zawodnicy → `/coach/athletes` *(domyślna strona)*
2. 📥 Feedback → `/coach/feedback`
3. 📅 Planer → `/coach/planner`
4. 💳 Faktury → `/coach/invoices`
5. 📊 Analityka → `/coach/analytics`
6. 💬 Czat → `/coach/chat`

**CRM zostało usunięte** z nawigacji (plik `/coach/crm/page.tsx` nadal istnieje, ale nie ma do niego linka).

### Lista zawodników (/coach/athletes)
- Tabela z search (filtruje po imieniu/celu/mieście)
- Kliknięcie wiersza → `/coach/athletes/[id]`
- Kolumny: Zawodnik, Status (dot z kolorem), Ostatni trening, Kontakt, Pakiet, Przychód, Alert

### Profil zawodnika (/coach/athletes/[id]/page.tsx)
5 zakładek:

#### Zakładka: Plan
- Toggle: Tydzień / Miesiąc
- **Widok tygodniowy**: poziome wiersze dla każdego dnia (Pn–Nd)
  - Lewa kolumna: data (podświetlona pomarańczowo jeśli dziś)
  - Środek: lista sesji z kolorami i parametrami
  - Prawy przycisk `+`: dodaj sesję w tym dniu
  - Każda sesja: przycisk ✏️ do edycji
  - Nawigacja: ← Dziś →
- **Widok miesięczny**: siatka 7-kolumnowa (Pon–Nie)
  - Kliknięcie dnia → panel szczegółów poniżej kalendarza
  - Panel szczegółów: lista sesji + przycisk "Dodaj sesję"
  - Nawigacja: ← Dziś →

#### Modal sesji (add/edit)
Pola: Tytuł (wymagane), Typ (6 przycisków z kolorami), Dystans/Czas/Tempo (opcjonalne), Opis
Akcje: Zapisz / Anuluj / Usuń (tylko przy edycji, czerwony przycisk)
Stan lokalny: `useState<Session[]>` — zmiany nie trafiają do `lib/data.ts`!

#### Zakładka: Historia
- 4 karty KPI (sesji, km, feedbacków, % ukończenia)
- Tabela sesji (20 ostatnich, posortowane malejąco)
- **8 kolumn**: Data, Sesja, Typ, Dystans, Tempo, HR, Status, **Feedback**
- Kolumna Feedback: ikona 💬▼ jeśli sesja ma powiązany feedback
  - Kliknięcie → rozwija wiersz pod spodem
  - Pokazuje: źródło, sygnał AI (kolor), aiSummary, transkrypcję
  - Stan: `expandedRows: Set<string>` przechowuje ID rozwiniętych sesji
  - Powiązanie: `feedbackBySession = { [sessionId]: feedback }`

#### Zakładka: Dane
- Dane osobowe, rekordy życiowe, ostatnie 3 feedbacki

#### Zakładka: Notatki
- Edytowalne pole textarea (notatki trenera)
- Historia kontuzji (readonly)
- Cele zawodnika

#### Zakładka: Finanse
- KPI: pakiet, łącznie zapłacono, miesiące aktywności
- Tabela faktur zawodnika

---

## 7. Panel zawodnika (/athlete)

### Responsywność
- **Mobile** (< 1024px): bottom nav (`AthleteBottomNav.tsx`), max-w-sm wyśrodkowane
- **Desktop** (≥ 1024px): sidebar (`AthleteSidebar.tsx`), pełna szerokość

Layout w `app/athlete/layout.tsx`:
```tsx
<AthleteSidebar />          // hidden domyślnie, lg:flex
<div className="lg:ml-64">
  <main className="max-w-sm mx-auto lg:max-w-none">{children}</main>
</div>
<AthleteBottomNav />        // lg:hidden
```

### Nawigacja (4 pozycje)
1. 🏠 Dziś → `/athlete`
2. 📅 Plan tygodnia → `/athlete/plan`
3. 📈 Historia → `/athlete/history`
4. 💬 Czat z trenerem → `/athlete/chat`

### Dziś (/athlete/page.tsx)
- Zawodnik: **Katarzyna Wiśniewska (a1)** — hardcoded `ATHLETE_ID = 'a1'`
- Nawigacja dni: ← Wczoraj | Dziś | Jutro →
- Karta treningu (kolorowa wg typu sesji) z parametrami planowanymi
- Po wykonaniu: sekcja "Wyniki" z danymi rzeczywistymi
- Pod kartą treningową: przycisk "Dodaj feedback" (tylko jeśli: sesja istnieje, dzień ≤ dziś, sesja nieukończona)
- Po dodaniu: `FeedbackCard` z podsumowaniem + przycisk "Edytuj"
- Desktop: prawa kolumna z mini-kalendarzem tygodnia (klikalny) + odpowiedź trenera

### Modal feedbacku
- **Zakładka Formularz**: samopoczucie (emoji), rodzaj treningu, dystans/czas, intensywność (6 poziomów), notatki własne
- **Zakładka Głosowy**: symulacja nagrywania (3s → "Nagranie gotowe")
- Przycisk "Zapisz" w stopce modalu (poza obszarem scroll — zawsze widoczny!)
- Modal jest **wycentrowany** na wszystkich ekranach (`items-center`) — nie bottom-sheet, bo klawiatura iOS chowała stopkę

### Plan tygodniowy (/athlete/plan)
- Nawigacja tygodniami: ← Dziś →
- Mobile: pionowe karty per dzień
- Desktop: poziome wiersze per dzień (jak w profilu zawodnika)
- Statystyki tygodnia (sesji / wykonanych / km)

### Historia (/athlete/history)
- Nawigacja miesięczna: ← Dziś →
- Wykres słupkowy SVG (km per tydzień w miesiącu)
- Lista sesji (2 kolumny na desktop)
- Status: ✓ Wykonany / ✗ Pominięty / Planowany

---

## 8. Komponenty UI (components/ui/)

### Modal.tsx
```tsx
<Modal open={bool} onClose={fn} title="..." size="sm|md|lg|xl" footer={<JSX />}>
  {/* treść — scrollowalna */}
</Modal>
```
- `footer` prop — renderowany POZA obszarem scroll (zawsze widoczny)
- `items-center` na wszystkich ekranach (WAŻNE: nie zmieniać na `items-end`)
- `maxHeight: '90dvh'`

### Tabs.tsx
```tsx
<Tabs tabs={[{id, label}]} active={id} onChange={setId} className="..." />
```

### Button.tsx
Pomarańczowy przycisk (`#FF5C1B`), obsługuje `disabled`.

### Badge.tsx
`variant: 'orange' | 'blue' | 'gray' | 'green' | 'red'`

### Avatar.tsx
Kółko z inicjałami, `size: 'sm' | 'md' | 'lg' | 'xl'`

---

## 9. Utilities (lib/utils.ts)

| Funkcja | Co robi |
|---------|---------|
| `formatDate(iso, opts?)` | Formatuje datę po polsku |
| `formatCurrency(amount)` | Formatuje PLN |
| `getWeekDays(offset)` | Zwraca 7 Date[] dla tygodnia (offset=0 → bieżący) |
| `toISODate(date)` | Date → 'YYYY-MM-DD' |
| `isToday(iso)` | Sprawdza czy to '2026-02-28' |
| `isPast(iso)` | Sprawdza czy wcześniej niż dziś |
| `dayName(date, short?)` | Nazwa dnia po polsku |
| `intensityColor(type)` | Tailwind klasy dla typu sesji |
| `sessionTypeLabel(type)` | Polska nazwa typu sesji |
| `signalColor(signal)` | Klasa border dla green/yellow/red |
| `signalBg(signal)` | Klasy tła+tekstu dla sygnału |
| `statusColor(status)` | Kolor dot statusu zawodnika |
| `invoiceStatusColor/Label` | Kolor i label statusu faktury |

---

## 10. Motyw (lib/theme.tsx)

`ThemeProvider` opakowuje całą aplikację. Zapisuje wybór w `localStorage`.
```tsx
const { theme, toggle } = useTheme()
// theme: 'dark' | 'light'
// toggle(): zmienia motyw
```
Toggle jest w `CoachSidebar.tsx` (panel trenera) i `AthleteSidebar.tsx` (panel zawodnika, desktop).

---

## 11. Typowe wzorce kodowania

### Nowa zakładka w profilu zawodnika
1. Dodaj `{ id: 'xxx', label: 'Nazwa' }` do `tabs` array
2. Dodaj blok `{activeTab === 'xxx' && (...)}` w JSX

### Nowy typ sesji
1. Dodaj do `SessionType` w `lib/types.ts`
2. Dodaj kolor w `intensityColor()` w `lib/utils.ts`
3. Dodaj label w `sessionTypeLabel()` w `lib/utils.ts`
4. Dodaj przycisk w SESSION_TYPES array

### Nowy zawodnik
Dodaj obiekt do `athletes` array w `lib/data.ts` z wszystkimi polami.

### Nowa sesja
Dodaj do `sessions` array w `lib/data.ts`. Użyj `d(offset)` dla daty.

### Nowy feedback
Dodaj do `feedbacks` array. `sessionId` musi odpowiadać istniejącej sesji. Ustaw `feedbackId` w sesji.

### Dodanie kolumny do tabeli historii
Tabela jest w `app/coach/athletes/[id]/page.tsx` zakładka `history`.
Dodaj `<th>` w nagłówku i `<td>` w każdym wierszu. Przy ekspandowanych wierszach pamiętaj o `colSpan`.

---

## 12. Pułapki i ważne uwagi

1. **Modal nie może być bottom-sheet** — klawiatura iOS chowa stopkę. Zawsze `items-center`.

2. **Daty** — symulowana data to `2026-02-28`. Jest hardcoded w:
   - `lib/utils.ts`: `isToday()`, `isPast()`, `getWeekDays()`
   - `lib/data.ts`: `const d = ...`
   - `app/coach/athletes/[id]/page.tsx`: `const TODAY`
   - `app/athlete/page.tsx`: `const TODAY`

3. **Stan sesji jest lokalny** — w profilu zawodnika sesje trzymane są w `useState`, zmiany nie trafiają do `lib/data.ts`. Przy odświeżeniu strony zmiany są tracone (to mock, brak backendu).

4. **`node_modules/next/dist/bin/next`** — zawsze uruchamiaj Next.js przez tę ścieżkę, NIE przez `npm run dev`.

5. **Tabela historii z ekspandowanymi wierszami** — używa `<>` (Fragment) jako wrapper dla pary wierszy. React Key musi być unikalny: `key={session.id}` dla głównego wiersza i `key={session.id + '-fb'}` dla rozwiniętego.

6. **Responsywność** — breakpoint `lg` (1024px) to granica mobile/desktop. Poniżej: bottom nav + max-w-sm. Powyżej: sidebar + pełna szerokość.

7. **Kolory** — nigdy nie używaj hardcoded hex tam gdzie są CSS variables. Wyjątek: `#FF5C1B` dla pomarańczowego (to sam kolor w obu motywach).

---

## 13. Git / Deploy

- Repo: `lumeo-lab/strefa-trenera` (GitHub)
- Branch: `main`
- Deploy: Vercel (automatyczny po push do main)
- Push: `git add ... && git commit -m "..." && git push origin main`

---

## 14. Czego NIE ma (brak backendu)

- Brak autentykacji / logowania
- Brak bazy danych — wszystko w `lib/data.ts`
- Brak API routes (poza zaślepkami 404 w logach)
- Brak real-time czatu (mock wiadomości)
- Brak prawdziwego nagrywania głosu (symulacja 3s)
- Brak wysyłania faktur / płatności
