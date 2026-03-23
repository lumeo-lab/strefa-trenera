# Plan naprawczy Feedback — wersja ostateczna

## Cel

Przekształcić zakładkę Feedback z dobrej bazy v1 w idealne centrum operacyjne trenera — wiarygodne, szybkie, skanowalne, domykające pętlę trener-zawodnik bez opuszczania ekranu.

Po wdrożeniu wszystkich etapów ta zakładka nie wymaga dalszej pracy — jest kompletna.

---

## Zasady przewodnie

1. **Wiarygodność ponad wygląd** — najpierw naprawić dane, statusy i logikę, potem wizualnie polerować.
2. **Pola strukturalne ponad parser** — UI czyta `feeling`, `rpe`, `pain_flag`, `notes_structured`, `voice_transcript` z bazy. Parser `parseFeedbackTranscript` to fallback dla starych rekordów.
3. **Priorytet musi być wyjaśnialny** — trener widzi DLACZEGO coś jest pilne, nie tylko ŻE jest pilne.
4. **Reply = główna akcja** — pole odpowiedzi sticky na dole, zawsze widoczne, nie schowane w scrollu.
5. **Sidebar czytelny** — max 3 linie na item, ale z oddechem pionowym (padding). Skanowanie = szybkie rozróżnianie, nie gęste upychanie.
6. **Bez overengineeringu** — żadnych workflow DB, żadnych nowych migracji w fazie 1-3. Wszystko wyliczane client/server-side.
7. **Prowadzenie wzroku** — layout wymusza kolejność: preset "Pilne" → pierwsze itemy → summary bar → feedback → reply. Każdy element na ekranie ma jasną rangę wizualną.
8. **Proporcje 35/65** — sidebar to narzędzie selekcji (kompaktowe), detail to przestrzeń robocza (przestronna). Tekst w detailu z kontrolowaną szerokością (`max-w-3xl`).

---

## Etap 1: Wiarygodność danych i inboxu

**Cel:** Trener ufa temu co widzi. Liczniki są prawdziwe, dane spójne, błędy widoczne.

### 1.1 Usunięcie auto-mark-read

**Problem:** `useEffect` w `FeedbackClient.tsx:193-199` automatycznie oznacza feedback jako przeczytany po 800ms od kliknięcia na liście. Trener traci kontrolę — jedno kliknięcie "domyka" sprawę.

**Zmiana:**
- Usunąć timeout auto-mark-read
- `read` zmienia się TYLKO przez:
  - ręczne kliknięcie "Przeczytane" w detail header
  - wysłanie odpowiedzi (reply automatycznie markuje jako read — to OK)
  - bulk mark-read z sidebara

**Pliki:** `FeedbackClient.tsx` — usunąć useEffect linii 193-199.

### 1.2 Przejście na pola strukturalne

**Problem:** Detail panel czyta dane z `parseFeedbackTranscript(fb.transcript)` (parser text pipe-delimited). Tymczasem baza MA pola strukturalne: `feeling`, `rpe`, `pain_flag`, `pain_note`, `notes_structured`, `voice_transcript`, `actual_distance`, `actual_duration`. Parser powinien być fallbackiem, nie źródłem.

**Zmiana:**
- Detail panel: czytać z `fb.feeling`, `fb.rpe`, `fb.pain_flag`, `fb.pain_note`, `fb.notes_structured`, `fb.voice_transcript`
- Fallback na parser TYLKO jeśli pola strukturalne puste (stare rekordy)
- Sidebar item: analogicznie — label budować z pól strukturalnych
- Dodać helper `getFeedbackDisplayData(fb)` w nowym pliku `lib/feedback-helpers.ts` — jedno miejsce do budowania prezentacji

**Pliki:** `FeedbackDetailPanel.tsx`, `FeedbackSidebarItem.tsx`, nowy `lib/feedback-helpers.ts`

### 1.3 Naprawa jednostek dystansu

