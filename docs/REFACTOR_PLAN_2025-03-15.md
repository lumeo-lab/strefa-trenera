# Refactor Plan

Data planu: 2025-03-15
Repozytorium: `trener`
Podstawa: pełny code review projektu wykonany na aktualnym stanie repo
Status: plan wdrożeniowy, bez zmian w kodzie

## 1. Cel planu

Celem refaktoryzacji jest:

- usunięcie krytycznych luk bezpieczeństwa,
- ograniczenie użycia `adminClient` do ściśle kontrolowanych miejsc,
- poprawa jakości architektury i modularności,
- zmniejszenie rozmiaru i złożoności największych komponentów,
- usunięcie martwego kodu i duplikacji,
- ujednolicenie walidacji i typowania,
- poprawa wydajności najbardziej obciążonych przepływów,
- przywrócenie wiarygodnego procesu jakościowego (`eslint`, `tsc`, testy).

Plan zakłada pracę etapową, tak żeby po każdym etapie system był w stabilnym i deployowalnym stanie.

## 2. Założenia i zasady wykonania

- Najpierw naprawy bezpieczeństwa i integralności danych, potem architektura i UX.
- Każdy etap kończy się testami i krótkim audytem regresji.
- Nie refaktorować “wszystkiego naraz”.
- Każda większa zmiana powinna być rozbita na małe PR-y lub małe logiczne commity.
- Wszędzie tam, gdzie to możliwe, zastępować kod oparty o `DbRow` typami z `lib/supabase/database.types.ts`.
- Nie dodawać kolejnych obejść na `adminClient`; zamiast tego doprecyzować model autoryzacji.

## 3. Najważniejsze problemy do zaadresowania

### P0: bezpieczeństwo i autoryzacja

- `lib/actions/feedback.ts`
- `lib/actions/messages.ts`
- `app/api/push/subscribe/route.ts`
- `app/api/strava/auth/route.ts`
- `app/api/strava/callback/route.ts`
- `app/api/strava/sync/route.ts`

Problemy:

- akcje serwerowe korzystają z `adminClient` i ufają danym z klienta,
- endpoint push pozwala podszyć subskrypcję pod dowolnego użytkownika,
- flow Strava nie ma bezpiecznego `state`,
- synchronizacja Stravy nie jest właściwie ograniczona autoryzacją,
- logika uprawnień jest rozproszona i niespójna.

### P1: integralność danych i niezawodność

- generowanie numerów faktur przez `count + 1`,
- ręczne parsowanie `FormData`,
- brak centralnej walidacji,
- brak spójnego modelu błędów w UI,
- wiele miejsc ignoruje wynik server actions.

### P2: utrzymywalność i modularność

- bardzo duże komponenty klienckie,
- duplikacja logiki feedbacku i dat,
- martwy kod,
- mieszanie domen biznesowych z warstwą UI.

### P3: wydajność i developer experience

- polling czatu całym route co 5 sekund,
- wielokrotne filtrowanie dużych kolekcji po stronie klienta,
- brak działającego `eslint` i `tsc`,
- słaba dokumentacja techniczna repo.

## 4. Docelowy stan architektury

Po refaktorze projekt powinien dążyć do poniższego układu:

- `app/...`:
  warstwa routingu i kompozycji widoków.
- `components/...`:
  małe, głównie prezentacyjne elementy UI.
- `lib/actions/...`:
  cienka warstwa integracyjna dla formularzy i eventów UI.
- `lib/server/...` albo `lib/services/...`:
  logika biznesowa, autoryzacja, walidacja, orchestration.
- `lib/validators/...`:
  schemy Zod i mapowanie `FormData -> typed input`.
- `lib/domain/...`:
  helpery domenowe, np. feedback, faktury, daty, statusy.
- `lib/auth/...`:
  wspólne guardy dla coacha i zawodnika.
- `lib/integrations/...`:
  Strava, push, inne zewnętrzne serwisy.

## 5. Plan wykonania etapami

## Etap 0. Stabilizacja środowiska i narzędzi jakościowych

### Cel

Przywrócić możliwość wiarygodnego uruchamiania statycznych kontroli.

### Zakres

