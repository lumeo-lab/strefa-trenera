# Plan naprawczy — Strefa Trenera
> Ostatnia aktualizacja: 2026-03-15 (v2 — połączony audyt + oryginalny plan)
> Cel: kod profesjonalny, czytelny, łatwy w utrzymaniu

---

## Zasady pracy przy tym planie

1. **Po każdym kroku odpal build:** `node node_modules/next/dist/bin/next build`
2. Jeśli build przechodzi → commit z opisem kroku
3. Nigdy nie łącz zmian z dwóch faz w jeden commit
4. Każdy krok jest niezależny — można zrobić część i wrócić
5. Przy wątpliwościach: mniejszy krok jest lepszy niż duży

---

## Stan obecny (audyt z 2026-03-15)

### Rozmiary plików — problemy

| Plik | Linie | Status |
|------|-------|--------|
| `app/coach/athletes/[id]/_components/AthleteProfileClient.tsx` | **2 122** | 🔴 KRYTYCZNY |
| `app/coach/athletes/_components/AthletesClient.tsx` | **1 038** | 🔴 ZA DUŻY |
| `app/coach/dashboard/_components/DashboardClient.tsx` | **787** | 🟡 Na granicy |
| `app/u/[slug]/_components/AthleteTodayPage.tsx` | **628** | 🟡 Duży |
| `app/page.tsx` (landing) | **565** | 🟡 Akceptowalny |
| `app/coach/invoices/_components/InvoicesClient.tsx` | 414 | 🟢 OK |
| `app/coach/feedback/_components/FeedbackClient.tsx` | 270 | 🟢 OK |
| Reszta plików | <250 | 🟢 OK |

### Zduplikowane funkcje pomocnicze

| Funkcja | Plik A | Plik B |
|---------|--------|--------|
| `daysAgo()` | AthletesClient.tsx:42 | — |
| `daysUntil()` | AthletesClient.tsx:52 | DashboardClient.tsx:22 |
| `timeAgo()` | DashboardClient.tsx:13 | — |
| `plural()` | DashboardClient.tsx:28 | AthletesClient.tsx:384 (inline) |
| `sesjaLabel()` | AthletesClient.tsx:62 | — |
| `tenureLabel()` | AthletesClient.tsx:70 | — |

### Pliki z mock data (lib/data.ts)

| Plik | Co importuje | Status |
|------|-------------|--------|
| `app/athlete/page.tsx` | athletes, sessions, feedbacks | 🔴 Legacy — usunąć |
| `app/athlete/plan/page.tsx` | sessions | 🔴 Legacy — usunąć |
| `app/athlete/history/page.tsx` | sessions, feedbacks | 🔴 Legacy — usunąć |
| `app/athlete/chat/page.tsx` | messages | 🔴 Legacy — usunąć |
| `app/coach/crm/page.tsx` | crmCards | 🟡 Placeholder — zmigrować |
| `app/coach/planner/page.tsx` | athletes, sessions | 🟡 Placeholder — zmigrować |

### Inne problemy

- `app/coach/layout-client.tsx` — to **katalog**, nie plik (artefakt po refactorze, usunąć)
- `lib/types.ts` — zawiera stare camelCase interfejsy z czasów mock data; baza danych używa snake_case
- `app/athlete/*` — stary UX zawodnika, zastąpiony przez `/u/[slug]/*`, nie jest w nawigacji
- `components/athlete/AthleteBottomNav.tsx` — **duplikat** komponentu w `app/u/[slug]/_components/AthleteBottomNav.tsx`
- `components/athlete/AthleteSidebar.tsx` — nieużywany (legacy athlete layout)
- Brak `.env.example` — nowy developer nie wie jakie zmienne środowiskowe ustawić
- Brak testów — zero plików `.test.ts` w projekcie
- ~15 wystąpień `any` w komponentach (głównie propsy: `any[]` zamiast typów z bazy)

---

---

# FAZA 0 — Sprzątanie artefaktów

**Czas: ~30 minut | Ryzyko: zerowe | Priorytet: najwyższy**

Usuwa martwy kod bez żadnego wpływu na działające funkcje.

---

## Krok 0.1 — Usuń katalog `layout-client.tsx`

Jest to katalog (nie plik!) który powstał przez błąd podczas refactoru. Nie jest nigdzie importowany.

```bash
rm -rf app/coach/layout-client.tsx
```

Weryfikacja — upewnij się że nie ma importu:
```bash
grep -r "layout-client" app/ lib/ --include="*.tsx" --include="*.ts"
# Oczekiwany wynik: brak outputu
```

---

## Krok 0.2 — Usuń legacy strony `/app/athlete/*`

Te strony są zastąpione przez `/u/[slug]/*`. Nie są linkowane z nawigacji. Używają wyłącznie mock data.

**Pliki do usunięcia:**
```
app/athlete/page.tsx          (469 linii)
app/athlete/plan/page.tsx     (194 linie)
app/athlete/history/page.tsx  (173 linie)
app/athlete/chat/page.tsx     (89 linii)
app/athlete/layout.tsx        (mały plik)
```

```bash
rm -rf app/athlete/
```

Weryfikacja — sprawdź że nikt nie importuje z tego katalogu:
```bash
grep -r "from.*app/athlete\|from.*'/athlete" app/ lib/ --include="*.tsx" --include="*.ts"
# Oczekiwany wynik: brak outputu
```

---

## Krok 0.3 — Zdecyduj o `/coach/crm` i `/coach/planner`

Oba pliki używają mock data z `lib/data.ts`. Masz dwie opcje:

**Opcja A — Szybka (placeholder):**
Zastąp zawartość stron prostym komunikatem „wkrótce":

```tsx
// app/coach/crm/page.tsx — zamień całą zawartość na:
export default function CrmPage() {
  return (
    <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
      <div className="text-4xl mb-4">🚧</div>
      <h2 className="text-xl font-semibold mb-2">CRM — wkrótce</h2>
      <p className="text-sm">Ta sekcja jest w trakcie budowy.</p>
    </div>
  )
}
```

