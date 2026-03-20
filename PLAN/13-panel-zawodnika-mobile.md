## Panel zawodnika mobile

### Cel sekcji

Ta sekcja dotyczy panelu zawodnika pod `/u/[slug]`, czyli mobilnego interfejsu zawodnika, a nie profilu zawodnika w panelu trenera.

Docelowo panel zawodnika ma być:

- maksymalnie prosty,
- szybki,
- intuicyjny,
- mobilny,
- konkretny,
- spójny z panelem trenera,
- oparty na jednej wspólnej przestrzeni danych tam, gdzie to potrzebne.

Zawodnik ma wejść do panelu i bez zastanowienia rozumieć:

- co mam zrobić dziś,
- jak wygląda mój plan,
- co już wykonałem,
- co odpisał trener,
- jakie mam zawody, kontuzje i rozliczenia.

To nie ma być „mały panel trenera".
To ma być osobny, lżejszy produkt, ale nie uboższy w sens.

---

### Docelowa architektura produktu

#### Główna nawigacja dolna (4 elementy)

- `Dziś`
- `Plan`
- `Wykonanie`
- `Czat`

To są 4 najczęściej używane obszary codzienne. Tylko one są w bottom nav.

#### Menu kontekstowe (avatar w headerze)

Wejście: avatar / inicjał zawodnika w prawym górnym rogu headera.
Kliknięcie prowadzi do ekranu `Profil` (`/u/[slug]/profile`).

Na ekranie `Profil` dostępne są:
- edycja danych osobistych,
- linki do: `Zawody`, `Kontuzje`, `Rozliczenia`,
- przełącznik `Wygląd` (jasny / ciemny),
- `Wyloguj się` (na dole, nienachalnie).

#### Twarde decyzje architektoniczne

- `Wyloguj` zostaje, ale głęboko w Profilu — nie w bottom nav, nie w menu głównym,
- `Historia` zmienia się na `Wykonanie`,
- nie robimy głównego toggle `Plan trenera / Strava`,
- `Wykonanie` budujemy wokół planu i wykonania,
- Strava działa jako źródło danych albo sekcja aktywności dodatkowych,
- `Zawody` są wspólną przestrzenią zawodnik–trener (osobna tabela `athlete_races` — bezpieczny concurrent write),
- `Kontuzje` są read-only po stronie zawodnika + możliwość zgłoszenia (JSONB `injury_history` na tabeli `athletes` — concurrent write ryzykowny),
- `Rozliczenia` są read-only po stronie zawodnika,
- `Profil` pozwala edytować podstawowe dane i avatar.

#### Uwaga techniczna: model danych Zawody vs Kontuzje

| | Zawody | Kontuzje |
|---|---|---|
| Model | Osobna tabela `athlete_races` | JSONB `injury_history` na tabeli `athletes` |
| Concurrent write | Bezpieczny — osobne rows | Ryzykowny — cały JSON nadpisywany |
| Athlete-side | Pełny CRUD | Read-only + zgłoszenie do trenera |

Jeśli w przyszłości potrzeba pełnego CRUD na kontuzjach po stronie zawodnika, wymagana migracja `injury_history` do osobnej tabeli `athlete_injuries`.

---

### Aktualna ocena

Panel ma bardzo dobrą bazę produktową:

- działa prywatny dostęp przez link i sesję,
- `Dziś` jest głównym ekranem dnia z bannerem stanu i akcjami,
- `Plan` ma widok tygodnia i miesiąca z badge `X/Y ukończonych`,
- `Wykonanie` ma bazę `plan vs wynik` i statystyki filtrowane po miesiącu,
- `Czat` ma optimistic send, retry, separatory dni, polling zależny od widoczności,
- bottom nav ma 5 elementów (Dziś, Plan, Historia, Czat, Więcej).

Największe aktualne braki:

- ekran `Dziś` wymaga domknięcia flow wykonania/pominięcia i prawdziwości danych,
- feedback flow wymaga uproszczenia,
- `Wykonanie` nie ma jeszcze finalnego modelu względem Stravy,
- bottom nav wymaga zmiany na docelowe 4 elementy + avatar w headerze,
- nie istnieje ekran `Profil`,
- nie istnieją athlete-side `Zawody`,
- nie istnieją athlete-side `Kontuzje`,
- nie istnieją athlete-side `Rozliczenia`.