- naprawić lokalne uruchamianie `eslint`,
- naprawić lokalne uruchamianie `tsc --noEmit`,
- potwierdzić spójność `node_modules`, lockfile i skryptów,
- doprecyzować minimalny workflow jakościowy.

### Zadania

1. Sprawdzić, czy problem wynika z uszkodzonego `node_modules/.bin`, niekompletnej instalacji albo konfliktu wersji Node.
2. Zweryfikować:
   - `package-lock.json`,
   - wersję Node,
   - poprawność instalacji `eslint` i `typescript`.
3. Odtworzyć działające:
   - `npm run lint`,
   - `npx tsc --noEmit`,
   - `npm test`.
4. Dodać do README lub docs krótki opis wymagań środowiskowych.

### Kryteria akceptacji

- `npm run lint` działa lokalnie,
- `npx tsc --noEmit` działa lokalnie,
- `npm test` nadal przechodzi,
- zespół ma jasny, powtarzalny workflow uruchamiania kontroli.

### Ryzyko

- naprawa może wymagać ponownej instalacji zależności,
- po uruchomieniu `tsc` mogą wyjść kolejne problemy typów.

## Etap 1. Zamknięcie krytycznych luk bezpieczeństwa

### Cel

Usunąć możliwość wykonywania operacji w imieniu innych użytkowników.

### Zakres

- feedback,
- wiadomości,
- push subscriptions,
- Strava connect/sync,
- użycie `adminClient`.

### Zadania 1A. Feedback

Pliki:

- `lib/actions/feedback.ts`
- `app/u/[slug]/_components/FeedbackModal.tsx`
- `lib/athlete-auth.ts`

Do zrobienia:

1. Usunąć z interfejsu klienta przekazywanie `coach_id` jako źródła prawdy.
2. W `createFeedback` i `updateFeedback` ustalać tożsamość zawodnika po sesji (`athlete_session`) lub po zalogowanym coachu.
3. Dodać serwerowy guard:
   - zawodnik może modyfikować tylko własny feedback,
   - trener może modyfikować tylko feedback własnych zawodników.
4. Zmienić API akcji tak, żeby dane wejściowe były minimalne:
   - `date`,
   - `session_id` opcjonalnie,
   - pola formularza.
5. Każdą operację na `feedbacks` powiązać serwerowo z relacją `athlete.id -> coach_id`.

Kryteria akceptacji:

- nie da się utworzyć feedbacku dla obcego `athlete_id`,
- nie da się podać arbitralnego `coach_id`,
- operacje przechodzą tylko dla poprawnej sesji użytkownika.

### Zadania 1B. Wiadomości

Pliki:

- `lib/actions/messages.ts`
- `app/u/[slug]/_components/AthleteChatPage.tsx`
- `app/coach/chat/_components/ChatClient.tsx`

Do zrobienia:

1. Przebudować `sendAthleteMessage`, żeby nie przyjmowała `coachId` jako zaufanego wejścia.
2. Po stronie serwera ustalać:
   - zawodnika z sesji,
   - coacha z relacji zawodnika w bazie.
3. Dla wiadomości coacha upewnić się, że trener może pisać tylko do własnego zawodnika.
4. Ograniczyć `adminClient` tylko do przypadków, gdzie jest absolutnie potrzebny i autoryzowany.

Kryteria akceptacji:

- zawodnik nie może wysłać wiadomości jako inny zawodnik,
- trener nie może wysłać wiadomości do cudzego zawodnika,
- testy autoryzacji pokrywają oba scenariusze.

### Zadania 1C. Push subscriptions

Pliki:

- `app/api/push/subscribe/route.ts`
- `lib/usePushSubscription.ts`
- `supabase/migrations/002_push_subscriptions.sql`

Do zrobienia:

1. Endpoint nie może ufać `userId` z requestu.
2. Dodać rozpoznawanie użytkownika po sesji:
   - coach z auth Supabase,
   - zawodnik z `athlete_session`.
3. `user_type` wyliczać po stronie serwera.
4. Zweryfikować strukturę subscription payload.
5. Rozważyć:
   - oddzielne endpointy dla coach i athlete,
   - podpisany payload,
   - rate limiting.

Kryteria akceptacji:

- nie można zapisać subskrypcji dla dowolnego `userId`,
- endpoint odrzuca nieautoryzowane żądania,
- zapisywanie działa poprawnie dla realnej sesji coacha i zawodnika.

### Zadania 1D. Strava connect/sync

Pliki:

- `app/api/strava/auth/route.ts`
- `app/api/strava/callback/route.ts`
- `app/api/strava/sync/route.ts`
- `supabase/migrations/003_strava.sql`

Do zrobienia:

1. Zastąpić `state=slug` bezpiecznym tokenem:
   - nonce zapisany po stronie serwera,
   - podpis HMAC,
   - albo jednorazowy rekord w DB z TTL.
2. Powiązać flow connect z aktualną sesją zawodnika.
3. `sync` ma działać wyłącznie dla aktualnie uwierzytelnionego zawodnika lub jego trenera.
4. Dodać walidację, że `athleteId` z requestu należy do aktualnej sesji.
5. Ograniczyć logowanie danych w błędach.

Kryteria akceptacji:

- nie da się połączyć Stravy do obcego zawodnika znając tylko `slug`,
- nie da się triggerować syncu dla obcego `athleteId`,
- callback odrzuca nieprawidłowy lub wygasły `state`.

## Etap 2. Ograniczenie i uporządkowanie `adminClient`

### Cel

Wprowadzić zasadę: `adminClient` tylko w wąskiej warstwie infrastrukturalnej i tylko z jawnym uzasadnieniem.

### Zakres

- `lib/supabase/admin.ts`
- wszystkie `actions`,
- route handlery,
- strony zawodnika korzystające z service role.

### Zadania

1. Sporządzić listę miejsc użycia `adminClient` i przypisać każde do kategorii:
   - uzasadnione,
   - do zastąpienia zwykłym klientem,
   - do przebudowy z guardem.
2. Wydzielić helpery typu:
   - `requireCoachUser()`,
   - `requireAthleteSession(slug)`,
   - `assertCoachOwnsAthlete(coachId, athleteId)`.
3. Usunąć bezpośrednie użycie `adminClient` z logiki domenowej tam, gdzie nie jest konieczne.
4. Zostawić service role wyłącznie dla:
   - tabel bez RLS dostępnych tylko serwerowo,
   - integracji,
   - wewnętrznych zadań systemowych.

### Kryteria akceptacji

- każdy przypadek użycia `adminClient` ma jawne uzasadnienie,
- logika biznesowa nie opiera się na “zaufaniu do klienta”,
- autoryzacja jest centralna i powtarzalna.

## Etap 3. Walidacja danych i kontrakty wejścia

### Cel

Wyeliminować ręczne, niespójne parsowanie formularzy.

### Zakres

- `lib/schemas.ts`
- `lib/actions/*.ts`
- formularze w kliencie.

### Zadania

1. Podzielić `lib/schemas.ts` na mniejsze pliki lub przynajmniej logiczne moduły:
   - athletes,
   - sessions,
   - invoices,
   - feedback,
   - messages,
   - packages,
   - races.
2. Podłączyć `validateFormData(...)` do server actions.
3. Zastąpić ręczne `parseFloat`, `parseInt`, `as string` tam, gdzie dane przechodzą przez Zod.
4. Wprowadzić jeden spójny format odpowiedzi z akcji, np.:
   - `{ ok: true, data }`
   - `{ ok: false, error, fieldErrors? }`
5. Upewnić się, że UI umie obsłużyć błędy walidacji bez zamykania modala.

### Kryteria akceptacji

- wszystkie krytyczne akcje walidują dane przez Zod,
- błędy są spójne i przewidywalne,
- frontend nie zakłada sukcesu, gdy backend zwróci błąd.

## Etap 4. Integralność danych i transakcyjność

### Cel

Usunąć błędy, które pojawią się przy równoległym użyciu lub większej skali.

### Zakres

- numerowanie faktur,
- powiązania athlete/coach,
- deduplikacja slugów,
- spójność operacji wieloetapowych.

### Zadania 4A. Faktury

Pliki:

- `lib/actions/invoices.ts`
- migracje schematu dla `invoices`

Do zrobienia:

1. Zastąpić `count + 1` generatorem odpornym na race condition.
2. Rozważyć:
   - sekwencję w Postgres,
   - RPC/function,
   - tabelę liczników per coach/year.
3. Dodać `UNIQUE` na numer faktury lub zakres coach/year/number.
4. Walidować typ i rozmiar załącznika po stronie serwera.
5. Rozważyć przejście z public URL na signed URL dla załączników.

Kryteria akceptacji:

- dwa równoległe wystawienia faktury nie tworzą kolizji numeru,
- załączniki są walidowane,
- ścieżka storage jest bezpieczna i przewidywalna.

### Zadania 4B. Slugi i tokeny

Pliki:

- `lib/actions/athletes.ts`
- `app/api/athlete/verify/route.ts`

Do zrobienia:

1. Sprawdzić, czy generowanie slugów nie powinno być przeniesione do wspólnego helpera domenowego.
2. Rozważyć:
   - bardziej stabilny algorytm,
   - ewentualne unikalne suffixy oddzielane `-`,
   - testy konfliktów.
3. Dla zaproszeń rozważyć:
   - możliwość rotacji tokena,
   - wygasanie tokenu invite,
   - ograniczenie liczby aktywnych sesji zawodnika.

Kryteria akceptacji:

- slug generation jest przewidywalne i przetestowane,
- invite flow jest bardziej odporny na nadużycia,
- można bezpiecznie regenerować link zaproszenia.

## Etap 5. Refaktor warstwy typów

### Cel

Odejść od `DbRow` i luźnych rekordów na rzecz rzeczywistych typów domenowych.

### Zakres

- `lib/types.ts`
- komponenty używające `DbRow`
- miejsca z `unknown as ...`

### Zadania

1. Ograniczyć `lib/types.ts` do typów rzeczywiście używanych.
2. Usunąć martwe interfejsy, jeśli nie mają zastosowania.
3. Zastąpić `DbRow` przez:
   - typy generowane z Supabase,
   - lokalne typy view-model, jeśli joiny tego wymagają.
4. Zmniejszyć liczbę:
   - `any`,
   - `Record<string, unknown>`,
   - ręcznych castów.
5. Wydzielić jawne typy dla:
   - feedback parsed view model,
   - chat thread model,
   - dashboard aggregates,
   - athlete profile tabs.

### Kryteria akceptacji

- `DbRow` przestaje być domyślnym typem aplikacji,
- typowanie jest bliżej danych rzeczywistych,
- mniej ukrytych błędów i mniej castów przy joinach.

## Etap 6. Dedykowana warstwa helperów domenowych

### Cel

Usunąć duplikację logiki i wprowadzić jeden punkt prawdy dla kluczowych formatów.

### Zakres

- feedback parsing/serialization,
- daty,
- statusy,
- session labels,
- formatowanie domenowe.

### Zadania

1. Wydzielić `lib/domain/feedback.ts`:
   - budowa payloadu feedbacku,
   - parse transcript,
   - mapowanie do view model.
2. Wydzielić `lib/domain/date.ts`:
   - lokalne “today”,
   - zakresy tygodni,
   - bezpieczne formatowanie dat,
   - helpery `daysAgo`, `daysUntil`, `isToday`, `isPast`.
3. Wydzielić `lib/domain/invoices.ts`:
   - statusy,
   - numeracja,
   - walidacje biznesowe.
4. Usunąć duplikację `parseTranscript` z:
   - `FeedbackClient`,
   - `FeedbackModal`,
   - server action feedback.

### Kryteria akceptacji

- logika feedbacku nie jest kopiowana w 3 miejscach,
- logika dat ma jeden wspólny standard,
- helpery są testowane jednostkowo.

## Etap 7. Rozbicie największych komponentów

### Cel

Zmniejszyć złożoność, ułatwić testowanie i dalszy rozwój UI.

### Priorytet komponentów

1. `app/coach/athletes/_components/AthletesClient.tsx`
2. `app/coach/invoices/_components/InvoicesClient.tsx`
3. `app/coach/dashboard/_components/DashboardClient.tsx`
4. `app/coach/athletes/[id]/_components/tabs/DataTab.tsx`
5. `app/coach/planner/_components/PlannerClient.tsx`
6. `app/coach/chat/_components/ChatClient.tsx`
7. `app/u/[slug]/_components/AthleteTodayPage.tsx`