Tak samo dla `app/coach/planner/page.tsx`.

**Opcja B — Właściwa (migracja do Supabase):**
Opisana szczegółowo w Fazie 4 tego dokumentu.

**Rekomendacja:** Opcja A teraz → Opcja B w Fazie 4.

---

## Krok 0.4 — Wyczyść `lib/data.ts`

Po usunięciu `/app/athlete/*` i zastąpieniu crm/planner placeholderami, sprawdź co jeszcze używa `lib/data.ts`:

```bash
grep -rn "from '@/lib/data'" app/ lib/ --include="*.tsx" --include="*.ts"
```

Jeśli żaden plik już nie importuje z `lib/data.ts` → usuń plik:
```bash
rm lib/data.ts
```

Jeśli crm/planner nadal go używają (Opcja A) → zostaw na razie.

---

## Krok 0.5 — Usuń zduplikowane komponenty athlete

`components/athlete/` zawiera duplikaty komponentów które istnieją w `/app/u/[slug]/_components/`.

```bash
# Sprawdź czy coś importuje z components/athlete/:
grep -rn "from '@/components/athlete" app/ lib/ --include="*.tsx" --include="*.ts"
```

Jeśli żaden aktywny plik nie importuje → usuń cały katalog:
```bash
rm -rf components/athlete/
```

Jeśli coś importuje — zamień import na wersję z `/app/u/[slug]/_components/` lub zostaw.

---

## Krok 0.6 — Dodaj `.env.example`

Utwórz plik `.env.example` z listą wymaganych zmiennych (bez wartości):

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
```

Weryfikacja — sprawdź `.env.local` i upewnij się że `.env.example` ma wszystkie klucze:
```bash
grep -oP '^[A-Z_]+=' .env.local | sort
# Porównaj z zawartością .env.example
```

---

## Weryfikacja Fazy 0

```bash
node node_modules/next/dist/bin/next build
# Oczekiwany wynik: build bez błędów
```

---

---

# FAZA 1 — Centralizacja helperów i typów

**Czas: ~2 godziny | Ryzyko: niskie | Priorytet: wysoki**

> **Dlaczego PRZED podziałem plików?**
> Gdy w Fazie 2 podzielisz AthleteProfileClient.tsx na 6 plików, każdy z nich będzie potrzebował
> tych samych funkcji pomocniczych. Jeśli je scentralizujesz teraz, importy będą od razu czyste.
> Jeśli tego nie zrobisz, skończysz z 6 plikami kopiującymi te same funkcje.

---

## Krok 1.1 — Dodaj brakujące funkcje do `lib/utils.ts`

Aktualnie w `lib/utils.ts` są: `formatDate`, `formatDateTime`, `getWeekDays`, `toISODate`, `signalColor`, `intensityColor`, `sessionTypeLabel`, `statusColor`, `invoiceStatusColor`, `invoiceStatusLabel`, `formatCurrency`, `dayName`, `isToday`, `isPast`.

**Brakuje** (są inline w komponentach):

```tsx
// Dopisz na końcu lib/utils.ts:

// ── Pomocniki dat ────────────────────────────────────────────────────────────

/**
 * Ile dni temu — z kolorem do UI
 * Używane w: AthletesClient (tabela zawodników)
 */
export function daysAgo(dateStr: string): { text: string; color: string } {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return { text: 'dzisiaj', color: '#2ECC71' }
  if (diff === 1) return { text: 'wczoraj', color: '#2ECC71' }
  if (diff <= 7)  return { text: `${diff} dni temu`, color: '#F1C40F' }
  return { text: `${diff} dni temu`, color: '#E74C3C' }
}

/**
 * Ile dni do daty — z kolorem do UI
 * Używane w: AthletesClient (następna sesja), DashboardClient (zawody)
 */
export function daysUntil(dateStr: string): { text: string; color: string } {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
  const diff = Math.floor((d.getTime() - now.getTime()) / 86400000)
  if (diff < 0)  return { text: 'po terminie', color: '#E74C3C' }
  if (diff === 0) return { text: 'dzisiaj', color: '#2ECC71' }
  if (diff === 1) return { text: 'jutro', color: '#2ECC71' }
  if (diff <= 7)  return { text: `za ${diff} dni`, color: '#F1C40F' }
  return { text: `za ${diff} dni`, color: 'var(--text-muted)' }
}

/**
 * Relatywny czas — "5 min temu", "2 godz. temu", "3 dni temu"
 * Używane w: DashboardClient (wiadomości, feedback)
 */
export function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)   return 'przed chwilą'
  if (diff < 3600) return `${Math.floor(diff / 60)} min temu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} godz. temu`
  return `${Math.floor(diff / 86400)} dni temu`
}

/**
 * Polska odmiana liczebnikowa
 * plural(1, 'sesja', 'sesje', 'sesji')  → 'sesja'
 * plural(3, 'sesja', 'sesje', 'sesji')  → 'sesje'
 * plural(11, 'sesja', 'sesje', 'sesji') → 'sesji'
 */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one
  if (n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14)) return few
  return many
}

/**
 * Etykieta dla liczby sesji (polska odmiana)
 * sesjaLabel(1) → '1 sesja'
 * sesjaLabel(3) → '3 sesje'
 */
export function sesjaLabel(n: number): string {
  return `${n} ${plural(n, 'sesja', 'sesje', 'sesji')}`
}

/**
 * Jak długo zawodnik jest w systemie
 * tenureLabel('2024-01-15') → '14 mies.' lub '1 rok 2 mies.'
 */
export function tenureLabel(joinDateStr: string): string {
  const join = new Date(joinDateStr)
  const now = new Date()
  const months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth())
  if (months < 1) return 'nowy'
  if (months < 12) return `${months} mies.`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years} rok ${rem} mies.` : `${years} rok`
}
```

---

## Krok 1.2 — Usuń duplikaty z komponentów

### W `AthletesClient.tsx` — usuń linie 42-80:

```tsx
// USUŃ te funkcje (linie ~42-80 w AthletesClient.tsx):
function daysAgo(dateStr: string): { text: string; color: string } { ... }
function daysUntil(dateStr: string): { text: string; color: string } { ... }
function sesjaLabel(n: number): string { ... }
function tenureLabel(joinDateStr: string): string { ... }
```

Dodaj import na górze pliku:
```tsx
// W AthletesClient.tsx, do istniejącego importu z utils dodaj:
import { formatDate, daysAgo, daysUntil, sesjaLabel, tenureLabel } from '@/lib/utils'
```

### W `DashboardClient.tsx` — usuń linie 13-35:

```tsx
// USUŃ te funkcje (linie ~13-35 w DashboardClient.tsx):
function timeAgo(dateStr: string): string { ... }
function daysUntil(dateStr: string): number { ... }
function plural(n: number, one: string, few: string, many: string) { ... }
```

Uwaga: `daysUntil` w DashboardClient zwraca `number`, a nowa wersja w utils zwraca `{ text, color }`.
Sprawdź użycia w DashboardClient i dostosuj (np. `daysUntil(race.date)` → `daysUntil(race.date).text`).

Dodaj import:
```tsx
import { formatDate, timeAgo, daysUntil, plural } from '@/lib/utils'
```

---

## Krok 1.3 — Scentralizuj typ `DbRow`

Dodaj do `lib/types.ts` (na początku pliku):

```tsx
// lib/types.ts — dodaj na górze:
/** Generyczny wiersz z bazy danych — używany zanim mamy pełne typy Supabase */
export type DbRow = Record<string, unknown>
```

Usuń lokalne definicje z plików (szukaj `type DbRow`):
```bash
grep -rn "type DbRow" app/ --include="*.tsx"
# Wynik pokaże które pliki mają lokalną definicję
```

W każdym takim pliku: usuń lokalną definicję, dodaj import:
```tsx
import type { DbRow } from '@/lib/types'
```

---

## Krok 1.4 — Napraw `lib/types.ts` (opcjonalne ale warte zrobienia)

Aktualny `lib/types.ts` zawiera camelCase interfejsy (`Athlete`, `Session`, `Feedback` etc.) które są pozostałością po mock data i używają innych nazw pól niż baza danych.

Baza danych używa snake_case: `athlete_id`, `coach_id`, `planned_distance`, `avg_hr`, etc.
Stare typy używają camelCase: `athleteId`, `plannedDistance`, `avgHR`, etc.

**Problem:** Komponenty które pobierają dane z Supabase nie mogą bezpośrednio używać tych typów — stąd tyle `any`.

**Rozwiązanie długoterminowe** opisane w Fazie 5 (generowanie typów Supabase).
**Rozwiązanie tymczasowe:** Zostaw stare typy (używane przez mock data w crm/planner), ale nie rozszerzaj ich — niech stopniowo wychodzą z użycia.

---

## Weryfikacja Fazy 1

```bash
node node_modules/next/dist/bin/next build
# Oczekiwany wynik: build bez błędów
```

```bash
# Sprawdź że nie ma już lokalnych definicji daysAgo/timeAgo:
grep -rn "^function daysAgo\|^function timeAgo\|^function plural\|^function daysUntil" app/ --include="*.tsx"
# Oczekiwany wynik: brak outputu
```

---

---

# FAZA 2 — Podział `AthleteProfileClient.tsx`

**Czas: ~5-6 godzin | Ryzyko: średnie | Priorytet: krytyczny**

> To najważniejsza praca w całym planie. Plik ma 2 122 linie i zawiera 7 zakładek + formularze
> + modale + 20+ funkcji. Jest niemożliwy w utrzymaniu.

---

## Docelowa struktura po podziale

```
app/coach/athletes/[id]/
  page.tsx                              ← bez zmian (Server Component, ~71 linii)
  _components/
    AthleteProfileClient.tsx            ← ~200 linii: header + tab switcher TYLKO
    tabs/
      PlanTab.tsx                       ← ~500 linii: kalendarz tygodniowy + miesięczny
      HistoryTab.tsx                    ← ~200 linii: lista ukończonych sesji
      DataTab.tsx                       ← ~200 linii: PB, kontuzje, dane osobowe
      FeedbackTab.tsx                   ← ~200 linii: lista feedbacków z odpowiedziami
      RacesTab.tsx                      ← ~300 linii: tabela zawodów + CRUD
      NotesTab.tsx                      ← ~80 linii: notatki trenera
      FinanceTab.tsx                    ← ~250 linii: lista faktur + tworzenie
    modals/
      SessionModal.tsx                  ← ~300 linii: formularz sesji (create + edit)
      RaceModal.tsx                     ← ~120 linii: formularz zawodów (create + edit)
```

---

## Strategia podziału (kolejność jest kluczowa)

Zaczynamy od rzeczy najbardziej samodzielnych (modale), kończymy na zakładkach które mają
dużo logiki. Po każdym kroku: build.

---

## Krok 2.1 — Wyekstraktuj `SessionModal.tsx`

Modal sesji (create + edit) jest najbardziej samodzielnym fragmentem — ma jasne wejście i wyjście.

**Gdzie jest teraz w AthleteProfileClient.tsx:**
- Stan modalu: linie ~202-208 (`sessionModal`, `modalForm`, `modalDate`, etc.)
- Funkcje: `openNewSession()`, `openEditSession()`, `saveSession()`, `handleDeleteSession()`
- JSX modalu: szukaj `{/* Session modal */}` — duży blok z `<Modal>` i formularzem

**Nowy plik `_components/modals/SessionModal.tsx`:**