---

### Definicja ukończenia

Sekcję `Panel zawodnika mobile` uznajemy za domkniętą, gdy:

- zawodnik po wejściu od razu wie, co ma zrobić dziś,
- feedback po treningu jest bardzo szybki i intuicyjny,
- plan pomaga orientować się w treningu bez chaosu,
- `Wykonanie` jasno pokazuje plan vs wykonanie,
- czat działa płynnie i naturalnie,
- nawigacja mobilna jest prosta — 4 elementy na dole, reszta przez Profil,
- istnieje ekran `Profil` z edycją danych,
- istnieje wspólna sekcja `Zawody` (full CRUD),
- istnieje sekcja `Kontuzje` (read + zgłoszenie),
- istnieje sekcja `Rozliczenia` (read-only),
- panel jest spójny z panelem trenera i tym samym modelem danych,
- panel realnie spełnia obietnicę `mobile-first` i `zero tarcia`.

---

### Zasady projektowe

1. Dolny pasek tylko dla najczęstszych działań (4 elementy, zero wyjątków).
2. Rzadsze sekcje dostępne przez Profil.
3. Każdy ekran ma jedną dominującą rolę.
4. Statusy sesji muszą być spójne wszędzie.
5. Źródło danych nie może rozbijać doświadczenia na dwa światy.
6. Wspólne dane muszą być naprawdę wspólne dla zawodnika i trenera.
7. Panel ma być gęsty, ale nie ciężki.
8. Zero zbędnych wielkich boxów.
9. Zawodnik nie może się zastanawiać, co kliknąć dalej.
10. Prawdziwość danych jest ważniejsza niż efekt wizualny.

---

### Etap 1: Fundamenty i prawdziwość danych ✅

Priorytet: **Krytyczny**
Ryzyko: **Niskie**
**Status: WDROŻONY**

#### Co zrobiono

1. **Fix fałszywego "wolnego dnia"**: nawigacja w `Dziś` ograniczona do ±7 dni od dziś (zakres załadowanych sesji). Przyciski ←/→ disabled na granicach. Nie można wyjść poza zakres danych.

2. **Usunięto wszystkie `completed` boolean** z athlete-facing kodu:
- `AthleteHistoryPage`: `s.completed` → `isSessionCompleted(s)` i `isSessionSkipped(s)`
- `AthleteTodayPage`: `ws?.completed` → `isSessionCompleted(ws)` (zrobione wcześniej)
- `AthletePlanPage`: `s.completed` → `isSessionCompleted(s)` (zrobione wcześniej)
- Weryfikacja grep: zero `\.completed` w `app/u/[slug]/_components/`

3. **Polskie etykiety statusów**: TodayPage już używa polskich ("Trening ukończony", "Trening pominięty", "Wykryto aktywność"), HistoryPage: "pominięty" + "✓". Brak angielskich etykiet w UI.

4. **Komunikat dostępu/linku**: poprawiony copy na `page.tsx`:
- "Sesja wygasła" → "Kliknij ponownie link od trenera"
- Usunięto sugestię "poproś o nowy link" (linki są stabilne i wielorazowe)

#### Pliki zmienione

- `app/u/[slug]/_components/AthleteTodayPage.tsx`
- `app/u/[slug]/_components/AthleteHistoryPage.tsx`
- `app/u/[slug]/page.tsx`

---

### Etap 2: Nawigacja + Profil ✅

Priorytet: **Bardzo wysoki**
Ryzyko: **Niskie**
**Status: WDROŻONY**

#### Cel

Ustawić docelową architekturę informacji i dać zawodnikowi ekran Profilu.

#### Zakres nawigacji

1. Bottom nav zmienić na 4 elementy:
- `Dziś`
- `Plan`
- `Wykonanie`
- `Czat`

2. Usunąć z bottom nav popup "Więcej" (aktualnie 5. element).

3. Dodać avatar / inicjał zawodnika w prawym górnym rogu headera na każdym ekranie.

4. Klik avatara → `/u/[slug]/profile`.

5. Zmienić etykietę `Historia` → `Wykonanie` w bottom nav i headerze.

#### Zakres Profilu

1. Stworzyć route `/u/[slug]/profile/page.tsx`.