### Zadania 7A. AthletesClient

Proponowany podział:

- `AthletesToolbar`
- `AthletesQuickFilters`
- `AthletesStatusFilters`
- `AthletesTable`
- `AthleteRow`
- `useAthletesTableState`

Do wydzielenia:

- sortowanie,
- filtrowanie,
- drag and drop order,
- zarządzanie kolumnami,
- status dropdown,
- wyliczanie liczników.

### Zadania 7B. InvoicesClient

Proponowany podział:

- `InvoicesFilters`
- `InvoicesTable`
- `CreateInvoiceModal`
- `EditInvoiceModal`
- `useInvoiceListState`

Do wydzielenia:

- sort/filter,
- optimistic updates,
- create/edit/delete flow,
- KPI cards.

### Zadania 7C. DataTab

Proponowany podział:

- `AthleteCoreDataCard`
- `AthletePersonalBestsCard`
- `AthleteInjuriesCard`
- `useAthleteDataForm`
- `usePersonalBestsForm`
- `useInjuriesForm`

### Kryteria akceptacji

- największe komponenty stają się czytelne,
- logika stanu jest przeniesiona do hooków lub helperów,
- widoki zawierają głównie renderowanie i prostą orkiestrację.

## Etap 8. Refaktor dashboardu i agregacji danych

### Cel

Uprościć obliczenia i ograniczyć koszt pracy na dużych kolekcjach.

### Zakres

- `app/coach/dashboard/page.tsx`
- `app/coach/athletes/page.tsx`
- sekcje dashboardu

### Zadania

1. Wydzielić serwerowe funkcje agregujące dane dla dashboardu.
2. Rozważyć SQL views lub RPC dla cięższych agregatów.
3. Ograniczyć liczbę równoległych query zwracających zbyt szerokie zbiory.
4. Dodać jawne typy dla wyników agregacji.
5. Tam, gdzie ma sens, wykorzystać cache/revalidate z kontrolowanym zakresem.

### Kryteria akceptacji

- `page.tsx` nie jest miejscem dla długiej logiki agregacji,
- agregacje są testowalne osobno,
- łatwiej rozpoznać koszt zapytań i zależności danych.

## Etap 9. Refaktor czatu i modelu aktualizacji danych

### Cel

Ograniczyć koszt pollingowy i poprawić responsywność.

### Zakres

- czat coacha,
- czat zawodnika,
- push,
- odczyty wiadomości.

### Zadania

1. Rozważyć przejście z pełnego `router.refresh()` co 5 sekund na:
   - Supabase Realtime,
   - SSE,
   - albo lekki endpoint `since=timestamp`.
2. Dodać czytelny model oznaczania wiadomości jako przeczytane.
3. Ograniczyć liczbę pełnych list `messages.filter(...)` w renderze.
4. Dodać ewentualne paginowanie / lazy loading starszych wiadomości.
5. Wydzielić model `threadByAthlete`.

### Kryteria akceptacji

- UI czatu nie odświeża całego route bez potrzeby,
- render nie wykonuje kosztownego filtrowania wielokrotnie,
- push i chat mają spójny model tożsamości użytkownika.

## Etap 10. Porządki w kodzie i usuwanie martwych elementów

### Cel

Zmniejszyć szum i uprościć repo.

### Zakres

- nieużywane eksporty,
- nieużywane typy,
- martwe helpery,
- pozostałości po wcześniejszych podejściach.

### Lista do weryfikacji na start

- `deleteAthlete` w `lib/actions/athletes.ts`
- nieużywane schemy w `lib/schemas.ts`
- nieużywane interfejsy w `lib/types.ts`
- helpery używane tylko w testach lub częściowo porzucone

### Zadania

1. Po uruchomieniu działającego linta usunąć wszystkie nieużywane importy i eksporty.
2. Ograniczyć `eslint-disable` do rzeczywiście uzasadnionych miejsc.
3. Usunąć typy i helpery bez realnego użycia.
4. Doprecyzować nazwy zmiennych w miejscach ogólnych typu `data`, `fields`, `result`, `inv`, `fb`, gdy utrudniają czytanie.