```tsx
'use client'
// Props które przyjmuje modal:
interface SessionModalProps {
  open: boolean
  mode: 'create' | 'edit'
  athleteId: string
  sessionTypes: SessionTypeDef[]   // z useCustomSessionTypes
  initialData?: DbRow | null       // dla trybu edit
  defaultDate?: string             // dla trybu create
  onClose: () => void
  onSaved: (session: DbRow) => void
  onDeleted?: (id: string) => void
}

export function SessionModal({ open, mode, athleteId, sessionTypes, initialData, defaultDate, onClose, onSaved, onDeleted }: SessionModalProps) {
  // Cały stan formularza który był w AthleteProfileClient
  // Cały JSX formularza który był w AthleteProfileClient
}
```

**W `AthleteProfileClient.tsx` zostaje:**
```tsx
import { SessionModal } from './modals/SessionModal'

// Stan:
const [sessionModalOpen, setSessionModalOpen] = useState(false)
const [editingSession, setEditingSession] = useState<DbRow | null>(null)
const [sessionDefaultDate, setSessionDefaultDate] = useState('')

// Handler:
function openNewSession(date: string) {
  setEditingSession(null)
  setSessionDefaultDate(date)
  setSessionModalOpen(true)
}
function openEditSession(session: DbRow) {
  setEditingSession(session)
  setSessionModalOpen(true)
}

// JSX:
<SessionModal
  open={sessionModalOpen}
  mode={editingSession ? 'edit' : 'create'}
  athleteId={athlete.id}
  sessionTypes={sessionTypes}
  initialData={editingSession}
  defaultDate={sessionDefaultDate}
  onClose={() => setSessionModalOpen(false)}
  onSaved={(s) => {
    setSessions(prev => editingSession
      ? prev.map(x => x.id === s.id ? s : x)
      : [...prev, s]
    )
    setSessionModalOpen(false)
  }}
  onDeleted={(id) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    setSessionModalOpen(false)
  }}
/>
```

---

## Krok 2.2 — Wyekstraktuj `RaceModal.tsx`

Analogicznie do SessionModal. Formularz zawodów jest w bloku `{activeTab === 'races'}`.

**Nowy plik `_components/modals/RaceModal.tsx`:**

```tsx
interface RaceModalProps {
  open: boolean
  mode: 'create' | 'edit'
  athleteId: string
  initialData?: DbRow | null
  onClose: () => void
  onSaved: (race: DbRow) => void
  onDeleted?: (id: string) => void
}

export function RaceModal({ ... }: RaceModalProps) {
  // Stan i JSX formularza zawodów
}
```

---

## Krok 2.3 — Wyekstraktuj `NotesTab.tsx`

Najmniejsza zakładka (~80 linii) — idealna do ćwiczenia wzorca przed trudniejszymi zakładkami.

**Gdzie jest teraz:** blok `{activeTab === 'notes'}` — linia ~1644

**Nowy plik `_components/tabs/NotesTab.tsx`:**

```tsx
'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { saveNotes } from '@/lib/actions/athletes'  // lub przekaz onSave jako prop

interface NotesTabProps {
  athleteId: string
  initialNotes: string
}

export function NotesTab({ athleteId, initialNotes }: NotesTabProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await saveNotes(athleteId, notes)   // Server Action
    setSaving(false)
  }

  return (
    <Card className="p-6">
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        // ... styling
      />
      <button onClick={handleSave} disabled={saving}>
        {saving ? 'Zapisywanie...' : 'Zapisz notatki'}
      </button>
    </Card>
  )
}
```

**W AthleteProfileClient zostaje:**
```tsx
import { NotesTab } from './tabs/NotesTab'

// W JSX:
{activeTab === 'notes' && (
  <NotesTab athleteId={athlete.id} initialNotes={athlete.coach_notes ?? ''} />
)}
```

---

## Krok 2.4 — Wyekstraktuj `DataTab.tsx`

Zakładka z danymi zawodnika: PB (personal bests), kontuzje, dane osobowe.

**Gdzie jest teraz:** blok `{activeTab === 'data'}` — linia ~1128 do ~1430

**Props:**
```tsx
interface DataTabProps {
  athlete: DbRow
  onUpdated: (updated: Partial<DbRow>) => void
}
```

**Stan który przenosi się do DataTab:**
- `editPb`, `setEditPb`
- `pbForm`, `setPbForm`
- `editData`, `setEditData`
- `dataForm`, `setDataForm`
- `injuries`, `setInjuries`
- `injuryInput`, `setInjuryInput`

**Funkcje które przenoszą się:**
- `savePb()`
- `saveData()`
- `saveInjuries()`

---

## Krok 2.5 — Wyekstraktuj `FinanceTab.tsx`

Zakładka z fakturami.

**Gdzie jest teraz:** blok `{activeTab === 'finance'}` — linia ~1685 do końca

**Props:**
```tsx
interface FinanceTabProps {
  athleteId: string
  initialInvoices: DbRow[]
  packages: Package[]
}
```

**Stan który przenosi się:**
- `invoices`, `setInvoices`
- `invoiceModal`, `setInvoiceModal`
- `invoiceForm`, `setInvoiceForm`

**Funkcje:**
- `saveInvoice()`
- `closeInvoiceModal()`
- `changeInvoiceStatus()`

---

## Krok 2.6 — Wyekstraktuj `FeedbackTab.tsx`

**Gdzie jest teraz:** blok `{activeTab === 'feedback'}` — linia ~1431 do ~1494

**Props:**
```tsx
interface FeedbackTabProps {
  athleteId: string
  coachId: string
  initialFeedbacks: DbRow[]
}
```

Uwaga: `FeedbackDetail` (sub-komponent) i `parseFeedback()` (helper) przenoszą się razem z tą zakładką do `FeedbackTab.tsx`.

---

## Krok 2.7 — Wyekstraktuj `RacesTab.tsx`

**Gdzie jest teraz:** blok `{activeTab === 'races'}` — linia ~1495 do ~1643

**Props:**
```tsx
interface RacesTabProps {
  athleteId: string
  initialRaces: DbRow[]
}
```

Używa `RaceModal` z kroku 2.2.

---

## Krok 2.8 — Wyekstraktuj `HistoryTab.tsx`

**Gdzie jest teraz:** blok `{activeTab === 'history'}` — linia ~989 do ~1127