2. Ekran Profil zawiera:
- avatar (edytowalny),
- dane osobiste: imię, nazwisko, email, telefon, miasto, wiek, wzrost, waga, cel,
- linki do: Zawody, Kontuzje, Rozliczenia,
- przełącznik wyglądu (jasny/ciemny),
- `Wyloguj się` na dole.

3. Stworzyć server action `updateAthleteProfile(slug, data)`:
- auth guard przez `getAthleteFromSession()`,
- walidacja Zod,
- update na tabeli `athletes` przez admin client.

4. Nie pokazywać coach-side pól:
- status zawodnika,
- pakiet administracyjny,
- wewnętrzne dane trenera.

#### Pliki

- `app/u/[slug]/_components/AthleteBottomNav.tsx`
- `app/u/[slug]/_components/AthleteHeader.tsx` (nowy — wspólny header z avatarem)
- `app/u/[slug]/profile/page.tsx` (nowy)
- `app/u/[slug]/_components/AthleteProfilePage.tsx` (nowy)
- `lib/actions/athlete-profile.ts` (nowy)

#### Kryteria ukończenia

- bottom nav ma dokładnie 4 elementy,
- avatar w headerze prowadzi do Profilu,
- zawodnik może edytować swoje dane,
- trener widzi te same dane w swoim panelu,
- Wyloguj dostępne w Profilu.

---

### Etap 3: Domknięcie flow `Dziś` ✅

Priorytet: **Krytyczny**
Ryzyko: **Niskie**
**Status: WDROŻONY**

#### Co już zrobiono

- Banner stanu dnia nad kartą treningu z hierarchią.
- Ikona sesji zmienia się wg statusu.
- Wynik treningu w oddzielnej sekcji "Wykonanie".
- Naprawiono `completed` → `isSessionCompleted`.
- Wolny dzień: cieplejszy copy + podgląd jutrzejszego treningu.

#### Co trzeba domknąć

1. Pełny flow `Nie zrobiłem`:
- wybór powodu (lista: brak czasu, zmęczenie, kontuzja, inne),
- opcjonalna notatka,
- zapis `skipped_reason` na sesji.

2. Pełne domknięcie flow `Wykonałem`:
- po oznaczeniu → automatyczne otwarcie feedbacku (już działa),
- jasny stan sukcesu (np. krótki inline toast zamiast tylko zmiany bannera),
- łatwa edycja feedbacku po zapisie.

3. Uporządkować wording wokół stanu dnia.

#### Pliki

- `app/u/[slug]/_components/AthleteTodayPage.tsx`

#### Kryteria ukończenia

- zawodnik bez myślenia zamyka trening,
- pominięcie daje kontekst trenerowi (powód),
- feedback jest szybki i naturalny.

---

### Etap 4: Feedback — uproszczenie flow i modal ✅

Priorytet: **Bardzo wysoki**
Ryzyko: **Średnie**
**Status: WDROŻONY**

#### Cel

Zrobić z feedbacku szybki, naturalny rytuał po treningu. Jeden etap łączy model produktu i implementację modala.

#### Model produktu

- Tekst = feedback główny (strukturalny).
- Komentarz mówiony = opcjonalne rozszerzenie.
- Nie dwa równorzędne światy.

#### Feedback w dwóch poziomach

Szybki (domyślny widok modala):
- samopoczucie (emoji),
- RPE (1-10),
- krótka notatka.

Rozszerzony (rozwijany pod "Więcej szczegółów"):
- ból/problem,
- dystans/czas,
- link z zegarka,
- komentarz mówiony.

#### Implementacja modala

1. Skrócić pierwszy widok — tylko 3 najważniejsze pola.
2. Reszta schowana pod "Więcej szczegółów".
3. Stany zapisu: zapisuję → zapisano (inline success) → błąd (inline, nie alert).
4. Jasna możliwość edycji po zapisie.
5. Poprawić copy wokół mowy/głosu.

#### Pliki

- `app/u/[slug]/_components/FeedbackModal.tsx`
- `app/u/[slug]/_components/AthleteTodayPage.tsx`

#### Kryteria ukończenia

- feedback zajmuje 10 sekund na szybki wpis,
- modal nie przytłacza,
- zawodnik rozumie feedback bez tłumaczenia,
- działa naturalnie na telefonie.

