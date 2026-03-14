# Plan wdrożenia — Profil zawodnika

## Kontekst techniczny

- **Plik serwera:** `app/coach/athletes/[id]/page.tsx` — ładuje dane, przekazuje jako propsy
- **Plik klienta:** `app/coach/athletes/[id]/_components/AthleteProfileClient.tsx` — cały UI (~1500 linii)
- **Akcje:** `lib/actions/sessions.ts`, `lib/actions/races.ts`, `lib/actions/feedback.ts`, `lib/actions/invoices.ts`, `lib/actions/athletes.ts`
- **Schemat bazy:** `supabase/migrations/001_schema.sql`
- **Backend obsługuje:** pola wyników sesji (`actual_distance`, `actual_pace`, `avg_hr` itd.), `updateInvoiceStatus`, `replyFeedback`, `markFeedbackRead` — tylko brakuje UI

---

## Sprint 1 — Poprawki i quick wins

> Zero zmian w bazie. Wszystkie zmiany izolowane, niezależne od siebie.

### 1.1 Historia — statystyki i nawigacja

**Plik:** `AthleteProfileClient.tsx`

- Label `"Sesji w miesiącu"` → `"X / Y sesji"` gdzie X = `monthCompleted.length`, Y = `monthSessions.length`
- Usunąć podwójne `.filter()` w `<tbody>` — zamiast `[...initialSessions].filter(s => s.date.slice(0,7) === historyMonth)` użyć już obliczonej zmiennej `monthSessions` (posortowanej DESC)
- Dodać przycisk `Dziś` do nawigacji miesięcznej historii (aktualnie tylko ← →):
  ```tsx
  <button onClick={() => setHistoryMonth(currentMonth)} ...>Dziś</button>
  ```
- Sesje przyszłe w bieżącym miesiącu (status "Planowany") — wyświetlać poniżej separatora `— Nadchodzące —` lub innym kolorem aby nie mieszały się z historią ukończonych

### 1.2 Link zaproszenia — skrócenie tokenu

**Plik:** `AthleteProfileClient.tsx` (~linia 509)

- Token w wyświetlaniu skrócić: `t=${athlete.invite_token.slice(0, 8)}…`
- Kopiowanie, WhatsApp i Email nadal używają pełnego `inviteUrl` — tylko element `<code>` zmieniony

### 1.3 Topbar subtitle — bug z wiodącym separatorem

**Plik:** `AthleteProfileClient.tsx` (~linia 476)

Obecny kod: `` `${athlete.goal || ''} · ${athlete.package}` ``
Gdy brak celu → subtitle = `" · Pakiet"` (z wiodącym ` · `)

Fix:
```tsx
subtitle={[athlete.goal, athlete.package].filter(Boolean).join(' · ')}
```

### 1.4 Total km w headerze profilu

**Plik:** `AthleteProfileClient.tsx`

`totalKm` jest obliczone (~linia 279) ale nigdzie niewyświetlone.
Dodać do paska meta pod nazwą zawodnika:
```tsx
{totalKm > 0 && <span>🏃 {totalKm.toFixed(0)} km łącznie</span>}
```
Obok istniejących: `🎯 cel`, `📍 miasto`, `🎂 wiek`, `📅 Od...`

### 1.5 Chat deep-link + skrót w profilu

**Pliki:** `app/coach/chat/page.tsx`, `app/coach/chat/_components/ChatClient.tsx`, `AthleteProfileClient.tsx`

**ChatClient.tsx:**
- Dodać prop `initialAthleteId?: string`
- Zmienić inicjalizację state: `useState(initialAthleteId ?? athletes[0]?.id ?? '')`

**app/coach/chat/page.tsx:**
- Dodać `searchParams` do parametrów strony
- Odczytać `searchParams.athlete` i przekazać do `ChatClient` jako `initialAthleteId`