**Props:**
```tsx
interface HistoryTabProps {
  sessions: DbRow[]
  feedbackMap: Record<string, DbRow>
}
```

Stan który przenosi się:
- `historyMonth`, `setHistoryMonth` (nawigacja po miesiącach)
- `expandedRows`, `setExpandedRows` (rozwinięte wiersze)
- `feedbackDetailModal` (modal szczegółów feedbacku)

---

## Krok 2.9 — Wyekstraktuj `PlanTab.tsx`

Największa zakładka (~500 linii) — kalendarz tygodniowy + miesięczny.

**Gdzie jest teraz:** blok `{activeTab === 'plan'}` — linia ~750 do ~988

**Props:**
```tsx
interface PlanTabProps {
  athleteId: string
  sessions: DbRow[]
  sessionTypes: SessionTypeDef[]
  onOpenNewSession: (date: string) => void
  onOpenEditSession: (session: DbRow) => void
}
```

Pomocniki które przenoszą się z AthleteProfileClient do PlanTab.tsx:
- `shiftMonth()`
- `monthLabel()`
- `getMonthCalendar()`
- `typeClass()`, `typeStyle()`, `typeLabel()`, `completionStyle()`

Stan który przenosi się:
- `planView`, `setPlanView` ('week' | 'month')
- `weekOffset`, `setWeekOffset`
- `planMonth`, `setPlanMonth`

---

## Krok 2.10 — Uprość `AthleteProfileClient.tsx`

Po ekstrakcji wszystkich zakładek i modali, główny plik powinien zawierać TYLKO:
- Header zawodnika (avatar, nazwa, link invite, statystyki)
- Tab switcher
- Przekazanie props do zakładek
- SessionModal i RaceModal

Docelowy stan `AthleteProfileClient.tsx` po podziale (~200 linii):

```tsx
'use client'
import { useState } from 'react'
import { PlanTab } from './tabs/PlanTab'
import { HistoryTab } from './tabs/HistoryTab'
import { DataTab } from './tabs/DataTab'
import { FeedbackTab } from './tabs/FeedbackTab'
import { RacesTab } from './tabs/RacesTab'
import { NotesTab } from './tabs/NotesTab'
import { FinanceTab } from './tabs/FinanceTab'
import { SessionModal } from './modals/SessionModal'
import { RaceModal } from './modals/RaceModal'

export function AthleteProfileClient({ athlete, sessions: initialSessions, ... }) {
  const [activeTab, setActiveTab] = useState('plan')
  const [sessions, setSessions] = useState(initialSessions)

  // Session modal state
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<DbRow | null>(null)
  const [sessionDefaultDate, setSessionDefaultDate] = useState('')

  // Race modal state
  const [raceModalOpen, setRaceModalOpen] = useState(false)
  const [editingRace, setEditingRace] = useState<DbRow | null>(null)

  const TABS = [
    { id: 'plan',     label: 'Plan' },
    { id: 'history',  label: 'Historia' },
    { id: 'data',     label: 'Dane' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'races',    label: 'Zawody' },
    { id: 'notes',    label: 'Notatki' },
    { id: 'finance',  label: 'Finanse' },
  ]

  return (
    <div>
      {/* Athlete header */}
      <AthleteHeader athlete={athlete} />

      {/* Tab switcher */}
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      {activeTab === 'plan' && (
        <PlanTab
          athleteId={athlete.id}
          sessions={sessions}
          onOpenNewSession={...}
          onOpenEditSession={...}
        />
      )}
      {activeTab === 'history' && <HistoryTab sessions={sessions} feedbackMap={feedbackMap} />}
      {activeTab === 'data' && <DataTab athlete={athlete} onUpdated={...} />}
      {activeTab === 'feedback' && <FeedbackTab athleteId={athlete.id} initialFeedbacks={feedbacks} />}
      {activeTab === 'races' && <RacesTab athleteId={athlete.id} initialRaces={races} onOpenModal={...} />}
      {activeTab === 'notes' && <NotesTab athleteId={athlete.id} initialNotes={athlete.coach_notes} />}
      {activeTab === 'finance' && <FinanceTab athleteId={athlete.id} initialInvoices={invoices} packages={packages} />}

      {/* Modals (zawsze renderowane, widoczność przez prop `open`) */}
      <SessionModal open={sessionModalOpen} ... />
      <RaceModal open={raceModalOpen} ... />
    </div>
  )
}
```

---

## Weryfikacja Fazy 2

```bash
node node_modules/next/dist/bin/next build
# Oczekiwany wynik: build bez błędów

# Sprawdź rozmiary po podziale:
find app/coach/athletes -name "*.tsx" | xargs wc -l | sort -rn
# Oczekiwany wynik: żaden plik nie powinien przekraczać 500 linii
```

---

---

# FAZA 3 — Podział `AthletesClient.tsx`

**Czas: ~1-2 godziny | Ryzyko: niskie | Priorytet: wysoki**

---

## Obecna struktura (1 038 linii)

Plik zawiera dwie osobne odpowiedzialności:
1. **Lista zawodników** — filtrowanie, sortowanie, drag & drop, kolumny
2. **Modal dodawania zawodnika** — formularz create athlete

---

## Krok 3.1 — Wyekstraktuj `AddAthleteModal.tsx`

**Nowy plik `app/coach/athletes/_components/AddAthleteModal.tsx`:**

```tsx
'use client'
import { useState, useActionState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { createAthlete } from '@/lib/actions/athletes'

interface AddAthleteModalProps {
  open: boolean
  packages: Package[]
  onClose: () => void
  onCreated: () => void  // callback po sukcesie — odśwież listę
}

export function AddAthleteModal({ open, packages, onClose, onCreated }: AddAthleteModalProps) {
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(packages[0] ?? null)
  const [state, formAction, pending] = useActionState(createAthlete, null)

  // Cały JSX formularza który był w AthletesClient
  // Pola: imię, email, telefon, wybór pakietu, cel

  return (
    <Modal open={open} onClose={onClose} title="Dodaj zawodnika">
      <form action={formAction}>
        {/* formularz */}
      </form>
    </Modal>
  )
}
```