---

### Etap 5: Plan jako ekran orientacji ✅

Priorytet: **Wysoki**
Ryzyko: **Niskie**
**Status: WDROŻONY**

#### Co już zrobiono

- Badge `X/Y ukończonych` w widoku tygodniowym.
- Naprawiono statusy (`isSessionCompleted` / `isSessionSkipped`).

#### Co trzeba domknąć

1. Widok tygodnia ma pokazywać:
- dni, sesje, podstawowe parametry,
- czytelny status wykonania,
- feedback marker (zielony/żółty/czerwony),
- odpowiedź trenera marker,
- wyróżnienie kluczowych sesji (`session_priority`).

2. Widok miesiąca: bardziej orientacyjny niż tabelaryczny.

3. Kliknięcie dnia → przejście do `Dziś` z parametrem `?d=YYYY-MM-DD`.

4. `Plan` nie miesza się z historią i Stravą.

#### Pliki

- `app/u/[slug]/_components/AthletePlanPage.tsx`

#### Kryteria ukończenia

- zawodnik ogarnia tydzień jednym rzutem oka,
- kliknięcie dnia prowadzi do działania.

---

### Etap 6: `Wykonanie` zamiast `Historia`

Priorytet: **Bardzo wysoki**
Ryzyko: **Średnie**
**Status: CZĘŚCIOWO WDROŻONY**

#### Co już zrobiono

- Statystyki filtrowane po miesiącu (bug fix).
- `Plan vs Wynik` w kartach sesji.
- Realizacja procentowa.

#### Kluczowa decyzja

Nie robimy głównego toggle `Plan trenera / Strava`.

#### Docelowy model

Główna oś = sesja planu:
- data, nazwa, plan, wynik, status, źródło, feedback, odpowiedź trenera.

Osobna sekcja na dole:
- `Aktywności dodatkowe spoza planu` (Strava activities bez powiązanej sesji).

#### Co trzeba domknąć

1. Zmienić nazwę na `Wykonanie` (header + nav).

2. Podsumowanie okresu:
- sesji (ukończone/zaplanowane),
- realizacja %,
- pominięte,
- aktywności dodatkowe.

3. Rozbudować karty sesji:
- status z ikonką,
- źródło danych (athlete/strava/coach),
- feedback snippet,
- odpowiedź trenera snippet.

4. Strava: nie jako osobna zakładka, tylko jako źródło lub aktywność dodatkowa.

#### Pliki

- `app/u/[slug]/_components/AthleteHistoryPage.tsx`
- `app/u/[slug]/history/page.tsx`

#### Kryteria ukończenia

- zawodnik widzi przeszłość przez pryzmat planu i wykonania,
- nie ma dwóch równoległych światów,
- `Wykonanie` ma jasny sens produktowy.

---

### Etap 7: Czat — dopracowanie

Priorytet: **Wysoki**
Ryzyko: **Niskie**
**Status: WDROŻONY (drobne poprawki)**

#### Co już działa

- Optimistic send z retry.
- Separatory dni.
- Auto-mark read po 1.2s.
- Polling zależny od widoczności taba.

#### Drobne poprawki do zrobienia

1. Mobile feel: spacing, keyboard behavior, scroll po wysłaniu.
2. Nie dokładać zbędnych funkcji.

#### Kryteria ukończenia

- czat działa bez frustracji,
- jest szybki i naturalny.

---

### Etap 8: `Zawody` jako wspólna przestrzeń

Priorytet: **Bardzo wysoki**
Ryzyko: **Niskie**
**Status: DO ZROBIENIA**

#### Cel

Stworzyć jedną wspólną sekcję zawodów dla zawodnika i trenera.

#### Kontekst techniczny

Tabela `athlete_races` już istnieje z pełną strukturą (id, athlete_id, coach_id, name, date, distance, goal_time, result, status, notes). Coach-side CRUD już działa w `lib/actions/races.ts`. Bezpieczny concurrent write — osobne rows.

#### Zakres

1. Stworzyć route `/u/[slug]/races/page.tsx`.

2. Athlete-side widok:
- lista: Nadchodzące / Zakończone,
- dodawanie (modal),
- edycja (modal),
- usuwanie (z potwierdzeniem).

