# Plan poprawek — Panel zawodnika

## Kontekst
Plik klienta: `app/coach/athletes/[id]/_components/AthleteProfileClient.tsx`
Plik serwera: `app/coach/athletes/[id]/page.tsx`

---

## Grupa A — Bugi (priorytet wysoki)

### A1. Cancel w Notatkach nie resetuje tekstu
**Plik:** `AthleteProfileClient.tsx` ~linia 1644

**Problem:** Kliknięcie "Anuluj" w zakładce Notatki zamyka tryb edycji, ale `coachNotes` pozostaje z wpisanym (niezapisanym) tekstem. Widok podglądu pokazuje edytowany, anulowany tekst.

**Fix:**
```tsx
// Obecny:
onClick={() => setNotesEditing(false)}

// Poprawiony:
onClick={() => {
  setNotesEditing(false)
  setCoachNotes(athlete.coach_notes ?? '')
}}
```

---

### A2. `join_date` zawsze wyświetlana w headerze (crash gdy null)
**Plik:** `AthleteProfileClient.tsx` ~linia 709

**Problem:** `<span>📅 Od {formatDate(athlete.join_date, ...)}</span>` renderuje się zawsze, nawet gdy `join_date` jest null → pokazuje "Od Invalid Date".

**Fix:**
```tsx
// Obecny:
<span>📅 Od {formatDate(athlete.join_date, { month: 'long', year: 'numeric' })}</span>

// Poprawiony:
{athlete.join_date && (
  <span>📅 Od {formatDate(athlete.join_date, { month: 'long', year: 'numeric' })}</span>
)}
```

---

### A3. Layout Danych — Kontuzje pod Danymi zamiast pod Rekordami
**Plik:** `AthleteProfileClient.tsx` ~linia 1116

**Problem:** Aktualnie trzy karty w `grid-cols-2`:
```
| Dane zawodnika  | Rekordy życiowe |
| Kontuzje        |                 |   ← źle
```
Kontuzje lądują w lewej kolumnie, prawa jest pusta pod Rekordami.

**Oczekiwany układ:**
```
| Dane zawodnika  | Rekordy życiowe |
|                 | Kontuzje        |   ← dobrze
```

**Fix:** Zawinąć Rekordy i Kontuzje w `<div className="flex flex-col gap-6">`, a Dane zostawić jako pierwsza karta:

```tsx
{activeTab === 'data' && (
  <div className="grid grid-cols-2 gap-6">
    {/* Lewa kolumna */}
    <Card className="p-5">
      {/* Dane zawodnika — bez zmian */}
    </Card>

    {/* Prawa kolumna — oba boxy w pionie */}
    <div className="flex flex-col gap-6">
      <Card className="p-5">
        {/* Rekordy życiowe — bez zmian w logice */}
      </Card>
      <Card className="p-5">
        {/* Kontuzje — bez zmian w logice */}
      </Card>
    </div>
  </div>
)}
```

**Dodatkowy wymóg:** Box z Rekordami życiowymi ma mieć wysokość dopasowaną do zawartości (brak pustej przestrzeni pod spodem). Aktualnie Card rozciąga się na pełną wysokość gridu — po przeniesieniu do `flex flex-col` box automatycznie dopasuje się do zawartości (nie ma `h-full` ani `self-stretch`). Wystarczy usunąć lub nie dodawać żadnej klasy wymuszającej rozciąganie.

---

## Grupa B — Brakujące funkcje

### B1. Status zawodnika — widoczność i edycja
**Plik:** `AthleteProfileClient.tsx`

**Problem:** Pole `status` (ok / paused / cancelled) jest w bazie i w stanie `dataEdit`, ale nigdzie nie jest wyświetlane ani edytowalne przez UI.

**Fix 1 — widoczność w headerze:** Pokazać badge przy nazwie zawodnika gdy status ≠ 'ok':
```tsx
{athlete.status && athlete.status !== 'ok' && (
  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
    style={{
      background: athlete.status === 'paused' ? 'rgba(241,196,15,0.15)' : 'rgba(231,76,60,0.15)',
      color: athlete.status === 'paused' ? '#F1C40F' : '#E74C3C'
    }}>
    {athlete.status === 'paused' ? '⏸ Pauza' : '✕ Nieaktywny'}
  </span>
)}
```