**W `AthletesClient.tsx` zostaje:**
```tsx
import { AddAthleteModal } from './AddAthleteModal'

const [modalOpen, setModalOpen] = useState(false)

// W JSX:
<AddAthleteModal
  open={modalOpen}
  packages={packages}
  onClose={() => setModalOpen(false)}
  onCreated={() => {
    setModalOpen(false)
    router.refresh()
  }}
/>
```

---

## Krok 3.2 — Wyekstraktuj `StatusModal.tsx` (opcjonalnie)

Modal edycji statusów niestandardowych (~80 linii w AthletesClient) można wyekstraktować analogicznie.

---

## Weryfikacja Fazy 3

```bash
node node_modules/next/dist/bin/next build

# Sprawdź rozmiary:
wc -l app/coach/athletes/_components/AthletesClient.tsx
# Oczekiwany wynik: <550 linii
wc -l app/coach/athletes/_components/AddAthleteModal.tsx
# Oczekiwany wynik: <200 linii
```

---

---

# FAZA 3B — Podział `DashboardClient.tsx` i `AthleteTodayPage.tsx`

**Czas: ~2-3 godziny | Ryzyko: niskie | Priorytet: średni**

> Te pliki nie są tak krytyczne jak AthleteProfileClient, ale przekraczają rozsądny rozmiar.
> DashboardClient (787 linii) ma 8 sekcji renderowanych w jednym pliku.
> AthleteTodayPage (628 linii) miesza sesję dnia, nagrywanie głosu i modal feedbacku.

---

## Krok 3B.1 — Wyekstraktuj sekcje dashboardu

**Obecna struktura `DashboardClient.tsx` (787 linii):**
- 4 KPI cards na górze
- 8 sekcji: dzisiejsze sesje, feedback, wiadomości, zawody, aktywność, finanse, onboarding, uwagi

**Docelowa struktura:**

```
app/coach/dashboard/_components/
  DashboardClient.tsx              ← ~150 linii: layout + KPI + preferences hook
  sections/
    TodaySessionsSection.tsx       ← dzisiejsze sesje
    RecentFeedbackSection.tsx      ← ostatni feedback
    RecentMessagesSection.tsx      ← ostatnie wiadomości
    UpcomingRacesSection.tsx       ← nadchodzące zawody
    ActivitySection.tsx            ← aktywność zawodników
    FinanceSection.tsx             ← przychody / finanse
```

**Wzorzec ekstrakcji (każda sekcja):**

```tsx
// sections/TodaySessionsSection.tsx
'use client'
import { formatDate, timeAgo } from '@/lib/utils'

interface TodaySessionsSectionProps {
  sessions: DbRow[]
  athletes: DbRow[]
}

export function TodaySessionsSection({ sessions, athletes }: TodaySessionsSectionProps) {
  // JSX sekcji który był w DashboardClient
}
```

**W DashboardClient zostaje:**
- Stan preferencji (localStorage) — wydzielić do custom hooka `useDashboardPrefs()`
- KPI cards
- Logika drag & drop sekcji (jeśli jest)
- Renderowanie sekcji przez mapowanie

---

## Krok 3B.2 — Wyekstraktuj `useDashboardPrefs` hook

Logika preferencji dashboardu (widoczność/kolejność sekcji, localStorage) powinna być w osobnym hooku:

```tsx
// lib/useDashboardPrefs.ts
'use client'
import { useState, useEffect } from 'react'

interface DashboardPrefs {
  visibleSections: string[]
  sectionOrder: string[]
}

export function useDashboardPrefs() {
  // Stan + localStorage load/save
  // toggleSection(), reorderSections()
  return { prefs, toggleSection, reorderSections }
}
```

---

## Krok 3B.3 — Wyekstraktuj voice recorder z `AthleteTodayPage.tsx`

**Obecna struktura `AthleteTodayPage.tsx` (628 linii):**
- Widok sesji dnia (~200 linii)
- Modal feedbacku z formularzem (~200 linii)
- Voice recorder z Web Speech API (~150 linii)
- Helpery dat i parsowania (~80 linii)

**Docelowa struktura:**

```
app/u/[slug]/_components/
  AthleteTodayPage.tsx             ← ~250 linii: sesja dnia + modal feedbacku
  VoiceRecorder.tsx                ← ~150 linii: Web Speech API, nagrywanie, transkrypcja
  FeedbackForm.tsx                 ← ~200 linii: formularz feedbacku (wysiłek, humor, ból)
```

**`VoiceRecorder.tsx`:**
```tsx
'use client'
interface VoiceRecorderProps {
  onTranscript: (text: string) => void
}

export function VoiceRecorder({ onTranscript }: VoiceRecorderProps) {
  // useRef<any>(null) dla recognition — tu `any` jest uzasadniony (Web Speech API)
  // Stan: isRecording, transcript
  // Start/stop/cleanup
}
```

**`FeedbackForm.tsx`:**
```tsx
'use client'
interface FeedbackFormProps {
  sessionId: string
  athleteId: string
  onSubmitted: () => void
}

export function FeedbackForm({ sessionId, athleteId, onSubmitted }: FeedbackFormProps) {
  // Stan formularza: effort, mood, pain, notes
  // VoiceRecorder jako sub-komponent
  // Submit via createFeedback server action
}
```

---

## Weryfikacja Fazy 3B

```bash
node node_modules/next/dist/bin/next build

# Sprawdź rozmiary:
wc -l app/coach/dashboard/_components/DashboardClient.tsx
# Oczekiwany wynik: <250 linii

wc -l app/u/[slug]/_components/AthleteTodayPage.tsx
# Oczekiwany wynik: <300 linii
```

---

---

# FAZA 4 — Migracja mock data do Supabase

**Czas: ~3-5 godzin | Ryzyko: średnie | Priorytet: średni**