### Kryteria akceptacji

- mniej martwego kodu,
- mniej wyjątków lintera,
- łatwiejsze wejście w kod dla kolejnej osoby.

## 6. Plan testów

## Testy jednostkowe

Dodać lub rozszerzyć testy dla:

- helperów dat lokalnych,
- parsera/serializera feedbacku,
- generatora slugów,
- generatora numerów faktur,
- walidatorów Zod.

## Testy integracyjne

Pokryć:

- tworzenie feedbacku przez zawodnika,
- edycję feedbacku przez zawodnika,
- odpowiedź trenera na feedback,
- wysłanie wiadomości przez coacha,
- wysłanie wiadomości przez zawodnika,
- zapis push subscription,
- flow connect Strava,
- sync Strava,
- tworzenie faktury z i bez załącznika.

## Testy bezpieczeństwa

Sprawdzić negatywne scenariusze:

- zawodnik próbuje zapisać feedback dla cudzego `athlete_id`,
- zawodnik próbuje wysłać wiadomość w imieniu innego zawodnika,
- klient wysyła push subscription z cudzym `userId`,
- request do `strava/sync` z obcym `athleteId`,
- trener próbuje pisać do zawodnika, który do niego nie należy.

## Testy regresji UI

Zweryfikować:

- modal feedbacku,
- modal faktur,
- planner,
- tabela zawodników,
- czat coacha,
- czat zawodnika,
- dashboard po zmianie ustawień.

## 7. Kolejność wdrożenia

Rekomendowana kolejność PR-ów:

1. Naprawa narzędzi jakościowych.
2. Autoryzacja feedback.
3. Autoryzacja messages.
4. Autoryzacja push subscriptions.
5. Zabezpieczenie Strava connect/sync.
6. Refaktor walidacji formularzy.
7. Refaktor faktur i numeracji.
8. Refaktor typów i usunięcie `DbRow`.
9. Refaktor helperów domenowych.
10. Rozbijanie dużych komponentów.
11. Refaktor wydajności czatu.
12. Usuwanie martwego kodu i porządki końcowe.

## 8. Szacowanie prac

Orientacyjnie:

- Etap 0: 0.5 dnia
- Etap 1: 2 do 4 dni
- Etap 2: 1 do 2 dni
- Etap 3: 1 do 2 dni
- Etap 4: 1 do 2 dni
- Etap 5: 1 do 2 dni
- Etap 6: 1 dzień
- Etap 7: 3 do 5 dni
- Etap 8: 1 do 2 dni
- Etap 9: 1 do 3 dni
- Etap 10: 0.5 do 1 dnia

Łącznie:

- wariant minimalny: około 12 dni roboczych,
- wariant dokładny z testami i cleanupem: około 18 do 22 dni roboczych.

## 9. Definicja zakończenia refaktoru

Refaktor uznajemy za zakończony, gdy:

- krytyczne luki bezpieczeństwa są zamknięte,
- `adminClient` nie jest używany jako skrót do omijania autoryzacji,
- `eslint`, `tsc`, `vitest` działają,
- najważniejsze przepływy mają testy integracyjne,
- największe komponenty są rozbite na mniejsze moduły,
- martwy kod i duplikacja zostały wyraźnie ograniczone,
- projekt ma czytelniejszy podział odpowiedzialności.

## 10. Rekomendacja wykonawcza

Najlepsza strategia dla tego repo:

- nie robić dużego “big bang refactor”,
- zacząć od warstwy bezpieczeństwa,
- dopiero potem ruszać typy i UI,
- każdą domenę stabilizować osobno,
- utrzymywać repo cały czas w stanie możliwym do wdrożenia.

## 11. Pierwszy konkretny sprint rekomendowany

Jeśli zaczynamy od razu, pierwszy sprint powinien objąć tylko:

1. naprawę `eslint` i `tsc`,
2. uszczelnienie `feedback`,
3. uszczelnienie `messages`,
4. uszczelnienie `push/subscribe`,
5. podstawowe testy negatywne dla tych przepływów.

To da największy spadek ryzyka przy relatywnie małym zakresie zmian.