**Fix 2 — edycja w zakładce Dane:** Dodać select do formularza edycji danych:
```tsx
<div>
  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Status współpracy</label>
  <select
    value={dataEdit.status}
    onChange={e => setDataEdit(d => ({ ...d, status: e.target.value }))}
    className="w-full px-3 py-2 rounded-xl text-sm cursor-pointer"
    style={inputStyle}
  >
    <option value="ok">Aktywny</option>
    <option value="paused">Pauza</option>
    <option value="cancelled">Nieaktywny</option>
  </select>
</div>
```
Dodać po polu "Cel treningowy" w pętli pól, jako oddzielny element (nie przez generyczną pętlę — ma inny typ inputa).

---

### B2. 4. karta KPI "Do zapłaty" w Finansach
**Plik:** `AthleteProfileClient.tsx` ~linia 1682

**Problem:** Są tylko 3 karty (Opłacono, Oczekujące, Przeterminowane). Brakuje karty "Do zapłaty" sumującej pending + overdue.

**Fix:** Zmienić `grid-cols-3` na `grid-cols-4` i dodać kartę:
```tsx
<div className="grid grid-cols-4 gap-4">
  {[
    { label: 'Opłacono łącznie', value: formatCurrency(totalPaid), color: 'text-green-400' },
    { label: 'Do zapłaty', value: formatCurrency(
        localInvoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0)
      ), color: localInvoices.some(i => i.status === 'pending' || i.status === 'overdue') ? 'text-red-400' : 'text-green-400' },
    { label: 'Oczekujące', value: formatCurrency(localInvoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0)), color: 'text-yellow-400' },
    { label: 'Przeterminowane', value: formatCurrency(localInvoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0)), color: 'text-red-400' },
  ].map(kpi => (...))}
</div>
```

---

### B3. Załącznik faktury — link w tabeli
**Plik:** `AthleteProfileClient.tsx` ~linia 1704

**Problem:** Faktura może mieć `attachment_url` (PDF/JPG), ale tabela go nie wyświetla.

**Fix:** Dodać kolumnę "Załącznik" do tabeli lub dodać ikonkę w kolumnie Opis:
```tsx
// W nagłówku tabeli — dodać kolumnę:
{['Nr faktury', 'Opis', 'Data', 'Termin', 'Kwota', 'Status', ''].map(h => ...)}

// W wierszu — ostatnia kolumna:
<td className="px-4 py-3">
  {inv.attachment_url && (
    <a href={inv.attachment_url} target="_blank" rel="noopener noreferrer"
      className="text-xs px-2 py-1 rounded-lg"
      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
      title="Otwórz załącznik">
      📎
    </a>
  )}
</td>
```

---

## Grupa C — UX (priorytet średni)

### C1. Pusta przestrzeń na dole każdej zakładki
**Plik:** `AthleteProfileClient.tsx`

**Problem:** Przy przewijaniu strony w dół treść zakładki dochodzi do samego dołu ekranu — zawodnik/trener musi przewijać bardzo precyzyjnie. Brakuje dolnego paddingu pozwalającego na komfortowe przewinięcie.

**Fix:** Zmienić wrapper `<div className="p-6">` (linia ~683) na `<div className="p-6 pb-32">` — 128px pustej przestrzeni na dole.

Alternatywnie, jeśli każda zakładka ma osobny wrapper, dodać `pb-20` do każdego kontenera zakładki:
```tsx
{/* Plan */}
{activeTab === 'plan' && (
  <div className="pb-20">
    ...
  </div>
)}

{/* Historia */}
{activeTab === 'history' && (() => {
  return (
    <div className="space-y-4 pb-20">
      ...
    </div>
  )
})()}

// itd. dla każdej zakładki
```

**Najprościej:** Dodać `pb-32` do głównego wrappera `<div className="p-6">` → obejmie wszystkie zakładki jedną zmianą.

---

### C2. Notatki do zawodów — eleganckie wyświetlanie
**Plik:** `AthleteProfileClient.tsx` — komponent `RaceNoteCell` (~linia 42)

**Problem:** Kliknięcie w ikonę 📝 pokazuje notatkę bezpośrednio pod ikoną w komórce tabeli — tekst pojawia się w środku wiersza tabeli, rozszerza wiersz i wygląda nieprofesjonalnie.

**Obecny kod:**
```tsx
function RaceNoteCell({ notes, isOpen, onToggle }) {
  return (
    <td>
      {notes ? (
        <div>
          <button onClick={onToggle}>📝</button>
          {isOpen && (
            <div className="mt-1.5 text-xs ...">
              {notes}
            </div>
          )}
        </div>
      ) : <span>—</span>}
    </td>
  )
}
```