> Dotyczy `/coach/planner` i `/coach/crm` — jedynych aktywnych stron nadal używających mock data.
> Jeśli w Fazie 0 wybrałeś Opcję A (placeholder), wróć tutaj kiedy masz czas.

---

## Krok 4.1 — Migracja `/coach/planner`

Planner to widok `training_sessions` pogrupowanych po zawodnikach i dniach tygodnia.
Te dane już pobierasz w dashboardzie — wystarczy rozbudować zapytanie.

**Nowe zapytanie w `app/coach/planner/page.tsx`:**

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function PlannerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Tydzień bieżący
  const today = new Date()
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const weekStart = monday.toISOString().slice(0, 10)
  const weekEnd = sunday.toISOString().slice(0, 10)

  const [{ data: athletes }, { data: sessions }] = await Promise.all([
    supabase.from('athletes')
      .select('id, name, avatar, status')
      .eq('coach_id', user!.id)
      .neq('status', 'inactive')
      .order('name'),
    supabase.from('training_sessions')
      .select('id, athlete_id, date, type, title, planned_distance, completed')
      .eq('coach_id', user!.id)
      .gte('date', weekStart)
      .lte('date', weekEnd),
  ])

  return <PlannerClient athletes={athletes ?? []} sessions={sessions ?? []} weekStart={weekStart} />
}
```

Usuń import `from '@/lib/data'` z plannerPage.

---

## Krok 4.2 — Migracja `/coach/crm`

CRM wymaga nowej tabeli w Supabase lub adaptacji istniejących danych zawodników.

**Opcja prosta:** Użyj tabeli `athletes` z filtrowaniem po statusie jako pipeline:

```tsx
// Mapowanie etapów CRM na statusy zawodnika:
// 'inquiry' / 'conversation' / 'offer' → status = 'ok' ale bez join_date?
// Potrzeba nowego pola w athletes: 'crm_stage'
```

**Migracja SQL (uruchom w Supabase SQL Editor):**

```sql
-- Dodaj pole crm_stage do athletes
ALTER TABLE athletes
ADD COLUMN IF NOT EXISTS crm_stage TEXT DEFAULT 'active';

-- Istniejący zawodnicy: etap 'active'
-- Nowi potencjalni klienci: etap 'inquiry', 'conversation', 'offer', 'onboarding'
```

**Nowe zapytanie w `app/coach/crm/page.tsx`:**

```tsx
const { data: crmAthletes } = await supabase
  .from('athletes')
  .select('id, name, email, phone, crm_stage, created_at, status')
  .eq('coach_id', user!.id)
  .order('created_at', { ascending: false })
```

---

## Krok 4.3 — Usuń `lib/data.ts`

Po migracji obu stron:

```bash
# Sprawdź że nikt już nie importuje:
grep -rn "from '@/lib/data'" app/ lib/ --include="*.tsx" --include="*.ts"
# Jeśli brak outputu:
rm lib/data.ts
```

---

---

# FAZA 5 — Type safety (eliminacja `any`)

**Czas: ~2-3 godziny | Ryzyko: niskie | Priorytet: średni**

---

## Krok 5.1 — Wygeneruj typy Supabase

Supabase CLI może automatycznie wygenerować typy TypeScript na podstawie schematu bazy:

```bash
# Instalacja CLI (jeśli nie masz):
npm install -g supabase

# Logowanie:
supabase login

# Generowanie typów (zastąp PROJECT_ID swoim ID z Supabase dashboard):
npx supabase gen types typescript --project-id ohwdfjlsjpubiciprmxi > lib/supabase/database.types.ts
```

Plik `lib/supabase/database.types.ts` będzie zawierał:
```tsx
export type Database = {
  public: {
    Tables: {
      athletes: {
        Row: {
          id: string
          coach_id: string
          name: string
          avatar: string
          slug: string
          // ... wszystkie pola
        }
        Insert: { ... }
        Update: { ... }
      }
      training_sessions: { Row: { ... } }
      // ... wszystkie tabele
    }
  }
}
```

---

## Krok 5.2 — Utwórz pomocnicze typy wierszy

Dodaj do `lib/types.ts`:

```tsx
import type { Database } from './supabase/database.types'

// Typy wierszy z bazy — używaj tych zamiast 'any':
export type AthleteRow = Database['public']['Tables']['athletes']['Row']
export type SessionRow = Database['public']['Tables']['training_sessions']['Row']
export type FeedbackRow = Database['public']['Tables']['feedbacks']['Row']
export type InvoiceRow = Database['public']['Tables']['invoices']['Row']
export type MessageRow = Database['public']['Tables']['messages']['Row']
export type RaceRow = Database['public']['Tables']['athlete_races']['Row']
export type CoachRow = Database['public']['Tables']['coaches']['Row']
```

---

## Krok 5.3 — Zastąp `any` w komponentach

**Wzorzec zamiany:**

```tsx
// PRZED:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sessions = (todaySessions ?? []) as any[]