3. Stworzyć athlete-side server actions:
- `createAthleteRace(slug, data)`,
- `updateAthleteRace(slug, raceId, data)`,
- `deleteAthleteRace(slug, raceId)`,
- auth guard przez `getAthleteFromSession()`.

4. Rekord: nazwa, data, dystans, cel czasowy, wynik, status, notatki.

5. Wejście przez ekran Profil.

#### Pliki

- `app/u/[slug]/races/page.tsx` (nowy)
- `app/u/[slug]/_components/AthleteRacesPage.tsx` (nowy)
- `lib/actions/athlete-races.ts` (nowy)

#### Kryteria ukończenia

- zawodnik i trener widzą te same zawody,
- obie strony mogą zarządzać,
- nie ma równoległych kopii danych.

---

### Etap 9: `Kontuzje` — read-only + zgłoszenie

Priorytet: **Wysoki**
Ryzyko: **Niskie**
**Status: DO ZROBIENIA**

#### Cel

Dać zawodnikowi wgląd w kontuzje i możliwość zgłoszenia problemu.

#### Kontekst techniczny

`injury_history` to JSONB pole na tabeli `athletes`, nie osobna tabela. Concurrent write (trener i zawodnik edytują jednocześnie) grozi nadpisaniem danych. Dlatego athlete-side jest read-only z możliwością zgłoszenia.

#### Zakres

1. Stworzyć route `/u/[slug]/injuries/page.tsx`.

2. Athlete-side widok:
- lista aktywnych kontuzji (bez `ended_at`),
- historia zakończonych,
- przycisk "Zgłoś problem" → krótki formularz (nazwa/obszar, opis) → wysyła wiadomość do trenera przez czat lub tworzy notatkę.

3. Zawodnik NIE edytuje kontuzji bezpośrednio — to robi trener.

4. Wejście przez ekran Profil.

#### Możliwość rozszerzenia w przyszłości

Jeśli potrzeba pełnego athlete-side CRUD, wymagana migracja:
- nowa tabela `athlete_injuries` (id, athlete_id, name, started_at, ended_at, description, impact),
- migracja danych z JSONB,
- aktualizacja coach-side kodu.

#### Pliki

- `app/u/[slug]/injuries/page.tsx` (nowy)
- `app/u/[slug]/_components/AthleteInjuriesPage.tsx` (nowy)
- `lib/athlete-data.ts` (dodać read helper)

#### Kryteria ukończenia

- zawodnik widzi swoje kontuzje,
- może zgłosić nowy problem,
- trener jest jedynym edytorem.

---

### Etap 10: `Rozliczenia` — read-only

Priorytet: **Wysoki**
Ryzyko: **Niskie**
**Status: DO ZROBIENIA**

#### Cel

Dać zawodnikowi przejrzysty wgląd w rozliczenia bez prawa edycji.

#### Kontekst techniczny

Tabela `invoices` istnieje z pełną strukturą. Coach-side CRUD działa w `lib/actions/invoices.ts`. Athlete-side wymaga tylko read via admin client z auth guard.

#### Zakres

1. Stworzyć route `/u/[slug]/billing/page.tsx`.

2. Athlete-side widok:
- lista rozliczeń (najnowsze na górze),
- każdy rekord: numer, opis, data, termin płatności, kwota, status, załącznik.

3. Zawodnik NIE może: edytować, usuwać, zmieniać statusu.

4. Jeśli jest załącznik (PDF/obraz) — link do pobrania.

5. Wejście przez ekran Profil.

#### Pliki

- `app/u/[slug]/billing/page.tsx` (nowy)
- `app/u/[slug]/_components/AthleteBillingPage.tsx` (nowy)
- `lib/athlete-data.ts` (dodać `getAthleteInvoices`)

#### Kryteria ukończenia

- zawodnik widzi wszystkie swoje rozliczenia,
- nie może nic zmieniać,
- dane zgodne z panelem trenera.

---

### Etap 11: Stany błędu, puste stany, dostęp

Priorytet: **Średni**
Ryzyko: **Niskie**
**Status: DO ZROBIENIA**

#### Zakres

1. Dopracować ekran bez dostępu / wygasłego linku.

2. Dopracować błędy: feedback, chat, strava, load session.