**Fix — Tooltip/Popover w portalu:**
Zastąpić inline-rozwijanie tooltipem pozycjonowanym absolutnie przez `createPortal` (ten sam wzorzec co `InvoiceStatusDropdown`):

```tsx
function RaceNoteCell({ notes, isOpen, onToggle }: { notes?: string | null; isOpen: boolean; onToggle: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (!isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      let left = rect.left
      if (left + 280 > window.innerWidth) left = rect.right - 280
      setCoords({ top: rect.bottom + 6, left })
    }
    onToggle()
  }

  return (
    <td className="px-4 py-3 text-xs">
      {notes ? (
        <>
          <button
            ref={btnRef}
            onClick={handleToggle}
            className="cursor-pointer text-base leading-none opacity-70 hover:opacity-100 transition-opacity"
            title="Pokaż notatkę"
          >
            📝
          </button>
          {isOpen && createPortal(
            <div
              onMouseDown={e => e.stopPropagation()}
              style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                zIndex: 9999,
                width: 280,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                padding: '12px 14px',
              }}
            >
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                📝 Notatka
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {notes}
              </p>
            </div>,
            document.body
          )}
        </>
      ) : (
        <span style={{ color: 'var(--text-muted)' }}>—</span>
      )}
    </td>
  )
}
```

**Dodać zamykanie:** W `useEffect` nasłuchiwać na `mousedown` i `scroll` (identycznie jak w `InvoiceStatusDropdown`) — ale `RaceNoteCell` jest komponentem funkcyjnym więc `useEffect` jest dostępny. Alternatywnie — obsłużyć zamykanie przez `openNoteRaceId` w rodzicu tak jak jest teraz, tylko poprawić wygląd.

**Import:** `import { createPortal } from 'react-dom'` — już jest w pliku (przez InvoiceStatusDropdown), ale `RaceNoteCell` jest poza komponentem głównym — trzeba zaimportować `useRef, useState` w scope pliku (już są).

---

### C3. Historia — wyraźne rozróżnienie sesji przyszłych
**Plik:** `AthleteProfileClient.tsx` ~linia 1060

**Problem:** W zakładce Historia w bieżącym miesiącu pojawiają się sesje z przyszłymi datami (status "Planowany") wymieszane z historią ukończonych/pominiętych. To myli — historia to przeszłość.

**Fix:** Podzielić `monthSessions` na dwie grupy i wyświetlić separator:

```tsx
const pastSessions = monthSessions.filter(s => s.date <= today)
const futureSessions = monthSessions.filter(s => s.date > today)
```

Renderować najpierw `pastSessions`, a potem jeśli `futureSessions.length > 0`:
```tsx
{futureSessions.length > 0 && (
  <tr>
    <td colSpan={8} className="px-4 py-2 text-center">
      <span className="text-xs px-3 py-1 rounded-full"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
        — Nadchodzące w tym miesiącu —
      </span>
    </td>
  </tr>
)}
{futureSessions.map(session => renderSessionRow(session))}
```

---

### C4. Wynik zawodów dla DNF
**Plik:** `AthleteProfileClient.tsx` ~linia 1808

**Problem:** Pole "Wynik" w modalu zawodów pokazuje się tylko gdy `status === 'completed'`. Przy DNF też może być cząstkowy wynik (np. "15 km").

**Fix:**
```tsx
// Obecny:
{raceDraft.status === 'completed' && (

// Poprawiony:
{(raceDraft.status === 'completed' || raceDraft.status === 'dnf') && (
```

---

### C5. Kolumna Tempo w historii — oznaczenie actual vs planned
**Plik:** `AthleteProfileClient.tsx` ~linia 1077

**Problem:** Kolumna Tempo pokazuje `actual_pace || planned_pace` bez rozróżnienia. Trener nie wie czy to wynik czy plan.

**Fix:**
```tsx
// Obecny:
<td>{session.actual_pace || session.planned_pace || '—'}</td>

// Poprawiony:
<td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
  {session.actual_pace
    ? session.actual_pace
    : session.planned_pace
      ? <span style={{ opacity: 0.5 }}>({session.planned_pace})</span>
      : '—'}
</td>
```

---

### C6. Walidacja daty w modalu sesji
**Plik:** `AthleteProfileClient.tsx` ~linia 466