// PO:
import type { SessionRow } from '@/lib/types'
const sessions: SessionRow[] = todaySessions ?? []
```

**Priorytet plików (od największej liczby `any`):**
1. `app/coach/athletes/[id]/_components/AthleteProfileClient.tsx` (przy okazji Fazy 2)
2. `app/coach/athletes/_components/AthletesClient.tsx` (przy okazji Fazy 3)
3. `app/u/[slug]/_components/AthleteTodayPage.tsx`
4. `app/u/[slug]/_components/AthletePlanPage.tsx`
5. `app/u/[slug]/_components/AthleteHistoryPage.tsx`
6. `app/u/[slug]/_components/AthleteChatPage.tsx`

**Dla komponentów z joinami (np. `athletes(name, avatar)`):**

```tsx
// Supabase zwraca zagnieżdżone dane jako tablicę lub obiekt — zdefiniuj typ lokalnie:
type SessionWithAthlete = SessionRow & {
  athletes: { name: string; avatar: string } | null
}
```

---

## Krok 5.4 — Usuń eslint-disable komentarze

Po zamianie `any` na właściwe typy, usuń zbędne komentarze:

```bash
grep -rn "eslint-disable.*no-explicit-any" app/ --include="*.tsx" | wc -l
# Przed zmianami: ~20+
# Po zmianach: 0 (lub blisko 0)
```

---

---

# FAZA 6 — Testy i linting

**Czas: ~2 godziny | Ryzyko: zerowe | Priorytet: niski**

> Barrel exports (`index.ts`) celowo pominięte — w Next.js App Router mogą powodować
> problemy z tree-shaking i niepotrzebne bundlowanie Client Components.
> Bezpośrednie importy (`@/components/ui/Card`) są jaśniejsze i bezpieczniejsze.

---

## Krok 6.1 — Testy jednostkowe

Minimalne pokrycie testami dla krytycznej logiki:

**Priorytet 1 — `lib/utils.ts` (najłatwiejsze, czyste funkcje):**

```tsx
// lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { plural, sesjaLabel, tenureLabel, formatCurrency, timeAgo } from './utils'

describe('plural', () => {
  it('odmienia 1', () => expect(plural(1, 'sesja', 'sesje', 'sesji')).toBe('sesja'))
  it('odmienia 3', () => expect(plural(3, 'sesja', 'sesje', 'sesji')).toBe('sesje'))
  it('odmienia 11', () => expect(plural(11, 'sesja', 'sesje', 'sesji')).toBe('sesji'))
  it('odmienia 21', () => expect(plural(21, 'sesja', 'sesje', 'sesji')).toBe('sesja'))
})

describe('formatCurrency', () => {
  it('formatuje PLN', () => expect(formatCurrency(249)).toContain('249'))
})
```

**Priorytet 2 — `lib/actions/sessions.ts` (Server Actions):**
Wymagają mockowania Supabase — trochę więcej pracy. Można użyć `vitest` + `@supabase/supabase-js` mock.

**Instalacja:**
```bash
npm install -D vitest @vitejs/plugin-react
```

**Konfiguracja `vitest.config.ts`:**
```tsx
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: { environment: 'node' },
})
```

---

## Krok 6.2 — Konsekwentna kolejność importów

Skonfiguruj ESLint żeby wymuszał porządek importów:

```bash
npm install -D eslint-plugin-import
```

W `.eslintrc.json`:
```json
{
  "rules": {
    "import/order": ["warn", {
      "groups": ["builtin", "external", "internal", "parent", "sibling"],
      "newlines-between": "always"
    }]
  }
}
```

Pożądana kolejność w każdym pliku:
```tsx
// 1. React / Next.js
import { useState, useEffect } from 'react'
import Link from 'next/link'

// 2. Komponenty (od bardziej ogólnych do bardziej specyficznych)
import { Modal } from '@/components/ui'
import { CoachTopbar } from '@/components/coach/CoachTopbar'

// 3. Lib / utils / types
import { formatCurrency, plural } from '@/lib/utils'
import type { AthleteRow } from '@/lib/types'

// 4. Lokalne (relative imports)
import { SessionModal } from './modals/SessionModal'
```

---

---

# Podsumowanie — harmonogram

| Faza | Co | Czas | Ryzyko | Status |
|------|----|------|--------|--------|
| **0** | Sprzątanie: artefakty, legacy `/app/athlete/*`, duplikaty, `.env.example` | 30 min | Zerowe | ✅ DONE |
| **1** | Centralizacja helperów w `lib/utils.ts`, typ `DbRow` | 2h | Niskie | ✅ DONE |
| **2** | Podział `AthleteProfileClient.tsx` (2120 → 200 linii + 8 plików) | 5-6h | Średnie | ✅ DONE |
| **3** | Podział `AthletesClient.tsx` → `AddAthleteModal` + `StatusEditorModal` | 1-2h | Niskie | ✅ DONE |
| **3B** | Podział `DashboardClient.tsx` (765→351) + `AthleteTodayPage.tsx` (626→329) | 2-3h | Niskie | ✅ DONE |
| **4** | Usunięcie CRM + rebuild Planner z Supabase + nawigacja | 3-5h | Średnie | ✅ DONE |
| **5** | Type safety — typy Supabase, `any` → proper types (zostało 4 w Web Speech API) | 2-3h | Niskie | ✅ DONE |
| **6** | 34 testy (vitest) + fix plural() bug + ESLint sort-imports | 2h | Zerowe | ✅ DONE |

**Łącznie: ~18-24 godziny pracy**

---

## Zasada priorytetu

```
Faza 0 → Faza 1 → Faza 2 → Faza 3 → Faza 3B → Faza 4 → Faza 5 → Faza 6
   |          |         |         |
 Teraz     Teraz    Następnie  Następnie
```

Fazy 0, 1, 2 dają **80% wartości** z całego planu.
Fazy 3-6 to **dobry standard** — warte zrobienia ale nie blokujące.

---

## Osiągnięty stan (2026-03-15)

```
Największy plik: 408 linii (DataTab.tsx)       ✅ cel < 500
AthletesClient.tsx: 842 linii                  ⚠️  do podziału w przyszłości
Zduplikowane funkcje pomocnicze: 0             ✅
Pliki z mock data w produkcji: 0               ✅
Użycia `any`: 0 (Web Speech API: 4 uzasadnione)✅
Duplikaty komponentów: 0                       ✅
.env.example: aktualny                         ✅
Testy: 34/34 passing (lib/utils.ts)            ✅
Supabase typy wygenerowane                     ✅
```

## Opcjonalne kolejne kroki

- `AthletesClient.tsx` (842 linie) — wyekstraktować `useAthleteFilters()` hook (logika filtrowania/sortowania)
- Testy dla `lib/actions/*.ts` — wymaga mockowania Supabase client

---

*Każdy krok tego planu jest niezależny i można go wykonać osobno.*
*Po każdym kroku: `node node_modules/next/dist/bin/next build` — jeśli przechodzi, commit.*