**Problem:** `training_sessions.actual_distance` jest w metrach (NUMERIC w Postgresie, zapisywane jako km float z formularza — `parseFloat(distanceKm)` w `feedback.ts:72`). Ale w `FeedbackDetailPanel.tsx:89` jest `session.actual_distance / 1000` co sugeruje, że jest w metrach. Strava distance JEST w metrach. Niespójność.

**Zmiana:**
- Zweryfikować co jest w DB (dodać komentarz do migracji)
- `training_sessions.actual_distance` — przechowywane w KM (z formularza `distance_km`)
- `strava_activities.distance` — przechowywane w metrach (z API Strava)
- Usunąć `/1000` z session actuals w detail panel (linia 89)
- Strava distance: `/1000` jest poprawne (linia 82)
- Dodać test jednostkowy potwierdzający formatowanie

**Pliki:** `FeedbackDetailPanel.tsx`, nowy test w `lib/feedback-helpers.test.ts`

### 1.4 Obsługa stanów błędu

**Problem:** Jeśli Supabase query zwróci błąd, `page.tsx` po cichu zwraca `feedbacks={[]}`. Trener widzi "Brak feedbacków" zamiast "Błąd ładowania".

**Zmiana:**
- `page.tsx`: wyłapać error z query, przekazać do klienta jako prop `error`
- `FeedbackClient`: nowy prop `error?: string`, wyświetlić `ErrorScreen` z retry button
- Rozróżnić 3 empty states:
  1. Brak aktywnych zawodników → "Dodaj zawodnika, aby zobaczyć feedbacki"
  2. Brak feedbacków (po filtrach) → "Brak wyników. Zmień filtry."
  3. Błąd ładowania → "Nie udało się załadować. Spróbuj ponownie."

**Pliki:** `page.tsx`, `FeedbackClient.tsx`, `FeedbackSidebar.tsx`

### 1.5 Paginacja (load more)

**Problem:** Hardcoded `limit(200)`. Trener z 15+ zawodnikami po 3 miesiącach przekroczy ten limit.

**Zmiana:**
- `page.tsx`: Pobierać 50 na start + count total
- Przekazać `totalCount` do klienta
- Sidebar: przycisk "Załaduj więcej" na dole listy
- Load more via Server Action `loadMoreFeedbacks(offset, filters)`
- Wyświetlić "Pokazano X z Y"

**Pliki:** `page.tsx`, `FeedbackClient.tsx`, `FeedbackSidebar.tsx`, nowa action `loadMoreFeedbacks` w `lib/actions/feedback.ts`

### 1.6 Deduplikacja watch_data vs Strava

**Problem:** Detail panel może pokazywać 2 bloki z tymi samymi metrykami — "Dane z urządzenia" (watch_data) i "Dane ze Strava". Mylące.

**Zmiana:**
- Jeśli jest Strava data → pokazuj tylko Strava block (jest pełniejszy)
- watch_data block pokazuj TYLKO gdy nie ma Strava (i watch_data istnieje)
- watch_link pokazuj zawsze (osobno, jako mały link, nie osobna sekcja)

**Pliki:** `FeedbackDetailPanel.tsx`

### Kryterium zakończenia etapu 1

- [ ] Kliknięcie feedbacku na liście NIE zmienia go na "przeczytany"
- [ ] Detail czyta z pól strukturalnych, parser jest fallbackiem
- [ ] Dystans z sesji wyświetla poprawną wartość
- [ ] Błąd ładowania → czytelny komunikat z retry
- [ ] Trener widzi więcej niż 50 feedbacków (load more)
- [ ] Brak podwójnych bloków z tymi samymi metrykami
- [ ] Testy dla helperów prezentacji i formatowania

---

## Etap 2: System priorytetów i skanowalność

**Cel:** Trener w 3 sekundy wie od czego zacząć. Pilne sprawy krzyczą, reszta jest cicho.

### 2.1 Logika priorytetu — `lib/feedback-priority.ts`

Nowy moduł z czystymi funkcjami:

```typescript
type PriorityLevel = 'critical' | 'high' | 'medium' | 'low'

type PriorityResult = {
  score: number
  level: PriorityLevel
  reasons: string[]   // np. ["Ból zgłoszony", "RPE 9/10", "Brak odpowiedzi"]
}

function getFeedbackPriority(fb: FeedbackWithJoins, context?: {
  recentRedCount?: number  // ile czerwonych od tego zawodnika w 7 dni
}): PriorityResult
```

**Scoring:**

| Czynnik | Punkty |
|---|---|
| `signal = 'red'` | +50 |
| `signal = 'yellow'` | +25 |
| `pain_flag = true` | +35 |
| `rpe >= 9` | +25 |
| `rpe = 8` | +15 |
| Brak odpowiedzi (`!coach_reply`) | +20 |
| Nieprzeczytane (`!read`) | +15 |
| Feedback z ostatnich 24h | +10 |
| Powtarzający się czerwony sygnał (context) | +20 |

**Mapowanie na level:**
- `>= 80` → `critical` (czerwony badge "Pilne")
- `>= 50` → `high` (pomarańczowy badge "Wysokie")
- `>= 25` → `medium` (żółty badge "Średnie")
- `< 25` → `low` (brak badge)

**Reasons** — czytelne po polsku, wyświetlane w sidebar item i w detail:
- "Ból zgłoszony", "RPE 9/10", "Czerwony sygnał", "Brak odpowiedzi", "Nowy", "Powtarzający się problem"

**Pliki:** Nowy `lib/feedback-priority.ts`, test `lib/feedback-priority.test.ts`

### 2.2 Redesign sidebar item — kompaktowy z priorytetem

**Obecny item:** 4 linie (imię+czas, label+badge, sesja, preview). Za dużo.

**Nowy item (max 3 linie):**

```
Linia 1: [🔴] Jan Kowalski                    3h temu  [Pilne]
Linia 2: Interwały 5x1000 · Ból zgłoszony, RPE 9/10
Linia 3: "Bolała mnie łydka po trzecim..."            [Nowy]
```

Zmiany:
- Sygnał jako kolorowy pasek po lewej stronie (nie emoji overlay na awatar)
- Awatar usunąć — zajmuje miejsce a inicjały nie niosą info (imię jest obok)
- Badge priorytetu po prawej stronie linii 1
- Linia 2: tytuł sesji + powody uwagi (z `reasons`) w jednej linii, `text-muted`
- Linia 3: preview notatki/głosu (skrócony) + badge Nowy/Bez odpowiedzi
- Nieprzeczytane: `font-bold` na imieniu (jak teraz)
- Z odpowiedzią: delikatne wyciszenie (opacity lub muted background)
- Padding: `py-3.5 px-4` — nie upychać gęsto, dać oddech między itemami dla szybkiego skanowania wzrokiem
- Hover: delikatna zmiana tła, cursor pointer
- Kontrast między itemami pilnymi (mocniejsze tło/pasek) a informacyjnymi (neutralne) musi być widoczny z odległości

**Pliki:** `FeedbackSidebarItem.tsx`

### 2.3 Grupowanie listy po priorytetach

W trybie sortowania "Priorytet" (domyślnym) lista jest podzielona nagłówkami sekcji:

```
── Pilne (3) ──────────────────────
  [item]
  [item]
  [item]
── Do sprawdzenia (5) ─────────────
  [item]
  ...
── Informacyjne (12) ──────────────
  [item]
  ...
```

W trybie "Chronologicznie" grupowanie po dniach:

```
── Dziś ───────────────────────────
  [item]
── Wczoraj ────────────────────────
  [item]
── 20 marca ───────────────────────
  [item]
```

**Pliki:** `FeedbackSidebar.tsx`, helper w `lib/feedback-helpers.ts`

### 2.4 Rozbudowa filtrów

**Obecne filtry:** 3 selecty (status, zawodnik, sortowanie).

**Nowe filtry — rząd 1: szybkie presety (chipy zamiast selecta):**

```
[Wszystkie (47)] [Pilne (3)] [Nieprzeczytane (8)] [Bez odpowiedzi (12)] [Dziś (5)]
```

Chipy z liczbą. Kliknięcie = toggle. Aktywny chip ma filled background.

**Rząd 2: filtry dodatkowe (selecty):**