**Problem:** `saveSession()` nie waliduje daty — można zapisać sesję bez wybranej daty (szczególnie po duplikacji, gdy data jest celowo czyszczona).

**Fix:**
```tsx
async function saveSession() {
  if (!draft.title.trim() || !draftDate || saving) return
  // ...
}
```

Dodatkowo wyłączyć przycisk "Dodaj sesję" gdy brak daty:
```tsx
<Button disabled={!draft.title.trim() || !draftDate || saving}>
```

---

### C7. "+N więcej" w kalendarzu miesięcznym — klikalne
**Plik:** `AthleteProfileClient.tsx` ~linia 936

**Problem:** `+{daySessions.length - 3} więcej` to `<div>`, nie jest klikalne. Trzeba kliknąć numer dnia żeby zobaczyć pełną listę.

**Fix:** Zmienić na `<button>` który wywołuje `setSelectedDay(dateStr)`:
```tsx
{daySessions.length > 3 && (
  <button
    onClick={e => { e.stopPropagation(); setSelectedDay(dateStr) }}
    className="text-xs px-1 cursor-pointer hover:underline"
    style={{ color: 'var(--text-muted)' }}
  >
    +{daySessions.length - 3} więcej
  </button>
)}
```

---

### C8. Widok dnia w kalendarzu miesięcznym — completion style
**Plik:** `AthleteProfileClient.tsx` ~linia 963

**Problem:** Panel szczegółowy po kliknięciu dnia (selectedDay) nie pokazuje statusu wykonania sesji ani wyników rzeczywistych — wszystkie sesje wyglądają identycznie.

**Fix:** Dodać `completionStyle` i wyniki do wiersza sesji w day detail:
```tsx
{initialSessions.filter(s => s.date === selectedDay).map(session => (
  <div key={session.id}
    className={`flex items-center gap-4 p-3 rounded-xl ${typeClass(session.type)}`}
    style={{ ...typeStyle(session.type), ...completionStyle(session) }}>
    <div className="flex-1">
      <div className="font-semibold text-sm">{session.title}</div>
      <div className="flex gap-4 text-xs opacity-70 mt-1">
        {/* Wyniki rzeczywiste jeśli wykonana */}
        {session.actual_distance
          ? <span style={{ color: '#2ECC71' }}>✓ {session.actual_distance} km</span>
          : session.planned_distance && <span>📏 {session.planned_distance} km</span>}
        {session.planned_duration && !session.actual_duration && <span>⏱️ {session.planned_duration} min</span>}
        {session.actual_pace && <span>⚡ {session.actual_pace}/km</span>}
      </div>
      ...
    </div>
    ...
  </div>
))}
```

---

## Podsumowanie — kolejność wdrożenia

### Krok 1 — Bugi krytyczne (szybkie)
| ID | Zmiana | Linia | Czas |
|----|--------|-------|------|
| A1 | Cancel Notatki reset | ~1644 | 2 min |
| A2 | join_date null guard | ~709 | 1 min |
| A3 | Layout Danych — prawa kolumna | ~1116 | 10 min |
| C1 | Padding na dole każdej zakładki | ~683 | 2 min |

### Krok 2 — Funkcje (ważne)
| ID | Zmiana | Linia | Czas |
|----|--------|-------|------|
| B1 | Status zawodnika — badge + select | header + form | 15 min |
| B2 | 4. karta KPI "Do zapłaty" | ~1682 | 5 min |
| B3 | Załącznik faktury — ikona 📎 | ~1704 | 5 min |
| C2 | Notatki zawodów — portal tooltip | ~42 | 20 min |

### Krok 3 — Drobne UX
| ID | Zmiana | Linia | Czas |
|----|--------|-------|------|
| C3 | Historia — separator przyszłych sesji | ~1060 | 10 min |
| C4 | DNF + wynik | ~1808 | 1 min |
| C5 | Tempo actual vs planned | ~1077 | 3 min |
| C6 | Walidacja daty sesji | ~466 | 2 min |
| C7 | "+N więcej" klikalne | ~936 | 3 min |
| C8 | Day detail — completion style | ~963 | 10 min |

---

## Pliki do zmiany

- `app/coach/athletes/[id]/_components/AthleteProfileClient.tsx` — wszystkie zmiany
- Brak zmian w bazie danych
- Brak zmian w server actions (status zawodnika jest już obsługiwany przez `updateAthlete`)