3. Dopracować puste stany:
- brak treningu na dziś,
- brak wykonania w miesiącu,
- brak rozliczeń,
- brak zawodów,
- brak kontuzji.

4. Puste stany nie mogą wyglądać jak awarie.

5. Dopracować `app/u/[slug]/error.tsx` — bardziej produktowy, mniej techniczny.

#### Pliki

- `app/u/[slug]/page.tsx`
- `app/u/[slug]/error.tsx`
- `app/u/[slug]/_components/FeedbackModal.tsx`
- `app/u/[slug]/_components/AthleteChatPage.tsx`
- nowe ekrany z Etapów 8-10

#### Kryteria ukończenia

- użytkownik zawsze wie, co się stało i co robić dalej,
- stany puste są czytelne i nie wyglądają jak błędy.

---

### Etap 12: Spójność danych, dat i architektury

Priorytet: **Średni**
Ryzyko: **Średnie**
**Status: DO ZROBIENIA**

#### Zakres

1. Wydzielić wspólne helpery:
- daty (konsekwentnie helpery z `lib/date.ts`, ograniczyć lokalne `new Date(...)`),
- statusy sesji,
- day state,
- feedback state,
- source labels,
- athlete profile helpers.

2. Ograniczyć ciężar komponentów:
- `AthleteTodayPage`
- `AthletePlanPage`
- `AthleteHistoryPage`
- `AthleteChatPage`
- `FeedbackModal`

3. Dodać testy helperów dla kluczowych przepływów.

#### Kryteria ukończenia

- mniejszy chaos w komponentach,
- niższe ryzyko regresji,
- spójność dat i stanów.

---

### Etap 13: Final polish UX/UI

Priorytet: **Średni**
Ryzyko: **Niskie**
**Status: DO ZROBIENIA**

#### Zakres

1. Hierarchia wizualna: Dziś, feedback, odpowiedź trenera, stany ukończenia, menu, profil, listy.

2. Mikrocopy: Wykonanie, feedback, komentarz mówiony, stany sesji, stany dostępu.

3. Motion i feel: przejścia, otwieranie menu, zapisywanie, zmiany statusu.

4. Accessibility: focus states, tap targets, kontrast, czytelność tekstu.

#### Kryteria ukończenia

- panel wygląda jak dopracowana aplikacja mobile-first,
- nie jak web zwężony do telefonu.

---

### Rekomendowana kolejność wdrożenia

1. **Etap 1**: Fundamenty i prawdziwość danych
2. **Etap 2**: Nawigacja + Profil
3. **Etap 3**: Domknięcie flow `Dziś`
4. **Etap 4**: Feedback — flow + modal
5. **Etap 5**: Plan jako ekran orientacji
6. **Etap 6**: `Wykonanie` zamiast `Historia`
7. **Etap 7**: Czat — dopracowanie
8. **Etap 8**: `Zawody` jako wspólna przestrzeń
9. **Etap 9**: `Kontuzje` — read-only + zgłoszenie
10. **Etap 10**: `Rozliczenia` — read-only
11. **Etap 11**: Stany błędu i puste stany
12. **Etap 12**: Spójność danych i architektury
13. **Etap 13**: Final polish UX/UI

---

### Podsumowanie zmian względem poprzedniej wersji

1. **Etap 1 zawężony** — tylko prawdziwość danych i statusy, helpery przeniesione do Etapu 12.
2. **Profil przesunięty wyżej** — scalony z nawigacją w Etap 2 (bo menu "Więcej" musi gdzieś prowadzić).
3. **Feedback scalony** — z dwóch etapów (flow + modal) w jeden Etap 4.
4. **Wyloguj zostaje** — głęboko w Profilu, nie usunięte.
5. **Menu "Więcej"** — skonkretyzowane: avatar w headerze → ekran Profil.
6. **Kontuzje = read-only** — ze względu na model JSONB; pełny CRUD wymaga migracji.
7. **Zawody = pełny CRUD** — bezpieczne dzięki osobnej tabeli.
8. **Server actions explicite wymienione** — w etapach 2, 8, 10.
9. **13 etapów** zamiast 15 (scalenia + usunięcie duplikacji).

---

### Podsumowanie końcowe

To jest finalna, zaktualizowana wersja planu dla panelu zawodnika.

Plan jest gotowy do wdrażania od Etapu 1.