```
[Zawodnik ▾]  [Sygnał ▾]  [Okres ▾]
```

Okres: Wszystko / Dziś / 7 dni / 30 dni
Sygnał: Wszystkie / Czerwone / Żółte / Zielone

**Sortowanie:** Przeniesione do dropdown w headerze sidebara (mała ikona), nie jako osobny select. Opcje: Priorytet / Najnowsze / Najstarsze.

**Pliki:** `FeedbackSidebar.tsx`, `FeedbackClient.tsx` (nowe typy filtrów)

### 2.5 Domyślne sortowanie po priorytecie

**Obecne:** `chronological` jako domyślne.

**Zmiana:** `priority` jako domyślne sortowanie. Trener otwiera feedback → od razu widzi najważniejsze sprawy na górze.

Migracja preferencji: jeśli localStorage ma `chronological`, zostawić (user choice). Nowi użytkownicy dostają `priority`.

**Pliki:** `FeedbackClient.tsx`

### Kryterium zakończenia etapu 2

- [ ] Każdy feedback ma wyliczony priorytet z wyjaśnieniem
- [ ] Sidebar items są 3-liniowe, kompaktowe
- [ ] Lista jest grupowana (priorytet lub dni)
- [ ] Filtry to szybkie chipy + dodatkowe selecty
- [ ] Domyślnie sortowane po priorytecie
- [ ] Testy scoringu z edge case'ami

---

## Etap 3: Detail panel — czytelność i ergonomia

**Cel:** Trener wchodzi w feedback, w 2 sekundy rozumie sytuację, ma pole odpowiedzi pod ręką.

### 3.1 Wzmocniony header

**Obecny:** Awatar + imię + badge + meta w jednej linii. Płaski.

**Nowy header (2 wiersze):**

```
Wiersz 1: [Awatar] Jan Kowalski    [Pilne]  [✓ Odpowiedziano]     [Profil] [Czat] [Plan]
Wiersz 2: 🏃 Interwały 5x1000 · 18 mar 2026 · 3h temu · 📝 Tekst + głos    [ℹ️]
```

Zmiany:
- Imię jest linkiem do `/coach/athletes/[id]` (otwiera w nowej zakładce lub nawiguje)
- Badge priorytetu z kolorem (jak na liście)
- Akcje kontekstowe po prawej: ikony-buttony `Profil`, `Czat`, `Plan` (link do profilu/czatu/planu tego zawodnika)
- Legenda sygnałów (ℹ️) zostaje

**Pliki:** `FeedbackDetailPanel.tsx`

### 3.2 Summary bar

Nowy element tuż pod headerem — pasek z chipami podsumowującymi kluczowe sygnały:

```
[🔴 Czerwony sygnał] [🩹 Ból: łydka] [💪 RPE 9/10] [📏 12.3 km] [🔗 Strava]
```

Zasady:
- Pokazywane TYLKO chipy, które niosą wartość (nie pokazuj "Zielony sygnał" ani "RPE 3/10")
- Czerwone/żółte sygnały: chip z odpowiednim kolorem
- Ból: chip czerwony z treścią pain_note
- RPE >= 7: chip z wartością
- Dystans: jeśli jest
- Strava: jeśli ma linked activity

Helper: `getFeedbackSummaryChips(fb): { label: string; color: string; icon: string }[]`

**Pliki:** `FeedbackDetailPanel.tsx`, `lib/feedback-helpers.ts`

### 3.3 Reorganizacja sekcji treści

**Obecna kolejność:** Feedback zawodnika → Głos → Watch data → Strava/Session actuals → Reply

**Nowa kolejność (informacyjna hierarchia):**

1. **Summary bar** (nowy, patrz 3.2)
2. **Feedback zawodnika** — samopoczucie, RPE, ból, notatka (z pól strukturalnych)
3. **Komentarz głosowy** — jeśli istnieje
4. **Dane treningowe** — Strava ALBO session actuals ALBO watch data (jeden block, nie 2-3)
5. **Odpowiedź trenera** — sticky na dole (patrz 3.4)