**AthleteProfileClient.tsx:**
- Dodać przycisk `💬 Chat` w headerze (obok ← Zawodnicy w topbar actions lub w profil card)
- Link: `href={'/coach/chat?athlete=' + athlete.id}`
- Jeśli `unreadMessagesCount > 0`: czerwony badge z liczbą na przycisku (po Sprint 3)

### 1.6 Pakiet — obsługa skasowanego pakietu

**Plik:** `AthleteProfileClient.tsx` (~linia 994)

W trybie edycji, w `<select>` pakietów:
- Jeśli `athlete.package` nie ma na liście `packages` → dodać jako pierwszą `<option>` z atrybutem `disabled` i tekstem `{athlete.package} (nieaktywny)`
- Zapobiega wyczyszczeniu wartości przy przypadkowym zapisie

```tsx
{!packages.some(p => p.name === dataEdit.package) && dataEdit.package && (
  <option value={dataEdit.package} disabled>{dataEdit.package} (nieaktywny)</option>
)}
```

### 1.7 Legenda typów treningowych — porządek w zakładce Plan

**Plik:** `AthleteProfileClient.tsx` (~linia 772)

- Usunąć całą sekcję `"Rodzaj treningu"` z dołu zakładki Plan (duża legenda badge'ów + przycisk ⚙)
- Przycisk `⚙ Edytuj typy` przenieść: mały link `⚙` bezpośrednio przy labelce `"Typ treningu"` w modalu sesji (~linia 1324)

```tsx
<label>Typ treningu <button onClick={openSessionTypeModal} style={{...}}>⚙</button></label>
```

### 1.8 Ujednolicenie formatu cen

**Plik:** `AthleteProfileClient.tsx`

- Header profilu (~linia 493): `{athlete.package} — {formatCurrency(athlete.package_price)}/mies.`
- Zakładka Dane, tryb podglądu (~linia 955): `{dataEdit.package_price} zł/mies.` → `{formatCurrency(Number(dataEdit.package_price))}/mies.`
- Jeden spójny format: `Starter — 299,00 zł/mies.` wszędzie

---

## Sprint 2 — Sesja: wyniki + wizualizacja kalendarza

> Backend w 100% gotowy. Jedna nowa mini-akcja serwera + UI.

### 2.1 Modal sesji — sekcja "Wyniki"

**Plik:** `AthleteProfileClient.tsx` (~linia 1310)

Sekcja `"Wyniki"` pojawia się gdy:
- `editingSessionId !== null` (edycja istniejącej sesji), LUB
- `draftDate < today` (nowa sesja na datę przeszłą)

Dodać do `SessionDraft`:
```typescript
interface SessionDraft {
  // ...istniejące pola...
  completed: boolean
  actualDistance: string
  actualDuration: string
  actualPace: string
  avgHr: string
  maxHr: string
}
```

UI sekcji:
```
─── Wyniki ──────────────────────
[toggle] Wykonana

(gdy toggle ON):
Dystans rzeczywisty (km)  [input]
Czas rzeczywisty (min)    [input]
Tempo rzeczywiste (/km)   [input]
Tętno średnie (bpm)       [input]
Tętno max (bpm)           [input]
```

W `saveSession()` — gdy edycja: dodać do FormData:
```typescript
fd.set('completed', draft.completed.toString())
if (draft.actualDistance) fd.set('actual_distance', draft.actualDistance)
if (draft.actualDuration) fd.set('actual_duration', draft.actualDuration)
if (draft.actualPace) fd.set('actual_pace', draft.actualPace)
if (draft.avgHr) fd.set('avg_hr', draft.avgHr)
if (draft.maxHr) fd.set('max_hr', draft.maxHr)
```

W `openEditSession()` — wczytać istniejące wartości do draftu.

### 2.2 Szybkie ✓ bez otwierania modala

**Plik:** `lib/actions/sessions.ts` (nowa funkcja) + `AthleteProfileClient.tsx`

Nowa akcja:
```typescript
export async function markSessionCompleted(id: string, athleteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  await supabase
    .from('training_sessions')
    .update({ completed: true })
    .eq('id', id)
    .eq('coach_id', user.id)

  revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true }
}
```

W widoku tygodniowym — na każdym kafelku nieukończonej sesji: mały przycisk `✓` w prawym górnym rogu.
```tsx
{!session.completed && (
  <button
    onClick={async e => {
      e.stopPropagation()
      await markSessionCompleted(session.id, athlete.id)
      startTransition(() => router.refresh())
    }}
    ...
  >✓</button>
)}
```

### 2.3 Wizualne rozróżnienie sesji w kalendarzu

**Plik:** `AthleteProfileClient.tsx`

| Stan | Warunek | Styl |
|------|---------|------|
| Wykonana | `session.completed === true` | Zielona obwódka `2px solid #2ECC71`, badge `✓` |
| Pominięta | `session.date < today && !session.completed` | `opacity: 0.4`, obwódka `1px dashed #E74C3C` |
| Zaplanowana | `session.date >= today && !session.completed` | Normalny styl |

Dotyczy widoku tygodniowego i miesięcznego.

### 2.4 Kopiowanie sesji

**Plik:** `AthleteProfileClient.tsx`

W stopce modalu edycji sesji — przycisk `📋 Duplikuj`:
- Zamknąć modal edycji
- Otworzyć modal nowej sesji z tymi samymi polami: `title`, `type`, `description`, `planned_distance`, `planned_duration`, `planned_pace`, `url`, `url_label`
- Data: pusta (trener wybiera)
- `editingSessionId` = null (to będzie nowa sesja)

```tsx
{editingSessionId && (
  <button onClick={() => {
    const currentDraft = { ...draft }
    setEditingSessionId(null)
    setDraft({ ...currentDraft, completed: false, actualDistance: '', ... })
    setDraftDate('')
    // modal zostaje otwarty, tylko zmienione dane
  }}>
    📋 Duplikuj
  </button>
)}
```

---

## Sprint 3 — Zakładka Feedback

> Dane już ładowane w page.tsx. Nowa zakładka + 2 bugi w akcjach do naprawienia.

### 3.1 Fix: revalidatePath w akcjach feedbacku

**Plik:** `lib/actions/feedback.ts`

`markFeedbackRead` i `replyFeedback` revalidują tylko `/coach/feedback`.
Profil zawodnika nie odświeża się po oznaczeniu/odpowiedzi — bug.

**`markFeedbackRead`** — dodać parametr `athleteId` (opcjonalny):
```typescript
export async function markFeedbackRead(id: string, athleteId?: string) {
  // ...istniejący kod...
  revalidatePath('/coach/feedback')
  if (athleteId) revalidatePath(`/coach/athletes/${athleteId}`)
}
```

**`replyFeedback`** — dodać `athlete_id` do FormData i revalidować profil:
```typescript
const athleteId = formData.get('athlete_id') as string
// ...istniejący kod...
revalidatePath('/coach/feedback')
if (athleteId) revalidatePath(`/coach/athletes/${athleteId}`)
```

### 3.2 Unread messages — query w page.tsx

**Plik:** `app/coach/athletes/[id]/page.tsx`

Dodać do `Promise.all`:
```typescript
supabase
  .from('messages')
  .select('id', { count: 'exact', head: true })
  .eq('athlete_id', id)
  .eq('sender_type', 'athlete')
  .eq('read', false)
```

Wynik `unreadMessagesCount` (liczba lub 0) przekazać jako prop do `AthleteProfileClient`.

### 3.3 Nowa zakładka "Feedback"

**Plik:** `AthleteProfileClient.tsx`

Dodać do tablicy `tabs`:
```typescript
{ id: 'feedback', label: 'Feedback' }
```
Kolejność: Plan | Historia | **Feedback** | Zawody | Notatki | Dane | Finanse

Unread badge na zakładce:
```tsx
{ id: 'feedback', label: `Feedback${unreadFeedbackCount > 0 ? ` (${unreadFeedbackCount})` : ''}` }
```
Gdzie `unreadFeedbackCount = athleteFeedbacks.filter(f => !f.read).length` (obliczone z już załadowanych danych).

### 3.4 Widok zakładki Feedback

```
[kolorowa kropka] [data]  [ai_summary]          [badge NOWE]
  ▼ rozwiń
  ┌────────────────────────────────────────────┐
  │ 😊 Dobrze  · 🏃 Easy  · 📏 12 km          │
  │ "Trening poszedł świetnie, nogi lekkie"    │
  │                                            │
  │ [💬 Odpowiedz]                             │
  └────────────────────────────────────────────┘
```

- Lista sortowana od najnowszego (`athleteFeedbacks` jest już posortowane DESC)
- Każdy wiersz: `signal` dot + `formatDate(f.created_at)` + `f.ai_summary` + badge `NOWE` jeśli `!f.read`
- Kliknięcie wiersza: toggle rozwinięcia → `FeedbackDetail` (komponent już istnieje)
- Przy rozwinięciu: wywołać `markFeedbackRead(f.id, athlete.id)` + `startTransition(router.refresh())`
- Jeśli brak feedbacków: empty state `"Brak feedbacków od zawodnika"`

### 3.5 Odpowiedź trenera inline

Pod `FeedbackDetail` jeśli brak `fb.coach_reply`:
```tsx
<div>
  <textarea
    value={replyText}
    onChange={e => setReplyText(e.target.value)}
    placeholder="Napisz odpowiedź..."
    rows={3}
  />
  <button onClick={async () => {
    const fd = new FormData()
    fd.set('id', fb.id)
    fd.set('reply', replyText)
    fd.set('athlete_id', athlete.id)
    await replyFeedback(null, fd)
    startTransition(() => router.refresh())
  }}>Wyślij odpowiedź</button>
</div>
```

State `replyText` per feedback (lokalny w komponencie lub mapa `Record<string, string>`).
Jeśli `fb.coach_reply` istnieje: pokazuje odpowiedź (już obsługuje `FeedbackDetail`).

### 3.6 Chat badge w headerze

Po dodaniu `unreadMessagesCount` prop:
```tsx
<Link href={`/coach/chat?athlete=${athlete.id}`}>
  💬 Chat
  {unreadMessagesCount > 0 && (
    <span className="badge">{unreadMessagesCount}</span>
  )}
</Link>
```

---

## Sprint 4 — Zawody v2

> Wymaga migracji bazy danych.

### 4.1 Migracja SQL

Uruchomić w Supabase SQL Editor:
```sql
-- Stwórz tabelę jeśli nie istnieje (tabela mogła być tworzona ręcznie)
CREATE TABLE IF NOT EXISTS athlete_races (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id  UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  coach_id    UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  date        DATE NOT NULL,
  distance    TEXT,
  goal_time   TEXT,
  notes       TEXT,
  result      TEXT,
  status      TEXT NOT NULL DEFAULT 'upcoming',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dodaj brakujące kolumny jeśli tabela już istnieje
ALTER TABLE athlete_races
  ADD COLUMN IF NOT EXISTS result TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'upcoming';

-- RLS
ALTER TABLE athlete_races ENABLE ROW LEVEL SECURITY;
CREATE POLICY "races_coach_own" ON athlete_races
  FOR ALL USING (coach_id = auth.uid());

-- Index
CREATE INDEX IF NOT EXISTS races_athlete_idx ON athlete_races(athlete_id);
CREATE INDEX IF NOT EXISTS races_date_idx ON athlete_races(date);
```

Zaktualizować `supabase/migrations/001_schema.sql` o pełną definicję tabeli `athlete_races`.

### 4.2 Zaktualizować akcje races

**Plik:** `lib/actions/races.ts`

W `createRace` i `updateRace` — dodać:
```typescript
result: formData.get('result') as string || null,
status: formData.get('status') as string || 'upcoming',
```

Dodać `RaceDraft` interface:
```typescript
interface RaceDraft {
  name: string; date: string; distance: string
  goalTime: string; notes: string
  result: string; status: string  // ← nowe
}
```

Zaktualizować `openEditRace` żeby wczytywało `race.result` i `race.status`.

### 4.3 Modal zawodów — nowe pola

**Plik:** `AthleteProfileClient.tsx` (~linia 1275)

Dodać do modalu:
- **Status** (select): `upcoming → "Zaplanowane"`, `finished → "Ukończone"`, `cancelled → "Odwołane"`
- **Wynik** (text input): pojawia się gdy `status === 'finished'` lub `raceDraft.date < today`
  - Placeholder: `np. 3:42:15`

```tsx
<div>
  <label>Status</label>
  <select value={raceDraft.status} onChange={e => setRaceDraft(d => ({ ...d, status: e.target.value }))}>
    <option value="upcoming">Zaplanowane</option>
    <option value="finished">Ukończone</option>
    <option value="cancelled">Odwołane</option>
  </select>
</div>
{(raceDraft.status === 'finished' || raceDraft.date < today) && (
  <div>
    <label>Wynik</label>
    <input value={raceDraft.result} onChange={...} placeholder="np. 3:42:15" />
  </div>
)}
```

### 4.4 Tabela zawodów — podział na sekcje

**Plik:** `AthleteProfileClient.tsx` (~linia 1113)

Podzielić `initialRaces` na dwie listy:
```typescript
const upcomingRaces = initialRaces.filter(r => r.status === 'upcoming' && r.date >= today)
const pastRaces = initialRaces.filter(r => r.status !== 'upcoming' || r.date < today)
```

- **Nadchodzące**: normalny styl, posortowane rosnąco po dacie
- **Przeszłe**: opacity 70%, posortowane malejąco, osobna sekcja z nagłówkiem `"Wyniki"`
- Dla przeszłych: kolumna `Wynik` zamiast `Cel` (lub obie: `Cel → Wynik`)
- Jeśli obie listy puste: istniejący empty state
- Sekcja "Przeszłe" wyświetlana tylko jeśli `pastRaces.length > 0`

---

## Sprint 5 — Finanse z profilu

> Backend gotowy. Jeden fix schematu (attachment_url).

### 5.1 Fix schematu — attachment_url

Uruchomić w Supabase SQL Editor:
```sql
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS attachment_url TEXT;
```

Zaktualizować `supabase/migrations/001_schema.sql`.

### 5.2 Tworzenie faktury z profilu

**Pliki:** `AthleteProfileClient.tsx`, `lib/actions/invoices.ts`

Przycisk `+ Nowa faktura` w nagłówku zakładki Finanse.
State: `invoiceModalOpen`, `invoiceDraft` (description, amount, dueDate, file).

Modal:
```
Opis (opcjonalny)          [input]
Kwota (zł) *               [number input]
Termin płatności           [date input — domyślnie +14 dni]
Załącznik (PDF/JPG/PNG)    [file input]

[Anuluj]  [Utwórz fakturę]
```

`athlete_id` i `package` — ukryte, prepopulowane z `athlete.id` i `athlete.package`.

Obsługa błędu: jeśli `result.error` → wyświetlić czerwony komunikat pod przyciskiem.
Po sukcesie: zamknąć modal, `startTransition(router.refresh())`.

### 5.3 Zmiana statusu faktury inline

**Plik:** `AthleteProfileClient.tsx` (~linia 1221)

State: `editingInvoiceStatusId: string | null`

Kliknięcie badge statusu → mini dropdown:
```tsx
<div className="relative">
  <span onClick={() => setEditingInvoiceStatusId(inv.id)} className="cursor-pointer ...">
    {invoiceStatusLabel(inv.status)}
  </span>
  {editingInvoiceStatusId === inv.id && (
    <div className="absolute ... dropdown">
      {['paid', 'pending', 'overdue', 'cancelled'].map(s => (
        <button key={s} onClick={async () => {
          await updateInvoiceStatus(inv.id, s)
          setEditingInvoiceStatusId(null)
          startTransition(() => router.refresh())
        }}>
          {invoiceStatusLabel(s)}
        </button>
      ))}
    </div>
  )}
</div>
```

Zamknięcie dropdownu: `useEffect` z `document.addEventListener('click', close)` gdy `editingInvoiceStatusId !== null`.

### 5.4 Czwarty stat-card: "Do zapłaty"

```tsx
{
  label: 'Do zapłaty',
  value: formatCurrency(
    athleteInvoices
      .filter(i => i.status === 'pending' || i.status === 'overdue')
      .reduce((s, i) => s + i.amount, 0)
  ),
  color: pending+overdue > 0 ? 'text-red-400' : 'text-green-400'
}
```

Zmienić grid: `grid-cols-3` → `grid-cols-4`.

---

## Sprint 6 — Dane v2

> Czyste UI. Baza gotowa: `injuries TEXT[]`, `personal_bests JSONB`.

### 6.1 Kontuzje — edytowalny tag input

**Plik:** `AthleteProfileClient.tsx`

Dodać do stanu edycji:
```typescript
injuries: (athlete.injuries as string[]) ?? []
```

W trybie podglądu (linia ~1075) — sekcja już pokazuje tagi. Teraz zawsze widoczna (nie tylko gdy `athlete.injuries.length > 0`).

W trybie edycji — nowa sekcja pod formularzem:
```tsx
<div>
  <label>Kontuzje / historia</label>
  <div className="flex flex-wrap gap-1.5 mb-2">
    {dataEdit.injuries.map(inj => (
      <span key={inj} className="tag">
        {inj}
        <button onClick={() => removeInjury(inj)}>✕</button>
      </span>
    ))}
  </div>
  <input
    value={injuryInput}
    onChange={e => setInjuryInput(e.target.value)}
    onKeyDown={e => e.key === 'Enter' && addInjury()}
    placeholder="np. Kolano lewe — Enter żeby dodać"
  />
</div>
```

W `saveData()` — dodać:
```typescript
fd.set('injuries', JSON.stringify(dataEdit.injuries))
```

W `lib/actions/athletes.ts` — upewnić się że `updateAthlete` obsługuje pole `injuries`:
```typescript
if (formData.get('injuries')) {
  updates.injuries = JSON.parse(formData.get('injuries') as string)
}
```

### 6.2 Rekordy życiowe — własne dystanse

**Plik:** `AthleteProfileClient.tsx`

Zastąpić hardcoded `PB_DISTANCES`:
```typescript
const DEFAULT_PB_DISTANCES = ['5 km', '10 km', 'Półmaraton', 'Maraton']

// Inicjalizacja — łączy domyślne z już zapisanymi w bazie
const savedDistances = Object.keys(athlete.personal_bests ?? {})
const initialDistances = [
  ...DEFAULT_PB_DISTANCES,
  ...savedDistances.filter(d => !DEFAULT_PB_DISTANCES.includes(d))
]
const [pbDistances, setPbDistances] = useState(initialDistances)
```

W trybie edycji — przycisk `+ Dodaj dystans`:
```tsx
<div>
  <input
    value={newPbDistance}
    onChange={e => setNewPbDistance(e.target.value)}
    onKeyDown={e => {
      if (e.key === 'Enter' && newPbDistance.trim()) {
        setPbDistances(d => [...d, newPbDistance.trim()])
        setPbEdit(p => ({ ...p, [newPbDistance.trim()]: '' }))
        setNewPbDistance('')
      }
    }}
    placeholder="np. 3 km, Triathlon, 100 km"
  />
</div>
```

Przy dystansach w trybie edycji: przycisk `✕` usuwa dystans z listy i z `pbEdit`.

---

## Kolejność i zależności

| Sprint | Złożoność | Zależności | Migracja SQL |
|--------|-----------|------------|--------------|
| Sprint 1 | Mała | — | Nie |
| Sprint 2 | Średnia | Sprint 1 (⚙ przeniesione) | Nie |
| Sprint 3 | Średnia | Sprint 1 (Chat) | Nie |
| Sprint 4 | Średnia | — | **TAK** |
| Sprint 5 | Mała | — | **TAK** (attachment_url) |
| Sprint 6 | Mała | — | Nie |

Sprinty 4, 5, 6 niezależne — można robić równolegle ze Sprintami 2 i 3.

---

## Checklist wszystkich zmian w plikach

### `app/coach/athletes/[id]/page.tsx`
- [ ] Dodać query dla `unreadMessagesCount`

### `app/coach/athletes/[id]/_components/AthleteProfileClient.tsx`
- [ ] 1.1 Historia: label, double filter, Dziś button, przyszłe sesje
- [ ] 1.2 Invite token truncation
- [ ] 1.3 Topbar subtitle bug
- [ ] 1.4 Total km w headerze
- [ ] 1.5 Chat button w headerze
- [ ] 1.6 Package dropdown edge case
- [ ] 1.7 Usunięcie legendy typów z Planu, ⚙ w modalu
- [ ] 1.8 Format cen
- [ ] 2.1 Modal sesji: sekcja Wyniki
- [ ] 2.2 Quick ✓ w widoku tygodniowym
- [ ] 2.3 Wizualne rozróżnienie sesji
- [ ] 2.4 Duplikowanie sesji
- [ ] 3.3 Nowa zakładka Feedback (badge unread)
- [ ] 3.4 Widok zakładki Feedback (lista, rozwinięcie, markAsRead)
- [ ] 3.5 Odpowiedź trenera inline
- [ ] 3.6 Chat badge (unread messages)
- [ ] 4.2 RaceDraft + openEditRace z result/status
- [ ] 4.3 Modal zawodów: status + wynik
- [ ] 4.4 Tabela zawodów: sekcje Nadchodzące / Przeszłe
- [ ] 5.2 Modal tworzenia faktury
- [ ] 5.3 Inline zmiana statusu faktury
- [ ] 5.4 Czwarty stat-card "Do zapłaty"
- [ ] 6.1 Kontuzje: tag input w edycji
- [ ] 6.2 PB: własne dystanse

### `lib/actions/sessions.ts`
- [ ] 2.2 Nowa funkcja `markSessionCompleted(id, athleteId)`

### `lib/actions/feedback.ts`
- [ ] 3.1 `markFeedbackRead` — dodać `athleteId`, revalidate profilu
- [ ] 3.1 `replyFeedback` — dodać `athlete_id` z FormData, revalidate profilu

### `lib/actions/races.ts`
- [ ] 4.2 `createRace` i `updateRace` — dodać `result`, `status`

### `lib/actions/athletes.ts`
- [ ] 6.1 `updateAthlete` — obsługa pola `injuries` jako JSON array

### `app/coach/chat/_components/ChatClient.tsx`
- [ ] 1.5 Prop `initialAthleteId`, useState z tym propem

### `app/coach/chat/page.tsx`
- [ ] 1.5 Odczytać `searchParams.athlete`, przekazać do ChatClient

### `supabase/migrations/001_schema.sql`
- [ ] 4.1 Definicja tabeli `athlete_races` (result, status, RLS, indexes)
- [ ] 5.1 Kolumna `attachment_url` w `invoices`