Zmiany w sekcji "Dane treningowe":
- Jedna sekcja z etykietą źródła: "Dane ze Strava", "Dane z sesji", "Dane z urządzenia"
- Hierarchia: Strava > session actuals > watch_data
- Jeśli jest Strava: pokaż Strava + link do aktywności
- Jeśli brak Strava ale są session actuals: pokaż te
- Jeśli brak obu ale jest watch_data: pokaż watch_data
- Nigdy nie pokazuj 2+ bloków z metrykami

**Pliki:** `FeedbackDetailPanel.tsx`

### 3.4 Sticky reply composer

**Problem:** Reply jest w scrollowalnym contencie na samym dole. Trener musi scrollować.

**Zmiana:** Reply box to osobny `div` poza scrollem, sticky na dole detail panelu.

Struktura:
```
<div className="flex-1 flex flex-col">
  {/* Header */}
  <div className="shrink-0">...</div>

  {/* Scrollable content — z kontrolowaną szerokością tekstu */}
  <div className="flex-1 overflow-y-auto px-6 py-6">
    <div className="max-w-3xl mx-auto space-y-5">
      {/* summary, feedback, voice, actuals */}
    </div>
  </div>

  {/* Sticky reply — POZA scrollem */}
  <div className="shrink-0 border-t px-6 py-4">
    <div className="max-w-3xl mx-auto">
      {/* existing reply display + reply form */}
    </div>
  </div>
</div>
```

`max-w-3xl` (768px) zapewnia komfortową szerokość czytania tekstu. Na szerokich monitorach treść nie rozlewa się na 900+ px, co poprawia czytelność. Metryki w chipach mogą się układać w naturalnym flow wrap.

Reply box:
- Jeśli jest odpowiedź: wyświetl ją w 1-2 liniach + "Edytuj"
- Jeśli brak: textarea z placeholder "Napisz odpowiedź..." + przycisk "Wyślij"
- Textarea auto-resize (min 1 linia, max 4)
- Szablony: dropdown/chipy nad textarea z 4-6 gotowymi odpowiedziami

**Szablony odpowiedzi:**

```
[Dobra robota!] [Zwolnij tempo] [Zgłoś się na wizytę] [Odpoczywaj] [Doprecyzuj] [Porozmawiajmy]
```

Kliknięcie szablonu wstawia tekst do textarea (trener może edytować przed wysłaniem):
- "Dobra robota!" → "Świetna robota! Tak trzymaj 💪"
- "Zwolnij tempo" → "Widzę, że dawka była duża. Następnym razem zwolnij tempo i skup się na regeneracji."
- "Zgłoś się na wizytę" → "Ból wymaga uwagi. Umów się na wizytę u fizjoterapeuty i daj znać jak będzie."
- "Odpoczywaj" → "Organizm daje sygnały. Dziś i jutro lekko — regeneracja jest częścią treningu."
- "Doprecyzuj" → "Dzięki za feedback. Możesz doprecyzować co dokładnie czułeś podczas treningu?"
- "Porozmawiajmy" → "Muszę lepiej zrozumieć sytuację. Odezwę się na czacie."

**Pliki:** `FeedbackDetailPanel.tsx`, `FeedbackClient.tsx`

### 3.5 Poprawa typografii i hierarchii wizualnej

- Sekcje z jaśniejszym rozróżnieniem: header sekcji z ikoną, grubszym border-top
- Feedback zawodnika: większy font na samopoczuciu i RPE (to kluczowe dane)
- Ból: czerwone tło chipu, nie tylko czerwony tekst
- MetricChip: ujednolicony rozmiar i spacing
- "Brak dodatkowych danych w tym feedbacku" — lepszy empty state: ikona + sugestia

**Pliki:** `FeedbackDetailPanel.tsx`

### Kryterium zakończenia etapu 3

- [ ] Header z linkami do profilu/czatu/planu zawodnika
- [ ] Summary bar pokazuje kluczowe sygnały w chipach
- [ ] Jedna sekcja danych treningowych (nie 2-3)
- [ ] Reply composer sticky na dole, zawsze widoczny
- [ ] 6 szablonów odpowiedzi
- [ ] Lepsza typografia i hierarchia kolorów

---

## Etap 4: Nawigacja, skróty, synchronizacja URL

**Cel:** Trener pracuje szybko — klawiatura, deep linki, płynne przejścia.

### 4.1 Keyboard navigation

- `↑` / `↓` — przejście między feedbackami na liście
- `Enter` — focus na reply textarea
- `Escape` — anuluj reply
- `Ctrl+Enter` — wyślij odpowiedź
- `n` — następny nieprzeczytany
- `r` — toggle reply
- `m` — mark as read

Implementacja: `useEffect` z `keydown` listener w `FeedbackClient.tsx`. Aktywne tylko gdy focus nie jest w textarea/input.

**Pliki:** `FeedbackClient.tsx`

### 4.2 Przycisk "Następny nieprzeczytany"

W header detail panelu: przycisk/ikona "→" przeskakujący do następnego nieprzeczytanego feedbacku. Po odpowiedzi na feedback: auto-przejście do następnego (opcjonalne, sprawdzić czy nie irytuje).

**Pliki:** `FeedbackDetailPanel.tsx`, `FeedbackClient.tsx`

### 4.3 Pełna synchronizacja URL

Każdy stan filtrów, sortowania i zaznaczenia → URL params:

```
/coach/feedback?filter=needs_action&athlete=abc&signal=red&period=7d&sort=priority&selected=xyz
```

Korzystać z `updateSearchParams` z `lib/url-helpers.ts` (jak w Chat).

Korzyści:
- Deep link z dashboardu: "3 pilne feedbacki" → `/coach/feedback?filter=needs_action&sort=priority`
- Bookmark konkretnego widoku
- Refresh nie resetuje filtrów

**Pliki:** `FeedbackClient.tsx`

### 4.4 Topbar subtitle z kontekstem

**Obecny:** "X nieprzeczytanych"

**Nowy:** Kontekstowy:
- Domyślnie: "3 pilne · 8 nieprzeczytanych"
- Po filtrze: "Wyniki: 12 z 47 · 3 nieprzeczytane"
- Po wyszukiwaniu: "Szukaj: «ból» — 5 wyników"

**Pliki:** `FeedbackClient.tsx`

### Kryterium zakończenia etapu 4

- [ ] Nawigacja klawiaturą (↑↓, n, r, m, Ctrl+Enter)
- [ ] Przycisk "Następny nieprzeczytany"
- [ ] Filtry zsynchronizowane z URL
- [ ] Topbar subtitle kontekstowy
- [ ] Deep link z dashboardu działa

---

## Etap 5: Stabilizacja i testy

**Cel:** Zakładka jest odporna na regresje i przygotowana na skalę.

### 5.1 Testy jednostkowe

```
lib/feedback-priority.test.ts
  - scoring: red signal + pain → critical
  - scoring: green signal + read + replied → low
  - scoring: yellow + high RPE → high
  - reasons: zwraca poprawne etykiety po polsku
  - edge: brak danych → graceful default

lib/feedback-helpers.test.ts
  - getFeedbackDisplayData: pola strukturalne > parser
  - getFeedbackDisplayData: fallback na parser gdy pola puste
  - getFeedbackSummaryChips: poprawne chipy
  - formatowanie dystansu/czasu/tempa
  - deduplikacja źródeł danych (strava vs session vs watch)
```

### 5.2 Testy helperów prezentacji

```
  - formatDuration: 0, 30, 60, 90, 125
  - formatPace: edge cases (very slow, very fast, 0)
  - unit consistency: session km vs strava meters
```

### 5.3 Refaktor typów

- Wyeksportować `Filter`, `ViewMode`, `SortMode` z jednego pliku (`FeedbackClient.tsx` lub `types.ts`)
- Poprawić typ `avatar: string` → `string | null` w `FeedbackWithJoins`
- Usunąć duplikację typów między `FeedbackClient.tsx` i `FeedbackSidebar.tsx`

### 5.4 Performance

- Upewnić się, że `getFeedbackPriority` jest memoizowane (nie liczyć na każdy render)
- Sidebar list: `React.memo` na `FeedbackSidebarItem` (jeśli jeszcze nie ma)
- Load more: nie re-renderować całej listy przy doładowaniu

### 5.5 Usunięcie martwego kodu

- Sprawdzić czy `FeedbackCard.tsx` z `components/coach/` jest jeszcze używany poza feedbackiem (tak — w HistoryTab, PlanTab). Zostawić, ale upewnić się że korzysta z tych samych helperów.
- Usunąć nieużywane importy po refaktorze

### Kryterium zakończenia etapu 5

- [ ] Testy przechodzą dla scoringu, helperów, formatowania
- [ ] Typy wyeksportowane z jednego miejsca
- [ ] Brak duplikacji typów
- [ ] Performance OK przy 200+ feedbackach
- [ ] Brak martwego kodu

---

## Podsumowanie pliku-po-pliku

| Plik | Etap | Zakres zmian |
|---|---|---|
| `page.tsx` | 1 | Error handling, paginacja (count + limit 50), przekazanie error prop |
| `FeedbackClient.tsx` | 1-4 | Usunięcie auto-mark-read, nowe typy filtrów, priorytet, URL sync, keyboard nav, load more state |
| `FeedbackSidebar.tsx` | 2-3 | Chipy filtrów, grupowanie listy, nowy layout filtrów |
| `FeedbackSidebarItem.tsx` | 2 | 3-liniowy kompaktowy item, badge priorytetu, kolorowy pasek, powody uwagi |
| `FeedbackDetailPanel.tsx` | 1, 3 | Pola strukturalne, deduplikacja danych, summary bar, sticky reply, szablony, header z linkami, reorganizacja sekcji |
| `lib/feedback-priority.ts` | 2 | NOWY — scoring, levels, reasons |
| `lib/feedback-helpers.ts` | 1-3 | NOWY — display data, summary chips, formatowanie |
| `lib/feedback-priority.test.ts` | 2, 5 | NOWY — testy scoringu |
| `lib/feedback-helpers.test.ts` | 1, 5 | NOWY — testy helperów |
| `lib/actions/feedback.ts` | 1 | Nowa action `loadMoreFeedbacks` |

---

## Czego NIE robimy (świadome decyzje)

1. **Brak migracji DB** — żadnego `coach_workflow_status`, `priority_score` w bazie. Wszystko wyliczane. Prostsze, szybsze, zero ryzyka migracji.
2. **Brak trzeciej kolumny** — mini-profil zawodnika po prawej to overengineering. Link do profilu w headerze wystarczy.
3. **Brak resizable sidebar** — fixed 360px. Prostota.
4. **Brak AI summary** — pola `ai_summary`, `ai_analysis` są w DB ale puste. Nie dodajemy AI na tym etapie.
5. **Brak real-time updates** — odświeżanie przy powrocie na stronę wystarczy. WebSocket/polling to osobny temat.
6. **Brak eksportu feedbacków** — nikt o to nie prosił, nie dodajemy.
7. **Brak tagów/etykiet trenera** — overengineering. Priorytet wyliczany automatycznie wystarczy.
8. **Brak drag-and-drop** — nie ma sensu w tym kontekście.
9. **Brak filtra "tylko głosowe" / "tylko z linkiem" / "tylko ze Strava"** — zbyt niszowe. Zostajemy przy: status, zawodnik, sygnał, okres.

---

## Kolejność wdrożenia

```
Etap 1 (wiarygodność)     ██████████░░░░░░░░░░  ~40% pracy
Etap 2 (priorytety)       ████████░░░░░░░░░░░░  ~25% pracy
Etap 3 (detail redesign)  ██████░░░░░░░░░░░░░░  ~20% pracy
Etap 4 (nawigacja)        ███░░░░░░░░░░░░░░░░░  ~10% pracy
Etap 5 (stabilizacja)     ██░░░░░░░░░░░░░░░░░░  ~5% pracy
```

Po etapie 5 zakładka Feedback jest kompletna.
