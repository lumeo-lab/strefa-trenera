# Finalny Plan Poprawy Dashboardu i Powiązanych Elementów

Status: **Gotowy do wdrożenia etapami**
Ostatnia aktualizacja: 2026-03-18
Zakres: `Dashboard` jako finalna runda dopracowania do poziomu produkcyjnego `10/10`, z uwzględnieniem powiązanych uwag z tego pliku, które wpływają na jakość pracy trenera z dashboardu.

---

## Założenie główne

Po wdrożeniu wszystkich etapów dashboard ma być:

- semantycznie poprawny: każda karta i sekcja mówi prawdę o danych,
- operacyjny: z każdego bloku da się przejść do właściwego działania bez błądzenia,
- wiarygodny: trener ma ufać, że dashboard pokazuje realne priorytety dnia,
- spójny: dashboard, feedback, chat, planner i finanse zachowują się jako jeden system,
- dopracowany UX-owo: bez mylących etykiet, martwych sekcji i opóźnionej informacji zwrotnej.

---

## Definicja ukończenia

Sekcja `Dashboard` uznajemy za skończoną dopiero wtedy, gdy:

- wszystkie KPI są poprawne semantycznie i produktowo,
- każda sekcja ma jasny cel i poprawną logikę,
- każdy sygnał ostrzegawczy ma powód i sensowny CTA,
- nie ma sekcji, które pokazują dane prawdziwe technicznie, ale mylące biznesowo,
- nie ma martwego kodu ani tymczasowych placeholderów,
- dashboard współgra z feedbackiem, chatem, plannerem i fakturami bez opóźnionych lub sprzecznych stanów,
- przejścia z dashboardu prowadzą dokładnie tam, gdzie trener oczekuje.

---

## Zależności z wcześniejszych uwag z tego pliku

Poniższe punkty z wcześniejszego planu zostają włączone do finalnej rundy, bo wpływają bezpośrednio na jakość dashboardu albo na zaufanie do całego panelu:

### Włączone bezpośrednio do rundy dashboardowej

1. Dashboard KPI affordance
- Plik: `app/coach/dashboard/_components/DashboardClient.tsx`
- Zakres: dodać lepszą klikalność i jasną affordance kart KPI.
- Status włączony do Etapu 2.

2. Feedback optimistic mark-as-read
- Plik: `app/coach/feedback/_components/FeedbackClient.tsx`
- Zakres: po oznaczeniu feedbacku jako przeczytany UI ma reagować od razu.
- Status włączony do Etapu 5, bo dashboard mocno polega na sekcji feedbackowej jako źródle zaufania.

3. Chat visibility check + rzadszy polling
- Plik: `app/coach/chat/_components/ChatClient.tsx`
- Zakres: ograniczyć polling w tle i lepiej zsynchronizować odczyt wiadomości.
- Status włączony do Etapu 5, bo dashboard i chat pokazują ten sam obszar operacyjny.

4. Planner disabled select podczas przełączania
- Plik: `app/coach/planner/_components/PlannerShell.tsx`
- Zakres: ograniczyć race conditions przy przechodzeniu z dashboardu do planera.
- Status włączony do Etapu 4.

### Poza rundą dashboardową, ale nie blokują

5. KPI faktur reagujące na filtry w `InvoicesClient`
- To ważna poprawka finansowa, ale dotyczy podstrony faktur, nie samego dashboardu.
- Można zrobić równolegle, lecz nie blokuje finalizacji dashboardu.

6. Obsługa brakującego załącznika faktury
- To poprawka jakości `InvoicesClient`, poza ścisłym zakresem dashboardu.

7. Settings upload UX
- To poprawka ustawień, poza ścisłym zakresem dashboardu.

8. Cleanup importów i date utils
- To cleanup techniczny, do wykonania po głównych etapach.

---

## Etap 1: Prawda danych i semantyka sekcji

Priorytet: **Krytyczny**
Ryzyko: **Średnie**
Cel: usunąć miejsca, w których dashboard pokazuje dane myląco albo niezgodnie z nazwą sekcji.

### Zakres

1. Naprawa logiki sekcji `Bez planu do końca tygodnia`
- Pliki:
  - `app/coach/dashboard/page.tsx`
  - `app/coach/dashboard/_components/DashboardClient.tsx`
  - `app/coach/dashboard/_components/sections/AthleteSections.tsx`
- Obecny problem:
  - zawodnik bywa uznawany za „ma plan”, jeśli miał dowolną sesję od dziś do końca tygodnia, nawet już wykonaną dziś rano,
  - to nie odpowiada etykiecie „bez planu do końca tygodnia”.
- Docelowa logika:
  - zawodnik ma plan, jeśli:
    - ma niewykonaną sesję dziś, lub
    - ma jakąkolwiek sesję od jutra do końca tygodnia,
  - zawodnik nie ma planu, jeśli:
    - nie ma żadnej przyszłej sesji,
    - a dzisiejsza sesja, jeśli była, jest już zamknięta i nie ma nic dalej.
- Decyzja produktowa:
  - jeśli taka logika okaże się zbyt złożona względem copy, zmieniamy nazwę sekcji na bardziej precyzyjną,
  - ale preferowany kierunek: naprawić logikę, nie copy.

2. Naprawa KPI `Aktywni zawodnicy`
- Pliki:
  - `app/coach/dashboard/page.tsx`
  - `app/coach/dashboard/_components/DashboardClient.tsx`
- Obecny problem:
  - karta pokazuje liczbę aktywnych, ale pod spodem sugeruje „wszystkich w bazie”, choć źródło danych jest już przefiltrowane.
- Docelowe rozwiązanie:
  - wariant docelowy:
    - pokazać `aktywni`,
    - osobno `archiwalni`,
    - opcjonalnie `wszyscy`.
  - wariant minimalny:
    - usunąć mylący dopisek.

3. Urealnienie KPI przychodu
- Pliki:
  - `app/coach/dashboard/page.tsx`
  - `app/coach/dashboard/_components/DashboardClient.tsx`
- Obecny problem:
  - karta komunikuje przychód miesięczny, ale liczona jest jako suma cen pakietów aktywnych zawodników.
- Docelowe rozwiązanie:
  - zmienić nazewnictwo na `Szacowany MRR` albo `Szacowany przychód z aktywnych pakietów`,
  - dopisek ma jasno komunikować, że to estymacja, nie zaksięgowane wpływy.

4. Uporządkowanie pojęć `alert`, `uwaga`, `aktywny`, `pilne`
- Pliki:
  - `app/coach/dashboard/page.tsx`
  - `app/coach/dashboard/_components/sections/AthleteSections.tsx`
  - ewentualnie wspólny helper w `lib/`
- Cel:
  - dashboard nie może używać stanów biznesowych bez jasnego znaczenia,
  - sekcja alertów musi opierać się na spójnej definicji.

### Kryteria ukończenia

- sekcja `Bez planu do końca tygodnia` pokazuje wyłącznie tych zawodników, którzy rzeczywiście nie mają dalszego planu,
- KPI zawodników nie zawiera fałszywej informacji,
- KPI przychodu nie sugeruje faktycznie zaksięgowanych wpływów, jeśli ich nie liczy,
- copy dashboardu jest zgodne z tym, co liczy backend.

---

## Etap 2: Lepsze KPI i wyraźna klikalność

Priorytet: **Wysoki**
Ryzyko: **Niskie**
Cel: poprawić pierwszy kontakt z dashboardem i wzmocnić czytelność głównych kart.

### Zakres

1. Wzmocnienie affordance kart KPI
- Plik:
  - `app/coach/dashboard/_components/DashboardClient.tsx`
- Uwzględnia wcześniejszą uwagę z tego pliku.
- Zmiany:
  - `cursor-pointer`,
  - bardziej czytelny hover,
  - delikatny border / shadow / tło sygnalizujące interaktywność,
  - spójne zachowanie wszystkich kart.

2. Ujednolicenie struktury KPI
- Karty KPI mają odpowiadać na cztery różne pytania:
  - ilu mam aktywnych zawodników,
  - ile feedbacków czeka,
  - ile pieniędzy jest realnie do zebrania,
  - jaki jest szacunkowy biznesowy potencjał miesiąca.
- Każda karta powinna mieć:
  - główną liczbę,
  - krótką etykietę,
  - wtórny kontekst,
  - stan kolorystyczny zależny od pilności.

3. Lepsza sygnalizacja stanu krytycznego
- KPI `payments` i `feedback` powinny mieć wyraźniejszy stan ostrzegawczy,
- jeśli są zaległości albo dużo nieprzeczytanych wpisów, karta musi to komunikować mocniej niż zwykłym tekstem.

### Kryteria ukończenia

- każda karta KPI jest wyraźnie klikalna,
- każda karta ma semantycznie poprawny opis,
- stany neutralne, warning i critical są czytelne bez czytania całej treści.

---

## Etap 3: Sekcje operacyjne, które prowadzą do działania

Priorytet: **Wysoki**
Ryzyko: **Średnie**
Cel: sprawić, żeby dashboard nie tylko informował, ale prowadził do konkretnej akcji.

### Zakres

1. Przebudowa sekcji `Najważniejsze na dziś`
- Pliki:
  - `app/coach/dashboard/_components/sections/ActionSections.tsx`
  - ewentualnie `app/coach/dashboard/page.tsx`
- Zmiany:
  - priorytetyzacja kart `danger > warning > neutral`,
  - stała kolejność logiczna zamiast przypadkowego pushowania elementów,
  - wyraźniejsze rozróżnienie:
    - pilne finansowe,
    - pilne komunikacyjne,
    - planowanie,
    - starty.
- Opcjonalnie:
  - limit widocznych kart + link `pokaż więcej`, jeśli sekcja zrobi się za długa.

2. Lepsze CTA z sekcji dashboardowych
- Pliki:
  - `ActionSections.tsx`
  - `CommunicationSections.tsx`
  - `AthleteSections.tsx`
  - `FinanceRaceSections.tsx`
- Zmiany:
  - feedback ma prowadzić do właściwego kontekstu zawodnika lub zakładki feedback,
  - zawody mają prowadzić do zakładki zawodów albo do sekcji startowej,
  - płatności mają prowadzić najlepiej do widoku z filtrem `overdue`,
  - plan dnia ma prowadzić do planera z właściwym zawodnikiem i możliwie bliskim kontekstem.

3. Dodanie informacji `pokazano 5 z X`
- Sekcje:
  - `Nieprzeczytane feedbacki`
  - `Nieprzeczytane wiadomości`
- Cel:
  - trener ma wiedzieć, że to tylko preview, nie pełna lista.

### Kryteria ukończenia

- sekcja `Najważniejsze na dziś` pokazuje realne priorytety,
- kliknięcia z dashboardu trafiają dokładnie tam, gdzie trzeba,
- użytkownik nie myli preview z pełną listą.

---

## Etap 4: Planner i plan dnia jako jeden przepływ

Priorytet: **Wysoki**
Ryzyko: **Niskie do średniego**
Cel: dopiąć przejścia dashboard -> planner oraz usunąć niepewność przy przełączaniu zawodnika.

### Zakres

1. Disabled select w plannerze podczas zmiany zawodnika
- Plik:
  - `app/coach/planner/_components/PlannerShell.tsx`
- Uwzględnia wcześniejszą uwagę z tego pliku.
- Zmiany:
  - zablokować select na czas krytycznej zmiany zawodnika,
  - ograniczyć race conditions przy szybkim przełączaniu.
- Preferencja wdrożeniowa:
  - najpierw prosty wariant z krótkim disabled-state,
  - jeśli będzie za słaby, pełne zsynchronizowanie z `loadingRange`.

2. Lepszy kontekst z sekcji `Dziś w planie`
- Plik:
  - `app/coach/dashboard/_components/sections/TodaySections.tsx`
- Zmiany:
  - lepsze rozróżnienie wykonane / niewykonane,
  - bardziej użyteczny opis sesji,
  - opcjonalnie badge:
    - `feedback jest`,
    - `feedback brak`,
    - `wykonane`.

3. Ocena czy `WeekSummarySection` ma sens
- Plik:
  - `app/coach/dashboard/_components/sections/TodaySections.tsx`
- Decyzja obowiązkowa:
  - albo ją wdrażamy jako realną sekcję dashboardu,
  - albo usuwamy.
- Nie zostawiamy martwego kodu.

### Kryteria ukończenia

- przejście z dashboardu do planera nie powoduje niepewnych stanów,
- sekcja `Dziś w planie` pomaga działać, a nie tylko pokazuje tytuły,
- nie ma martwych sekcji ani porzuconych komponentów.

---

## Etap 5: Komunikacja i zaufanie do stanu odczytu

Priorytet: **Wysoki**
Ryzyko: **Niskie**
Cel: dashboard, feedback i chat mają pokazywać spójny stan bez poczucia opóźnienia albo „czy to już się zapisało?”.

### Zakres

1. Feedback optimistic mark-as-read
- Plik:
  - `app/coach/feedback/_components/FeedbackClient.tsx`
- Uwzględnia wcześniejszą uwagę z tego pliku.
- Zmiana:
  - po sukcesie `markFeedbackRead` lokalny stan zmienia się natychmiast.

2. Chat polling zależny od visibility
- Plik:
  - `app/coach/chat/_components/ChatClient.tsx`
- Uwzględnia wcześniejszą uwagę z tego pliku.
- Zmiany:
  - polling tylko przy `document.visibilityState === 'visible'`,
  - interwał wydłużony z 5s do 15s,
  - `visibilitychange` restartuje / wstrzymuje odświeżanie.

3. Uspójnienie dashboardowych preview wiadomości
- Pliki:
  - `app/coach/dashboard/page.tsx`
  - `CommunicationSections.tsx`
- Zmiana docelowa:
  - rozważyć agregację po threadzie, nie po pojedynczej wiadomości.
- Minimalny wariant:
  - zostawić obecny model, ale jasno komunikować, że to ostatnie wiadomości, a nie wątki.

4. Uspójnienie dashboardowych preview feedbacków
- Pokazać więcej kontekstu:
  - typ wpisu,
  - sygnał,
  - bardziej użyteczny skrót treści.

### Kryteria ukończenia

- oznaczenie feedbacku jako przeczytany działa natychmiast w UI,
- chat nie odświeża się bez sensu w tle,
- dashboard nie pokazuje komunikacji w sposób mylący lub spóźniony.

---

## Etap 6: Powody alertów i kontekst coachingowy

Priorytet: **Bardzo wysoki**
Ryzyko: **Średnie**
Cel: sekcje ostrzegawcze mają tłumaczyć problem, nie tylko go sygnalizować.

### Zakres

1. Dodanie `reason` do alertów dashboardowych
- Pliki:
  - `app/coach/dashboard/page.tsx`
  - `app/coach/dashboard/_components/types.ts`
  - `app/coach/dashboard/_components/sections/AthleteSections.tsx`
  - ewentualnie helper w `lib/`
- Przykładowe powody:
  - czerwony feedback,
  - brak planu,
  - zaległa faktura,
  - brak kontaktu od X dni,
  - aktywna kontuzja,
  - niski compliance.

2. Ustalenie priorytetu powodów
- Jeśli zawodnik ma kilka powodów, dashboard pokazuje:
  - najważniejszy powód,
  - opcjonalnie `+1` / `+2`.

3. Rozszerzenie alertów na użyteczne sekcje coachingowe
- Opcjonalnie dodać nowe bloki:
  - `Brak feedbacku po treningu`,
  - `Brak kontaktu`,
  - `Spadek realizacji planu`.
- Decyzja wdrożeniowa:
  - minimum: dodać powody do obecnej sekcji,
  - target 10/10: dołożyć przynajmniej jedną nową sekcję wysokiej wartości.

### Kryteria ukończenia

- sekcja `Wymagają uwagi` nie pokazuje samych kolorów, tylko konkretny powód,
- trener po wejściu na dashboard od razu rozumie, dlaczego dany zawodnik tam jest,
- nie trzeba wchodzić w profil tylko po to, żeby odczytać naturę problemu.

---

## Etap 7: Finanse i zawody jako realne workflow

Priorytet: **Średni do wysokiego**
Ryzyko: **Niskie**
Cel: poprawić sekcje, które dziś są użyteczne, ale zbyt ogólne.

### Zakres

1. Ulepszenie sekcji `Płatności po terminie`
- Plik:
  - `app/coach/dashboard/_components/sections/FinanceRaceSections.tsx`
- Zmiany:
  - bardziej precyzyjne CTA,
  - możliwość wejścia do konkretnego kontekstu faktur,
  - lepsze odróżnienie `pending` od realnego `overdue`.

2. Ulepszenie sekcji `Nadchodzące zawody`
- Plik:
  - `FinanceRaceSections.tsx`
- Zmiany:
  - rozważyć podział:
    - starty dziś/jutro,
    - starty w najbliższych 14 dniach,
  - link prowadzący do właściwego miejsca dla przygotowania startu.

3. Spójność dashboard-finanse
- Jeśli w osobnej podstronie faktur KPI nie reagują na filtry, naprawa jest rekomendowana równolegle.
- To nie jest blocker dashboardu, ale poprawia ogólną wiarygodność modułu finansowego.

### Kryteria ukończenia

- sekcja płatności wskazuje rzeczywiście pilne przypadki,
- sekcja zawodów lepiej wspiera przygotowanie startowe,
- dashboard nie przekierowuje do zbyt szerokich widoków, jeśli użytkownik oczekuje kontekstu.

---

## Etap 8: Personalizacja trwała i final polish

Priorytet: **Średni**
Ryzyko: **Średnie**
Cel: domknąć dashboard jako dojrzały ekran, a nie tylko lokalnie konfigurowalny widok.

### Zakres

1. Wyniesienie preferencji dashboardu z `localStorage` do backendu
- Pliki:
  - `app/coach/dashboard/_components/useDashboardPrefs.ts`
  - nowa tabela / akcja / endpoint w zależności od wybranego rozwiązania
- Dane:
  - kolejność KPI,
  - widoczność sekcji,
  - kolejność sekcji,
  - stan dismiss hint.

2. Finalny przegląd copy
- Wszystkie etykiety, opisy i badge mają być:
  - prawdziwe,
  - krótkie,
  - bez marketingowego nadmuchania,
  - jednoznaczne.

3. A11y i mikrousprawnienia
- Settings modal:
  - sprawdzić focus flow,
  - opisy toggle,
  - sensowność przycisków góra/dół.
- KPI i sekcje:
  - czy klikalność jest czytelna klawiaturowo i wizualnie.

4. Cleanup techniczny po wdrożeniu
- usunąć martwe importy,
- usunąć martwe helpery,
- uprościć helpery daty, jeśli podczas wdrożenia pojawią się duplikaty.

### Kryteria ukończenia

- preferencje dashboardu nie giną między urządzeniami,
- copy jest spójne i dokładne,
- po wdrożeniu nie zostaje techniczny bałagan.

---

## Rekomendowana kolejność wdrożenia

### Sprint 1: Wiarygodność danych

1. Etap 1
2. Etap 2

Efekt:
- dashboard przestaje kłamać lub upraszczać za mocno,
- KPI stają się poprawne i czytelne.

### Sprint 2: Operacyjność

3. Etap 3
4. Etap 4

Efekt:
- z dashboardu da się przejść do właściwej akcji,
- planner i plan dnia przestają być luźno spięte.

### Sprint 3: Komunikacja i sygnały

5. Etap 5
6. Etap 6

Efekt:
- trener ufa stanowi wiadomości i feedbacków,
- alerty mają realny sens coachingowy.

### Sprint 4: Domknięcie jakości

7. Etap 7
8. Etap 8

Efekt:
- dashboard jest dopracowany również w finansach, startach i personalizacji,
- kończymy bez długu UX/produktowego.

---

## Minimum akceptacyjne po każdym etapie

Po każdym etapie sprawdzamy:

- czy dashboard nadal buduje się i renderuje bez regresji,
- czy liczby zgadzają się z rzeczywistymi danymi,
- czy CTA prowadzą do właściwego miejsca,
- czy nie pojawiła się niespójność między dashboardem a podstroną docelową,
- czy copy odpowiada logice,
- czy nie zostawiliśmy martwego kodu.

---

## Ustalenie końcowe

Nie wdrażamy wszystkich zmian naraz.
Pracujemy etapami w tej kolejności:

1. Etap 1: Prawda danych i semantyka sekcji
2. Etap 2: Lepsze KPI i wyraźna klikalność
3. Etap 3: Sekcje operacyjne, które prowadzą do działania
4. Etap 4: Planner i plan dnia jako jeden przepływ
5. Etap 5: Komunikacja i zaufanie do stanu odczytu
6. Etap 6: Powody alertów i kontekst coachingowy
7. Etap 7: Finanse i zawody jako realne workflow
8. Etap 8: Personalizacja trwała i final polish

To jest plan finalnej rundy poprawiania dashboardu.
Po jego pełnym wdrożeniu sekcja ma być zamknięta jako dopracowana, spójna i produkcyjnie gotowa.

---
---

# Plan poprawek sekcji Feedback

Status: **Do wdrożenia**
Ostatnia aktualizacja: 2026-03-18

Dotyczy dwóch kontekstów:
- **Główna strona** `/coach/feedback` (`FeedbackClient.tsx`)
- **Profil zawodnika** → tab Feedback (`FeedbackTab.tsx`)
- **Współdzielony komponent** `FeedbackCard.tsx`

---

## Etap F1: Skompresowanie filtrów na głównej stronie feedback
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/feedback/_components/FeedbackClient.tsx`

Problem: Toolbar z 4 osobnymi selectami w gridzie + OverviewStats nad nimi = ~350px UI przed pierwszym feedbackiem. Na laptopie 13" feedbacki mogą być poniżej foldu.

Zmiany:
- Skompresować toolbar do jednego wiersza (ten sam wzorzec co FeedbackTab w profilu i HistoryTab)
- OverviewStats przenieść do topbar subtitle lub usunąć (dane i tak są widoczne jako counts w filtrach)
- Dodać search input (jest w profilu, brakuje na głównej stronie)
- Hint zostawić — ale przesunąć pod filtry (bliżej feedbacków)

---

## Etap F2: Overview stats reagujące na filtry
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/feedback/_components/FeedbackClient.tsx`

Problem: Stats (Dziś/Nieprzeczytane/Bez odpowiedzi) zawsze liczą z `initialFeedbacks`. Gdy trener filtruje po zawodniku — stats się nie zmieniają.

Zmiany:
- Jeśli OverviewStats zostaną (po etapie F1) — mają liczyć z `filtered` po athlete filter
- Filter counts (`filterButtons`) też mają reagować na wybranego zawodnika
- Alternatywa: jeśli stats zostaną usunięte w F1, ten etap odpada

---

## Etap F3: Optimistic mark-as-read
**Ryzyko: NISKIE** | 2 pliki | Status: **Do zrobienia**

Pliki: `FeedbackClient.tsx`, `FeedbackCard.tsx`

Problem: Po kliknięciu "Oznacz jako przeczytane" → spinner → czeka na server → `router.refresh()` → dopiero wtedy karta zmienia wygląd. Brak natychmiastowego feedbacku.

Zmiany:
- Po udanym `markFeedbackRead` — lokalnie ustawić `read: true` na feedbacku w stanie komponentu
- Badge "Nowy" znika natychmiast, karta traci `ring-1 ring-white/5` od razu
- Server potwierdza w tle, `router.refresh()` synchronizuje

---

## Etap F4: Ostrzeżenie przy nadpisywaniu reply
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `components/coach/FeedbackCard.tsx`

Problem: Kliknięcie "Edytuj odpowiedź" otwiera textarea z poprzednią treścią. Brak informacji że nadpisze starą odpowiedź.

Zmiana:
- Jeśli `fb.coach_reply` istnieje i użytkownik klika "Edytuj odpowiedź" — pokazać małą notkę nad textarea: "Edytujesz istniejącą odpowiedź. Zapisanie zastąpi poprzednią."

---

## Etap F5: Ujednolicenie empty states i drobne poprawki
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/feedback/_components/FeedbackClient.tsx`

Zmiany:
1. Empty state "Brak feedbacków w tej kategorii" (linia 294-297) — zamienić na `EmptyState` z `components/ui/` z ikoną i opisem
2. Grouped view — dodać delikatny separator między grupami (border-top lub card wrapper) żeby nie zlewały się
3. Przycisk "Oznacz jako przeczytane" — skrócić do "Przeczytane" (za długi na wąskich ekranach)

---

## Etap F6: Limit 200 feedbacków — komunikacja
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/feedback/_components/FeedbackClient.tsx`

Problem: Serwer zwraca max 200 feedbacków (`.limit(200)` w page.tsx). Trener nie wie że widzi tylko ostatnie 200.

Zmiana:
- Jeśli `initialFeedbacks.length >= 200` — pokazać info na dole listy: "Wyświetlono ostatnie 200 feedbacków. Starsze wpisy znajdziesz w profilach zawodników."

---

## Podsumowanie etapów Feedback

| Etap | Opis | Ryzyko |
|------|------|--------|
| F1 | Kompresja filtrów + usunięcie/przeniesienie stats | Niskie |
| F2 | Stats reagujące na filtry (jeśli zostaną) | Niskie |
| F3 | Optimistic mark-as-read | Niskie |
| F4 | Ostrzeżenie przy nadpisywaniu reply | Niskie |
| F5 | Empty states + separatory grup + krótszy przycisk | Niskie |
| F6 | Info o limicie 200 feedbacków | Niskie |

---

---
---

# Plan poprawek sekcji Czat

Status: **Do wdrożenia**
Ostatnia aktualizacja: 2026-03-18

Dotyczy:
- **Strona** `/coach/chat` (`ChatClient.tsx`)
- **Server Actions** `lib/actions/messages.ts`
- **Server Component** `app/coach/chat/page.tsx`

---

## Etap C1: Visibility check + dłuższy interwał pollingu
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/chat/_components/ChatClient.tsx`

Problem: `router.refresh()` + `loadMessages()` co 5s nawet gdy zakładka w tle — drenaż baterii, ~720 requestów/h.

Zmiany:
- Sprawdzać `document.visibilityState === 'visible'` przed pollem
- Wydłużyć interwał z 5s do 15s
- Dodać `visibilitychange` listener żeby wznowić/wstrzymać polling
- Poll natychmiast po powrocie do zakładki (nie czekać na kolejny tick)

---

## Etap C2: Error handling w loadMessages + race condition guard
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/chat/_components/ChatClient.tsx`

Problemy:
- `loadMessages` ma `try/finally` ale brak `catch` — nieobsłużone wyjątki
- Szybkie przełączanie wątków (3 kliknięcia) = 3 równoległe requesty, ostatni wygrywa ale może być odpowiedzią na innego zawodnika

Zmiany:
- Dodać `catch` z komunikatem błędu (np. `setSendError`-like state)
- Dodać guard: ignorować odpowiedź jeśli `athleteId` się zmienił od momentu wysłania requesta

---

## Etap C3: Separatory dat w wiadomościach
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/chat/_components/ChatClient.tsx`

Problem: Wiadomości renderowane jako ciągła lista bez oddzielenia dat. Przy dłuższych rozmowach nie wiadomo kiedy co było.

Zmiana:
- Przed renderowaniem wiadomości grupować po dacie
- Między grupami wstawić separator: "Dzisiaj", "Wczoraj", "12 marca 2026"
- Styl: delikatna linia z datą pośrodku (jak w Slack/iMessage)

---

## Etap C4: Optimistic message rendering
**Ryzyko: NISKIE-ŚREDNIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/chat/_components/ChatClient.tsx`

Problem: Po wysłaniu wiadomości jest 1-2s luki — input wyczyszczony ale wiadomość nie pojawia się w wątku aż serwer potwierdzi.

Zmiana:
- Po `handleSend` natychmiast dodać wiadomość do `threadMessages` z tymczasowym ID
- Oznaczyć ją jako "sending" (delikatna opacity)
- Po potwierdzeniu serwera — zastąpić prawdziwym ID
- Przy błędzie — usunąć i przywrócić input

---

## Etap C5: Textarea zamiast input + lepszy loading
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/chat/_components/ChatClient.tsx`

Problemy:
- `<input>` nie obsługuje wielolinijkowych wiadomości
- Loading "Wczytywanie..." to gołoy tekst

Zmiany:
- Zamienić `<input>` na `<textarea>` z auto-resize (1-4 linii)
- Enter wysyła, Shift+Enter nowa linia
- Loading: zamienić tekst na skeleton lub spinner z kontenerem

---

## Etap C6: Limit 200 wiadomości — paginacja lub info
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/chat/_components/ChatClient.tsx` + `lib/actions/messages.ts`

Problem: `.limit(200)` obcina historię bez informacji.

Zmiana minimalna:
- Jeśli `threadMessages.length >= 200` — na górze wątku pokazać info "Wyświetlono ostatnie 200 wiadomości"

Zmiana docelowa (osobny etap):
- Przycisk "Załaduj starsze" ładujący kolejne 200 z offsetem

---

## Podsumowanie etapów Czat

| Etap | Opis | Ryzyko |
|------|------|--------|
| C1 | Visibility check + 15s polling | Niskie |
| C2 | Error handling + race condition guard | Niskie |
| C3 | Separatory dat w wiadomościach | Niskie |
| C4 | Optimistic message rendering | Niskie-Średnie |
| C5 | Textarea + lepszy loading | Niskie |
| C6 | Limit 200 wiadomości — info/paginacja | Niskie |

---
---

# Plan poprawek sekcji Faktury

Status: **Do wdrożenia**
Ostatnia aktualizacja: 2026-03-18

Dotyczy:
- **Strona** `/coach/invoices` (`InvoicesClient.tsx`)
- **Modale** `InvoiceCreateModal.tsx`, `InvoiceEditModal.tsx`
- **Dropdown** `components/ui/InvoiceStatusDropdown.tsx`
- **Server Component** `app/coach/invoices/page.tsx`

---

## Etap I1: KPI reagujące na filtry
**Ryzyko: NISKIE** | 1 plik | Status: **Już naprawione** ✅

Plik: `app/coach/invoices/_components/InvoicesClient.tsx`

`totals` useMemo już używa `filtered` (L176). Naprawione wcześniej.

---

## Etap I2: Fix reset stanu modali
**Ryzyko: NISKIE** | 2 pliki | Status: **Do zrobienia**

Pliki: `InvoiceEditModal.tsx`, `InvoiceCreateModal.tsx`

Problemy:
- Edit modal: `useState(initialValues)` nie resetuje się gdy otworzymy inną fakturę (React nie resetuje useState przy zmianie props). Trener klika "Edytuj" na fakturze A → zamyka → klika na B → widzi dane A.
- Create modal: zamknięcie bez zapisu nie resetuje formularza. Ponowne otwarcie pokazuje stare dane.

Zmiany:
- Edit modal: dodać `key={editingInvoice?.id}` na `<InvoiceEditModal>` w `InvoicesClient`
- Create modal: resetować `form` w `handleClose`

---

## Etap I3: Empty state z CTA + brak zawodników
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/invoices/_components/InvoicesClient.tsx`

Problemy:
- Pusty stan w tabeli to gołowy tekst "Brak faktur" w `<td>` — brak ikony, brak CTA
- Gdy `athletes.length === 0`, przycisk "+ Nowa faktura" otwiera modal z pustym selectem

Zmiany:
- Zamienić empty state na `EmptyState` z ikoną 🧾 i CTA "Utwórz pierwszą fakturę"
- Gdy brak zawodników: wyłączyć przycisk "+ Nowa faktura" lub pokazać info "Dodaj zawodnika żeby wystawiać faktury"

---

## Etap I4: Nagłówek kolumny + filtr Anulowane
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/invoices/_components/InvoicesClient.tsx`

Problemy:
- Nagłówek "Termin / stan" jest mylący — "stan" sugeruje status faktury ale status jest w osobnej kolumnie
- Brak filtra "Anulowane" — anulowane faktury widać tylko w "Wszystkie"

Zmiany:
- Zmienić nagłówek na "Termin płatności"
- Dodać filtr "Anulowane" do `filters` i `filterCounts`

---

## Etap I5: Suma widocznych faktur pod tabelą
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/invoices/_components/InvoicesClient.tsx`

Problem: Trener filtruje po zawodniku i chce wiedzieć łączną kwotę widocznych faktur. KPI na górze to ma, ale po filtrowaniu oko wędruje do tabeli — brak sumy pod nią.

Zmiana: Pod tabelą dodać kompaktowy wiersz: "Wyświetlono X faktur na łącznie Y zł"

---

## Etap I6: Obsługa brakującego załącznika
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/invoices/_components/InvoicesClient.tsx`

Problem: `handleDownloadAttachment` otwiera `window.open(url)` bez walidacji. Gdy plik usunięty ze storage — pusta strona.

Zmiana: Sprawdzić `result.url` i pokazać `showStatus('error', 'Załącznik nie został znaleziony.')` zamiast otwierać puste okno.

---

## Podsumowanie etapów Faktury

| Etap | Opis | Ryzyko | Status |
|------|------|--------|--------|
| I1 | KPI reagujące na filtry | Niskie | ✅ Już naprawione |
| I2 | Fix reset stanu modali | Niskie | Do zrobienia |
| I3 | Empty state z CTA + brak zawodników | Niskie | Do zrobienia |
| I4 | Nagłówek kolumny + filtr Anulowane | Niskie | Do zrobienia |
| I5 | Suma widocznych faktur pod tabelą | Niskie | Do zrobienia |
| I6 | Obsługa brakującego załącznika | Niskie | Do zrobienia |

---
---

# Plan poprawek sekcji Planner

Status: **Do wdrożenia**
Ostatnia aktualizacja: 2026-03-18

Dotyczy: `/coach/planner` (`PlannerShell.tsx`)

---

## Etap PL1: Disabled select podczas ładowania
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/planner/_components/PlannerShell.tsx`

Problem: Dropdown zawodnika nie jest disabled gdy PlanTab ładuje dane — szybkie przełączanie = race conditions.

Zmiana: Krótki debounce/disabled na select po zmianie zawodnika.

---

## Podsumowanie etapów Planner

| Etap | Opis | Ryzyko |
|------|------|--------|
| PL1 | Disabled select podczas ładowania | Niskie |

---
---

# Plan poprawek sekcji Ustawienia

Status: **Do wdrożenia**
Ostatnia aktualizacja: 2026-03-18

Dotyczy:
- **Strona** `/coach/settings` (`SettingsClient.tsx`, `SettingsArchiveTab.tsx`)
- **Pakiety** `app/coach/packages/_components/PackagesClient.tsx`
- **Server Actions** `lib/actions/profile.ts`

---

## Etap S1: Disabled upload + progress avatara
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/settings/_components/SettingsClient.tsx`

Problem: Podczas uploadu avatara formularz pozostaje aktywny, brak wizualnego feedbacku.

Zmiany:
- Disable emoji grid + file input gdy `avatarPending` (pointer-events-none + opacity)
- Opacity na podglądzie avatara podczas zapisu

---

## Etap S2: Auto-dismiss success messages
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/settings/_components/SettingsClient.tsx`

Problem: `✓ Zapisano`, `✓ Hasło zostało zmienione`, `✓ Wysłano link weryfikacyjny` — zostają na stałe. Trener wraca po godzinie i wciąż widzi zielony komunikat.

Zmiana: Dodać `useEffect` z `setTimeout` który czyści `nameState`/`emailState`/`passState`/`avatarState` po 4 sekundach. Alternatywa: nie czyścić stanu action, ale dodać lokalny `showSuccess` z auto-dismiss.

---

## Etap S3: Deduplikacja typu ArchivedAthlete + cleanup
**Ryzyko: NISKIE** | 2 pliki | Status: **Do zrobienia**

Pliki: `SettingsClient.tsx`, `SettingsArchiveTab.tsx`

Problem: `ArchivedAthlete` zdefiniowany identycznie w obu plikach. SettingsArchiveTab powinien importować z SettingsClient (który już go exportuje).

Zmiana: W `SettingsArchiveTab` usunąć lokalny typ, dodać `import type { ArchivedAthlete } from './SettingsClient'`.

---

## Etap S4: Archiwum — responsywność + confirm przywracania
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/settings/_components/SettingsArchiveTab.tsx`

Problemy:
- Tabela 5-kolumnowa bez `overflow-x-auto` — na mobile się nie mieści
- "Przywróć" jest natychmiastowe bez confirmacji (niespójne z archiwizacją w profilu, która wymaga potwierdzenia)

Zmiany:
- Dodać `overflow-x-auto` + `min-w-[600px]` na tabeli
- Dodać confirm: "Czy na pewno przywrócić zawodnika X do aktywnej bazy?" przed przywróceniem

---

## Etap S5: Kompresja sekcji avatara + karta Plan
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/settings/_components/SettingsClient.tsx`

Problemy:
- Sekcja avatara (emoji grid 24szt + upload + podgląd + save) zajmuje ~300px — połowa ekranu na laptopie 13"
- Karta "Plan info" (imię + email + badge planu + "skontaktuj się") jest czysto informacyjna, zero interaktywności

Zmiany:
- Avatar: zmniejszyć emoji grid do 2 rzędów (12 emoji) z opcją "Pokaż więcej" rozwijającą resztę
- Karta Plan: zwinąć do jednej linii w istniejącej karcie imienia — np. pod inputem imienia: `Plan: Starter · email@example.com` z mniejszym fontem. Usunąć osobną kartę.

---

## Etap S6: Walidacja ceny pakietu
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/packages/_components/PackagesClient.tsx`

Problem: Formularz pakietu nie waliduje ceny — trener może ustawić 0 zł albo ujemną wartość.

Zmiana: Dodać `min="0.01"` na input ceny + walidacja po stronie klienta przed submit.

---

## Podsumowanie etapów Ustawienia

| Etap | Opis | Ryzyko | Status |
|------|------|--------|--------|
| S1 | Disabled upload + progress avatara | Niskie | Do zrobienia |
| S2 | Auto-dismiss success messages | Niskie | Do zrobienia |
| S3 | Deduplikacja typu ArchivedAthlete | Niskie | Do zrobienia |
| S4 | Archiwum responsywność + confirm | Niskie | Do zrobienia |
| S5 | Kompresja avatara + zwinięcie karty Plan | Niskie | Do zrobienia |
| S6 | Walidacja ceny pakietu | Niskie | Do zrobienia |

### Poza zakresem (przyszłość)
- Ustawienia powiadomień (push/email preferences)
- Motyw (dark/light) w ustawieniach (teraz jest w topbar)
- Grupowanie sekcji profilu (Dane konta / Bezpieczeństwo)
- Opcja usunięcia konta (RODO)
- Eksport danych (backup)
- Wylogowanie ze wszystkich urządzeń

---
---

# Plan poprawek sekcji Pomoc

Status: **Do wdrożenia**
Ostatnia aktualizacja: 2026-03-18

Dotyczy:
- **Strona** `/coach/help` (`app/coach/help/page.tsx`) — 566 linii, Client Component
- **API** `/api/contact` (Resend email)

---

## Etap H1: Naprawić backticki + usunąć duplikat filtra
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/help/page.tsx`

Problemy:
- Linia 342: tekst `bezpośrednio na \`kontakt@strefa-trenera.pl\`` renderuje backticki jako tekst zamiast formatowania
- Kategorie FAQ wyświetlane w dwóch miejscach jednocześnie: pills (L459-487) I select (L445-455). Na szerokim ekranie widać oba — redundancja

Zmiany:
- Zamienić backticki na `<strong>` lub `<a href="mailto:...">`
- Usunąć `<select>` kategorii — zostawić pills + search input

---

## Etap H2: Pre-fill formularza + przeorganizowanie sekcji
**Ryzyko: NISKIE-ŚREDNIE** | 2 pliki | Status: **Do zrobienia**

Pliki: `app/coach/help/page.tsx`, `app/coach/help/layout.tsx`

Problemy:
- Formularz kontaktowy nie pre-filluje emaila i imienia trenera (mimo że są znane z sesji)
- "Szybki kontakt" (email + WhatsApp) i "Napisz do nas" (formularz) to dwa sposoby dotarcia do tego samego celu — redundancja
- FAQ zaczyna się dopiero po ~800px scrollu

Zmiany:
- Przekazać `email` i `name` z Server Component do formularza (wymaga wydzielenia formularza do Client Component, reszta może być Server)
- Połączyć "Szybki kontakt" i formularz w jedną sekcję — formularz jako collapsible pod email/WhatsApp
- Zmienić kolejność: Szybkie skróty → FAQ → Kontakt (FAQ wyżej, kontakt niżej)

---

## Etap H3: Empty state FAQ + rozbicie pliku
**Ryzyko: NISKIE** | 1+ plików | Status: **Do zrobienia**

Plik: `app/coach/help/page.tsx`

Problemy:
- Empty state FAQ (L489-495) to `Card` z tekstem — brak ikony, niespójne z `EmptyState`
- 566 linii w jednym pliku — łamie wzorzec dekompozycji

Zmiany:
- Zamienić empty state na `EmptyState` z ikoną 🔎
- Rozważyć rozbicie na komponenty: `_components/HelpFaq.tsx`, `_components/HelpContact.tsx`, `_components/HelpQuickActions.tsx`
- Przenieść FAQ data do osobnego pliku `_components/faq-data.ts`

---

## Etap H4: Hardcoded dane kontaktowe
**Ryzyko: NISKIE** | 2 pliki | Status: **Do zrobienia**

Pliki: `app/coach/help/page.tsx`, `lib/constants.ts`

Problem: Email (`kontakt@strefa-trenera.pl`) i numer telefonu (`48662110067`) hardcoded w JSX w wielu miejscach.

Zmiana: Przenieść do `lib/constants.ts`:
```typescript
export const SUPPORT_EMAIL = 'kontakt@strefa-trenera.pl'
export const SUPPORT_PHONE = '662-110-067'
export const SUPPORT_WHATSAPP = 'https://wa.me/48662110067'
```

---

## Podsumowanie etapów Pomoc

| Etap | Opis | Ryzyko | Status |
|------|------|--------|--------|
| H1 | Backticki + duplikat filtra | Niskie | Do zrobienia |
| H2 | Pre-fill formularza + reorganizacja sekcji | Niskie-Średnie | Do zrobienia |
| H3 | Empty state FAQ + rozbicie pliku | Niskie | Do zrobienia |
| H4 | Hardcoded dane kontaktowe → constants | Niskie | Do zrobienia |

### Poza zakresem (przyszłość)
- Wysyłanie głosów "Czy to pomogło?" na serwer (analytics)
- Konwersja na Server Component + wydzielone Client Components
- Changelog / what's new
- Keyboard shortcuts reference

---
---

# Plan poprawek sekcji Lista zawodników

Status: **Do wdrożenia**
Ostatnia aktualizacja: 2026-03-18

Dotyczy:
- **Server Component** `app/coach/athletes/page.tsx` (262 linii)
- **Client Component** `app/coach/athletes/_components/AthletesClient.tsx` (559 linii)
- **Podkomponenty** `AthletesTable.tsx`, `AthletesFilters.tsx`, `AthletesToolbar.tsx`, `AthletesStatusMenu.tsx`, `AthletesActionMenu.tsx`, `AddAthleteModal.tsx`, `StatusEditorModal.tsx`

---

## Etap L1: Info o blokadzie drag-reorder + toast po eksporcie
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/athletes/_components/AthletesClient.tsx`

Problemy:
- Drag-reorder nie działa gdy sort jest aktywny — ale trener nie wie dlaczego. Brak info.
- Eksport XML/Excel nie daje feedbacku po pobraniu — trener nie jest pewien czy plik się pobrał.

Zmiany:
- Gdy `sortKey` jest aktywny — wyłączyć drag affordance (np. ukryć grip handle) + pokazać info "Sortowanie wyłącza przeciąganie. Wyłącz sortowanie żeby zmieniać kolejność."
- Po `exportDisplayedAthletes` — `showStatus('success', 'Wyeksportowano X zawodników.')`

---

## Etap L2: Responsywność tabeli + filtr statusu collapse
**Ryzyko: NISKIE** | 2 pliki | Status: **Do zrobienia**

Pliki: `AthletesTable.tsx`, `AthletesFilters.tsx`

Problemy:
- Tabela nie ma `overflow-x-auto` — na mobile kolumny się zgniatają
- Filtr statusu (pills) przy 6+ custom statusach zawija się na wiele wierszy. Brak collapse do select.

Zmiany:
- Tabela: dodać `overflow-x-auto` na kontenerze + `min-w-[900px]` na `<table>`
- Filtry statusu: użyć tego samego wzorca co faktury (ResizeObserver → pills/select)

---

## Etap L3: Quick stats nad tabelą
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/athletes/_components/AthletesClient.tsx`

Problem: Brak zagregowanego podsumowania — trener nie widzi "ilu zawodników wymaga uwagi" bez ręcznego przeglądania tabeli.

Zmiana: Kompaktowy wiersz nad tabelą (pod filtrami):
```
42 zawodników · 5 z alertem · 3 bez planu · 2 nieopłacone
```
Obliczane z `displayed`, `signalMap`, `nextSessionMap`, `unpaidInvoiceSet`.

---

## Etap L4: Wydzielenie data-processing z page.tsx
**Ryzyko: NISKIE** | 2 pliki | Status: **Do zrobienia**

Pliki: `app/coach/athletes/page.tsx`, nowy `lib/athlete-list-metrics.ts`

Problem: `page.tsx` ma 262 linii, z czego ~140 to budowanie map metryk (fallback gdy RPC nie działa). To czysta logika data-processing, nie rendering.

Zmiana: Wydzielić fallback data-processing do `lib/athlete-list-metrics.ts`:
```typescript
export function buildAthleteMetricMaps(data: {...}): AthleteMetricMaps { ... }
```
`page.tsx` staje się krótszy i czytelniejszy.

---

## Podsumowanie etapów Lista zawodników

| Etap | Opis | Ryzyko | Status |
|------|------|--------|--------|
| L1 | Info drag-reorder + toast po eksporcie | Niskie | Do zrobienia |
| L2 | Responsywność tabeli + filtr collapse | Niskie | Do zrobienia |
| L3 | Quick stats nad tabelą | Niskie | Do zrobienia |
| L4 | Wydzielenie data-processing z page.tsx | Niskie | Do zrobienia |

### Poza zakresem (przyszłość)
- Prop drilling → Context lub view model dla AthletesTable
- Bulk actions (zaznaczanie + masowe operacje)
- Widok kartkowy (mobile-friendly alternative)
- Paginacja
- Filtr "Nowi" (ostatni tydzień/miesiąc)

---
---

# Plan poprawek Sidebar + Topbar + Shell

Status: **Do wdrożenia**
Ostatnia aktualizacja: 2026-03-18

Dotyczy:
- **Sidebar** `components/coach/CoachSidebar.tsx`
- **Topbar** `components/coach/CoachTopbar.tsx`
- **NotificationBell** `components/coach/NotificationBell.tsx`
- **Shell** `app/coach/_components/CoachShell.tsx`
- **Layout** `app/coach/layout.tsx`

---

## Etap N1: Sidebar — remember collapsed + deduplikacja planLabel
**Ryzyko: NISKIE** | 2 pliki | Status: **Do zrobienia**

Pliki: `CoachShell.tsx`, `CoachSidebar.tsx`

Problemy:
- Sidebar zawsze rozwinięty po odświeżeniu — `useState(false)` bez persistencji
- `planLabel()` zduplikowana w `CoachSidebar.tsx` i `SettingsClient.tsx`

Zmiany:
- Zapisywać stan collapsed w localStorage, odczytywać w `useState` initializer (hydration-safe: default false na serwerze)
- Przenieść `planLabel()` do `lib/utils.ts`, importować w obu plikach

---

## Etap N2: NotificationBell — link do kontekstu + error handling
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `components/coach/NotificationBell.tsx`

Problemy:
- Kliknięcie powiadomienia zawsze kieruje na `/coach/feedback` — nie na profil zawodnika ani konkretny feedback
- `getUnreadNotifications().then(setNotifications)` bez `.catch()` — cicha awaria
- Fetch tylko na mount — nie odświeża się (nowe feedbacki nie aktualizują dzwonka)

Zmiany:
- Link z powiadomienia → `/coach/athletes/{athlete_id}?tab=feedback` (wymaga dodania `athlete_id` do danych powiadomienia)
- Dodać `.catch(() => [])` na fetch
- Dodać polling co 30-60s z visibility check (ten sam wzorzec co chat)

---

## Etap N3: Mobile sidebar — hamburger + overlay
**Ryzyko: ŚREDNIE** | 2 pliki | Status: **Do zrobienia**

Pliki: `CoachShell.tsx`, `CoachSidebar.tsx`

Problem: Na mobile sidebar zajmuje 64-256px, treść jest ściśnięta. Brak hamburger menu.

Zmiany:
- Na ekranach `< md` (768px): sidebar domyślnie ukryty
- Hamburger button w topbar (widoczny tylko na mobile)
- Sidebar otwiera się jako overlay z backdrop (slide-in od lewej)
- Kliknięcie linku zamyka sidebar
- Kliknięcie backdrop zamyka sidebar

---

## Etap N4: Unread badges na sidebar linkach
**Ryzyko: NISKIE-ŚREDNIE** | 2 pliki | Status: **Do zrobienia**

Pliki: `CoachSidebar.tsx`, `app/coach/layout.tsx`

Problem: Sidebar pokazuje "Feedback" i "Czat" bez liczby nieprzeczytanych. Trener nie wie że ma nowe wiadomości bez wchodzenia na stronę.

Zmiany:
- `layout.tsx` fetchuje unread feedback count + unread messages count i przekazuje do `CoachShell` → `CoachSidebar`
- Sidebar wyświetla badge z liczbą przy "Feedback" i "Czat" (pomarańczowe kółko jak w NotificationBell)

---

## Etap N5: Zmniejszenie pb-64 + hover na collapse button
**Ryzyko: NISKIE** | 2 pliki | Status: **Do zrobienia**

Pliki: `CoachShell.tsx`, `CoachSidebar.tsx`

Problemy:
- `pb-64` (256px padding-bottom) na main — zbyt dużo pustego miejsca na dole
- Przycisk collapse ← → jest 7x7, brak hover state, trudno trafić na touch

Zmiany:
- Zmniejszyć `pb-64` do `pb-20` (80px) — wystarczająco żeby nie obcinać sticky elementów
- Powiększyć przycisk collapse do `w-8 h-8`, dodać hover background

---

## Podsumowanie etapów Sidebar + Topbar

| Etap | Opis | Ryzyko | Status |
|------|------|--------|--------|
| N1 | Sidebar remember collapsed + deduplikacja planLabel | Niskie | Do zrobienia |
| N2 | NotificationBell — link do kontekstu + error + polling | Niskie | Do zrobienia |
| N3 | Mobile sidebar — hamburger + overlay | Średnie | Do zrobienia |
| N4 | Unread badges na sidebar linkach | Niskie-Średnie | Do zrobienia |
| N5 | pb-64 zmniejszenie + hover na collapse | Niskie | Do zrobienia |

### Poza zakresem (przyszłość)
- Breadcrumbs w topbar
- Global search (Cmd+K)
- Unifikacja CoachAvatarEl z Avatar.tsx
- Topbar theme toggle animacja

---
---

# Plan poprawek sekcji Dashboard (drobne)

Status: **Do wdrożenia**
Ostatnia aktualizacja: 2026-03-18

Uwaga: Główny plan dashboardu jest na górze tego pliku (Etapy 1-8). Tu są tylko drobne poprawki wykryte w finalnym audycie.

---

## Etap D1: KPI cursor-pointer + affordance
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/dashboard/_components/DashboardClient.tsx`

Problem: Karty KPI są linkami ale nie mają `cursor-pointer` ani hover effect — nie wyglądają klikalnie.

Zmiana: `cursor-pointer` + delikatny hover effect.

---

## Podsumowanie etapów Dashboard (drobne)

| Etap | Opis | Ryzyko |
|------|------|--------|
| D1 | KPI cursor-pointer + affordance | Niskie |

---
---

# Plan poprawek sekcji Analityka

Status: **Do wdrożenia**
Ostatnia aktualizacja: 2026-03-18

Dotyczy:
- **Strona** `/coach/analytics` (`app/coach/analytics/page.tsx`)
- Cały plik to Server Component (312 linii, brak interaktywności)

---

## Etap A1: Deduplikacja helperów + import calendar utils
**Ryzyko: NISKIE** | 2 pliki | Status: **Do zrobienia**

Pliki: `app/coach/analytics/page.tsx`, `lib/utils.ts` lub nowy `lib/invoice-helpers.ts`

Problemy:
- `isInvoiceOverdue` i `isInvoicePending` zduplikowane — te same funkcje istnieją w `InvoicesClient.tsx`
- `prevYM` obliczany inline (L54-57) — identyczny `shiftMonth` jest w `lib/calendar.ts`

Zmiany:
- Wydzielić `isInvoiceOverdue` / `isInvoicePending` do wspólnego modułu (np. `lib/invoice-helpers.ts`)
- Zaimportować `shiftMonth` z `lib/calendar.ts` zamiast inline math

---

## Etap A2: Limity na tabele + empty state
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/analytics/page.tsx`

Problemy:
- Tabela miesięczna renderuje PEŁNĄ historię bez limitu (może być 60+ wierszy)
- Top zawodnicy renderuje WSZYSTKICH z fakturami (może być 50+ wierszy)
- Brak ogólnego empty state dla nowego trenera (widzi 4 zera i pusty ekran)

Zmiany:
- Tabela miesięczna: domyślnie 12 ostatnich, przycisk "Pokaż pełną historię"
- Top zawodnicy: domyślnie top 10, przycisk "Pokaż wszystkich"
- Gdy brak faktur i brak zawodników: dodać `EmptyState` z komunikatem "Analityka pojawi się gdy zaczniesz wystawiać faktury"

---

## Etap A3: Wykres — oś Y + linie siatki
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/analytics/page.tsx`

Problem: Wykres słupkowy nie ma osi Y ani linii siatki. Przy dużych różnicach kwot (500 zł vs 5000 zł) mały słupek wygląda jak zero.

Zmiany:
- Dodać 3-4 horyzontalnych linii siatki z wartościami (0, 25%, 50%, 75%, max)
- Linie delikatne, `var(--border)` z wartością po lewej stronie
- Nie wymaga biblioteki — czyste CSS + pozycjonowanie absolutne

---

## Etap A4: Prosty wybór zakresu dat
**Ryzyko: ŚREDNIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/analytics/page.tsx` → wymaga konwersji do Client Component lub wydzielenia interaktywnej części

Problem: "Ostatnie 12 miesięcy" jest hardcoded. Trener nie może zobaczyć wcześniejszych danych ani wybrać roku/kwartału.

Zmiana:
- Dodać prosty select/pills: `Ostatnie 12 mies.` / `Rok 2026` / `Rok 2025` / `Wszystko`
- Wymaga wydzielenia interaktywnej części do Client Component (filtr + wykres + tabela)
- Server Component fetchuje pełne dane, Client Component filtruje po zakresie

Uwaga: To większa zmiana architektoniczna — rozważyć jako osobny sprint.

---

## Etap A5: Suma pod tabelą top zawodników
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/analytics/page.tsx`

Problem: Tabela top zawodników nie ma wiersza "Razem" w footer (tabela miesięczna go ma).

Zmiana: Dodać `<tfoot>` z sumą przychodu i liczbą faktur.

---

## Podsumowanie etapów Analityka

| Etap | Opis | Ryzyko | Status |
|------|------|--------|--------|
| A1 | Deduplikacja helperów + calendar import | Niskie | Do zrobienia |
| A2 | Limity na tabele + empty state | Niskie | Do zrobienia |
| A3 | Wykres — oś Y + linie siatki | Niskie | Do zrobienia |
| A4 | Wybór zakresu dat (wymaga Client Component) | Średnie | Do zrobienia |
| A5 | Suma pod tabelą top zawodników | Niskie | Do zrobienia |

### Poza zakresem (przyszłość)
- Analityka treningowa (km, sesje, compliance, feedback trend)
- Drill-down (kliknięcie → filtrowanie faktur)
- Porównanie rok do roku (Y-o-Y)
- Wskaźnik churn/retencji zawodników
- Eksport CSV/PDF

---
---

# Plan poprawek Login / Register

Status: **Do wdrożenia**
Ostatnia aktualizacja: 2026-03-18

Dotyczy:
- **Login** `app/login/page.tsx`
- **Register** `app/register/page.tsx`
- **Server Actions** `lib/actions/auth.ts`

---

## Etap LR1: "Zapomniałem hasła" + sanityzacja email
**Ryzyko: NISKIE** | 2 pliki | Status: **Do zrobienia**

Pliki: `app/login/page.tsx`, `lib/actions/auth.ts`

Problemy:
- Brak linku "Zapomniałem hasła" — trener nie ma jak odzyskać konta. Krytyczny brak w produkcji.
- Email nie jest trimowany/lowercasowany — spacje na końcu lub wielkie litery powodują "Invalid login credentials"

Zmiany:
- Login: dodać link "Nie pamiętam hasła" pod formularzem → otwiera prosty formularz z emailem
- Nowa server action `resetPassword` wywołująca `supabase.auth.resetPasswordForEmail(email)`
- Success state: "Link do zresetowania hasła został wysłany na Twój email"
- W `login` i `register` actions: `email.trim().toLowerCase()` przed wysłaniem

---

## Etap LR2: Focus state + placeholdery + hover
**Ryzyko: NISKIE** | 2 pliki | Status: **Do zrobienia**

Pliki: `app/login/page.tsx`, `app/register/page.tsx`

Problemy:
- `outline: 'none'` na inputach — brak widocznego focus ring (accessibility)
- Login nie ma placeholderów (register ma)
- Przycisk submit bez hover state

Zmiany:
- Usunąć `outline: 'none'`, dodać focus ring: `outline: '2px solid #FF5C1B'` lub `ring-2 ring-orange-500`
- Login: dodać placeholdery `"twoj@email.com"` i `"Twoje hasło"`
- Przycisk: dodać hover opacity

---

## Etap LR3: "Powtórz hasło" w rejestracji + email confirmation
**Ryzyko: NISKIE** | 2 pliki | Status: **Do zrobienia**

Pliki: `app/register/page.tsx`, `lib/actions/auth.ts`

Problemy:
- Register ma jedno pole hasła bez potwierdzenia — literówka = zablokowane konto
- Po `signUp` od razu redirect do `/coach/athletes` — jeśli Supabase wymaga email confirmation, trener trafia na stronę z błędem auth

Zmiany:
- Dodać pole "Powtórz hasło" + walidacja `password === confirm` w action
- Po `signUp`: sprawdzić czy `data.user?.confirmed_at` istnieje. Jeśli nie — pokazać info "Sprawdź swoją skrzynkę email" zamiast redirect

---

## Etap LR4: Inline styles → Tailwind + wspólny layout
**Ryzyko: NISKIE** | 2 pliki | Status: **Do zrobienia**

Pliki: `app/login/page.tsx`, `app/register/page.tsx`

Problemy:
- Wyłącznie inline `style={{...}}` — niespójne z resztą aplikacji (Tailwind + CSS vars)
- ~80% kodu zduplikowane między login i register (layout, logo, card, input styles)
- Border-radius `10px` zamiast `rounded-xl` (12px) jak w reszcie

Zmiany:
- Zamienić inline styles na Tailwind classes + `INPUT_STYLE`
- Rozważyć wydzielenie wspólnego `AuthLayout` komponentu (logo + card wrapper + bottom link)

---

## Podsumowanie etapów Login / Register

| Etap | Opis | Ryzyko | Status |
|------|------|--------|--------|
| LR1 | "Zapomniałem hasła" + sanityzacja email | Niskie | Do zrobienia |
| LR2 | Focus state + placeholdery + hover | Niskie | Do zrobienia |
| LR3 | "Powtórz hasło" + email confirmation handling | Niskie | Do zrobienia |
| LR4 | Inline styles → Tailwind + wspólny layout | Niskie | Do zrobienia |

### Poza zakresem (przyszłość)
- Social login (Google)
- Toggle "Pokaż hasło"
- Terms/privacy checkbox przy rejestracji
- Rate limiting na formularzu

---
---

# Plan poprawek Panelu zawodnika

Status: **Do wdrożenia**
Ostatnia aktualizacja: 2026-03-18

Dotyczy:
- **Strony** `/u/[slug]`, `/u/[slug]/plan`, `/u/[slug]/history`, `/u/[slug]/chat`
- **Komponenty** `AthleteTodayPage.tsx`, `AthletePlanPage.tsx`, `AthleteHistoryPage.tsx`, `AthleteChatPage.tsx`, `AthleteBottomNav.tsx`, `FeedbackModal.tsx`, `VoiceRecorder.tsx`

---

## Etap Z1: Czat zawodnika — visibility check + error state
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/u/[slug]/_components/AthleteChatPage.tsx`

Problemy:
- Polling `router.refresh()` co 5s nawet gdy zakładka w tle — drenaż baterii na telefonie
- Brak error state — jeśli `sendAthleteMessage` failuje, input wyczyszczony bez komunikatu

Zmiany:
- Visibility check + wydłużenie do 15s (ten sam wzorzec co coach chat C1)
- Dodać `sendError` state + komunikat "Nie udało się wysłać" + przywrócenie treści inputa

---

## Etap Z2: Deduplikacja helperów — import z lib
**Ryzyko: NISKIE** | 3 pliki | Status: **Do zrobienia**

Pliki: `AthleteTodayPage.tsx`, `AthletePlanPage.tsx`, `AthleteHistoryPage.tsx`

Problem: `shiftMonth` zduplikowany 3×, `getMonthCalendar` zduplikowany 1×, `shiftDate` zduplikowany 1× — identyczne z `lib/calendar.ts` i `lib/date.ts`.

Zmiany:
- `shiftMonth`, `getMonthCalendar` → import z `@/lib/calendar`
- `shiftDate` → import `addDaysToBusinessDate` z `@/lib/date`
- `monthLabel` w HistoryPage → import z `@/lib/calendar`
- Usunąć lokalne definicje

---

## Etap Z3: Wspólny AthleteHeader + bottom nav cleanup
**Ryzyko: NISKIE** | 5 plików | Status: **Do zrobienia**

Pliki: wszystkie 4 strony zawodnika + nowy `AthleteHeader.tsx`

Problemy:
- Każda strona powtarza ten sam header pattern (name + title + border)
- Bottom nav ma 6 elementów (4 taby + theme + wyloguj) — za dużo na mały ekran

Zmiany:
- Wydzielić `AthleteHeader` komponent (name, title, opcjonalny subtitle)
- Bottom nav: przenieść theme toggle i wyloguj do menu "⋯" (3 kropki) — zostawić 5 elementów: 4 taby + menu

---

## Etap Z4: Historia — Strava sync feedback + month helpers
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/u/[slug]/_components/AthleteHistoryPage.tsx`

Problemy:
- `handleSync` nie ma wizualnego progress poza zmianą tekstu przycisku
- `formatPace`, `formatDuration` inline — mogłyby być w `lib/utils.ts`

Zmiany:
- Dodać spinner/loading indicator podczas sync
- Rozważyć przeniesienie `formatPace`/`formatDuration` do `lib/utils.ts` (jeśli używane gdzieś indziej)

---

## Etap Z5: FeedbackModal — alert() → UI + import fix
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/u/[slug]/_components/FeedbackModal.tsx`

Problemy:
- L116: `alert('Błąd zapisu: ' + result.error)` — natywny `alert()`, jedyny w całej aplikacji. Na mobile wygląda fatalnie.
- L20: `import { INPUT_STYLE }` po bloku `const` — import powinien być na górze pliku.

Zmiany:
- Zamienić `alert()` na `useState` error state z komunikatem w UI (czerwony box jak w reszcie app)
- Przenieść import na górę pliku

---

## Etap Z6: Coach reply duplikat + desktop padding
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/u/[slug]/_components/AthleteTodayPage.tsx`

Problemy:
- Coach reply (odpowiedź trenera) wyświetlany 2× na desktop: L244-249 w głównej sekcji + L298-303 w sidebarze. Na desktop zawodnik widzi to samo dwa razy.
- L154: `paddingBottom: '90px'` na głównym kontenerze — na desktop bottom nav nie jest potrzebny, padding jest zbędny.

Zmiany:
- Coach reply w głównej sekcji: dodać `lg:hidden` — widoczny tylko na mobile. Na desktop widoczny tylko w sidebarze.
- Padding bottom: `pb-[90px] lg:pb-0` — usunąć na desktop.

---

## Etap Z7: Plan zawodnika — custom types + feedback w miesiącu
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/u/[slug]/_components/AthletePlanPage.tsx`

Problemy:
- L9, L219-221: Legenda używa `SESSION_TYPES` z constants (built-in: Easy, Interval, Tempo...). Jeśli trener dodał custom typy (np. "Pływanie"), zawodnik ich nie widzi w legendzie.
- Widok tygodnia (L148-164) pokazuje feedback pod sesjami. Widok miesiąca (L172-213) nie pokazuje feedbacku wcale.

Zmiany:
- Legenda: pobierać custom types trenera (wymaga przekazania z server component lub fetch)
- Widok miesiąca: dodać badge feedback (sygnał 🟢/🟡/🔴) przy dniu jeśli feedback istnieje

---

## Etap Z8: Historia — stats reagujące na miesiąc + czat separatory
**Ryzyko: NISKIE** | 2 pliki | Status: **Do zrobienia**

Pliki: `AthleteHistoryPage.tsx`, `AthleteChatPage.tsx`

Problemy:
- Historia L70-71: `totalKm`/`totalMin` liczone z WSZYSTKICH sesji. Trener wybiera miesiąc ale stats się nie zmieniają — mylące.
- Czat: brak separatorów dat (identycznie jak coach chat)
- Czat: `<input>` zamiast `<textarea>` (brak wielolinijkowych wiadomości)

Zmiany:
- Historia: dodać `monthKm`/`monthMin` obliczane z `monthSessions` — wyświetlać obok łącznych lub zamiast
- Czat: separatory dat "Dzisiaj", "Wczoraj", data (ten sam wzorzec co coach chat C3)
- Czat: `<textarea>` z auto-resize (ten sam wzorzec co coach chat C5)

---

## Podsumowanie etapów Panel zawodnika

| Etap | Opis | Ryzyko | Status |
|------|------|--------|--------|
| Z1 | Czat — visibility check + error state | Niskie | Do zrobienia |
| Z2 | Deduplikacja helperów — import z lib | Niskie | Do zrobienia |
| Z3 | Wspólny AthleteHeader + bottom nav cleanup | Niskie | Do zrobienia |
| Z4 | Historia — Strava sync feedback | Niskie | Do zrobienia |
| Z5 | FeedbackModal — alert() → UI + import fix | Niskie | Do zrobienia |
| Z6 | Coach reply duplikat + desktop padding | Niskie | Do zrobienia |
| Z7 | Plan — custom types + feedback w miesiącu | Niskie | Do zrobienia |
| Z8 | Historia stats per miesiąc + czat separatory/textarea | Niskie | Do zrobienia |

### Poza zakresem (przyszłość)
- Lazy-loading dalszych zakresów w planie
- Widok wyścigów dla zawodnika
- Profil zawodnika (readonly view swoich danych)
- Pull to refresh na mobile
- Feedback auto-save draft
- Powiadomienia o nowych sesjach
- Rozbicie `AthleteTodayPage` (326 linii) na mniejsze komponenty

---
---

# Plan poprawek Landing Page

Status: **Do wdrożenia**
Ostatnia aktualizacja: 2026-03-18

Dotyczy:
- **Strona** `app/page.tsx` (566 linii, Client Component)

---

## Etap LP1: Usunięcie wzmianek CRM + poprawka treści
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/page.tsx`

Problem: CRM usunięty z aplikacji, ale landing page obiecuje go w 4 miejscach. Testimonial Tomasza Wróbla mówi o "CRM z alertami retencji". Feature block "Biznes Trenerski" opisuje Kanban, auto-przypomnienia, alerty retencji — nic z tego nie istnieje.

Zmiany:
- Usunąć 4 wzmianki CRM (L130, L166, L220, L263)
- Przeredagować testimonial Tomasza Wróbla — usunąć wzmiankę o CRM, zamienić na feedback/planer
- Feature block "Biznes Trenerski" — zmienić opis na to co faktycznie jest: fakturowanie, analityka finansowa, profil zawodnika. Usunąć "Kanban", "auto-przypomnienia", "alerty retencji", "MRR, churn rate, LTV"
- Cennik Pro: usunąć "CRM z listą klientów", "Analityka retencji i alerty", "Auto-przypomnienia płatności", "Broadcast" — albo oznaczyć "Wkrótce"
- Cennik Studio: usunąć "Biały label", "Dostęp do API" — albo oznaczyć "Wkrótce"

---

## Etap LP2: Footer — martwe linki
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/page.tsx`

Problem: Footer ma 12 linków — wszystkie `href="#"`. "O nas", "Blog", "Kontakt", "Kariera", "Centrum pomocy", "Dokumentacja API", "Status systemu", "Polityka prywatności", "Regulamin" — zero prowadzi gdziekolwiek.

Zmiany:
- Usunąć linki, które nie będą istnieć (Blog, Kariera, Dokumentacja API, Status systemu)
- "Kontakt" → `mailto:kontakt@strefa-trenera.pl`
- "Centrum pomocy" → `/coach/help` (jeśli ma sens bez logowania, inaczej usunąć)
- "Polityka prywatności" i "Regulamin" → placeholder strony lub usunąć z dopiskiem "w przygotowaniu"

---

## Etap LP3: Hamburger menu na mobile
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/page.tsx`

Problem: Navbar linki (`hidden md:flex`) — na mobile widać tylko logo + 2 przyciski. Brak dostępu do sekcji Funkcje, Porównanie, Cennik, Jak zacząć.

Zmiana: Dodać hamburger button (widoczny na `md:hidden`) otwierający dropdown/overlay z linkami nawigacji.

---

## Etap LP4: Rozbicie pliku na komponenty
**Ryzyko: NISKIE** | 1+ plików | Status: **Do zrobienia**

Plik: `app/page.tsx`

Problem: 566 linii — mockupy (L476-564), SVG ikony (L377-426), helper components (L429-474) = ~200 linii helperów.

Zmiany:
- Wydzielić `_components/LandingMockups.tsx` (MockupDashboard, MockupFeedback, MockupAnalytics, MockupBar)
- Wydzielić `_components/LandingIcons.tsx` (IconChaos, IconPlanning, IconBusiness)
- Wydzielić `_components/LandingHelpers.tsx` (SectionBadge, GradText, PerspCard, FeatureBlock)
- `page.tsx` zostaje jako koordynator sekcji (~350 linii)

---

## Podsumowanie etapów Landing Page

| Etap | Opis | Ryzyko | Status |
|------|------|--------|--------|
| LP1 | Usunięcie CRM + poprawka treści/cennika | Niskie | Do zrobienia |
| LP2 | Footer — martwe linki | Niskie | Do zrobienia |
| LP3 | Hamburger menu na mobile | Niskie | Do zrobienia |
| LP4 | Rozbicie pliku na komponenty | Niskie | Do zrobienia |

### Poza zakresem (przyszłość)
- Konwersja na Server Component + Client Components (pricing toggle)
- CSS vars zamiast hardcoded kolorów (theme support)
- Data aktualizacji na comparison table
- Prawdziwe testimoniale
- Polityka prywatności / Regulamin jako osobne strony

---
---

# Bezpieczeństwo i infrastruktura techniczna

Status: **Do wdrożenia**
Ostatnia aktualizacja: 2026-03-19

Dotyczy:
- **API routes** `app/api/*`
- **Auth** `lib/athlete-auth.ts`, `app/api/athlete/verify/route.ts`
- **Strava OAuth** `app/api/strava/*`
- **Middleware** `proxy.ts`
- **Error boundaries** `app/error.tsx`, `app/coach/error.tsx`, `app/u/[slug]/error.tsx`
- **PWA** `app/manifest.ts`

---

## Etap SEC1: Invite token — sprawdzanie expiry + rotacja
**Ryzyko: WYSOKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/api/athlete/verify/route.ts`

Problemy:
- Zapytanie o zawodnika nie filtruje po `invite_token_expires_at` — wygasłe linki nadal działają
- Token nie jest rotowany po użyciu — ten sam link może być użyty wielokrotnie przez różne osoby

Zmiany:
- Dodać `.gt('invite_token_expires_at', new Date().toISOString())` do query
- Po udanej weryfikacji: generować nowy token i zapisywać w bazie (rotacja)
- Zwracać czytelny błąd "Link wygasł" zamiast generic "Nieprawidłowy link"

---

## Etap SEC2: Strava OAuth — atomic state consumption
**Ryzyko: WYSOKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/api/strava/callback/route.ts`

Problem: Check (`SELECT ... WHERE consumed_at IS NULL`) i update (`UPDATE ... SET consumed_at`) w dwóch osobnych zapytaniach — race condition pozwala na reużycie state.

Zmiana: Połączyć w jedną atomową operację:
```sql
UPDATE strava_oauth_states
SET consumed_at = NOW()
WHERE nonce = $1 AND consumed_at IS NULL AND expires_at > NOW()
RETURNING *
```
Jeśli zwróci 0 wierszy — state już zużyty lub wygasły.

---

## Etap SEC3: Error boundaries — logowanie błędów
**Ryzyko: NISKIE** | 3 pliki | Status: **Do zrobienia**

Pliki: `app/error.tsx`, `app/coach/error.tsx`, `app/u/[slug]/error.tsx`

Problem: Wszystkie 3 error boundaries robią `void error` — błąd jest odrzucany, nie logowany. Zero monitoringu.

Zmiana: Dodać `console.error` na każdym error boundary:
```typescript
useEffect(() => { console.error('App error:', error) }, [error])
```
Docelowo: Sentry lub inny monitoring.

---

## Etap SEC4: Strava — walidacja odpowiedzi API + error handling
**Ryzyko: ŚREDNIE** | 2 pliki | Status: **Do zrobienia**

Pliki: `app/api/strava/callback/route.ts`, `app/api/strava/sync/route.ts`

Problemy:
- Token response bez walidacji typów (`expires_at` może nie być liczbą)
- Activities upsert bez error handling — cicha awaria
- Background sync `.catch(e => console.error(...))` — brak retry
- Env vars (`STRAVA_CLIENT_ID`) bez walidacji

Zmiany:
- Dodać walidację typów na token response: `typeof tokens.expires_at === 'number'`
- Dodać error handling na upsert: `const { error } = await adminClient.from(...); if (error) ...`
- Walidować env vars na starcie route

---

## Etap SEC5: Contact form rate limiting + push validation
**Ryzyko: ŚREDNIE** | 2 pliki | Status: **Do zrobienia**

Pliki: `app/api/contact/route.ts`, `app/api/push/subscribe/route.ts`

Problemy:
- Contact form bez rate limitingu — nieograniczony spam emaili
- Push subscription bez walidacji struktury (brak `auth`, `p256dh` keys)

Zmiany:
- Contact: in-memory rate limit per IP (5 emaili/h) — ten sam wzorzec co athlete verify
- Push: Zod walidacja subscription object (endpoint HTTPS URL, keys presence)

---

## Etap SEC6: Session-types position bug + error exposure
**Ryzyko: NISKIE-ŚREDNIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/api/session-types/route.ts`

Problemy:
- Custom type position — podwójne dodawanie `builtins.length` offset (bug)
- Error response zawiera internal DB details (hints, code) — information disclosure

Zmiany:
- Fix position: użyć `index` bezpośrednio, nie dodawać offset dwukrotnie
- Error response: logować pełny error, zwracać generic message klientowi

---

## Etap SEC7: Proxy slug validation + week-templates type safety
**Ryzyko: NISKIE** | 2 pliki | Status: **Do zrobienia**

Pliki: `proxy.ts`, `app/api/week-templates/route.ts`

Problemy:
- Proxy: regex `/^\/u\/([^/]+)\/.+/` akceptuje dowolne znaki w slug — brak walidacji formatu
- Week templates: unsafe type casting `as { count: number }` na Supabase count result

Zmiany:
- Proxy: zaostrzzyć regex do `/^\/u\/([a-z0-9_-]+)\/.+/i`
- Week templates: dodać type guard `typeof ... === 'number'`

---

## Podsumowanie etapów Bezpieczeństwo

| Etap | Opis | Ryzyko | Status |
|------|------|--------|--------|
| SEC1 | Invite token expiry + rotacja | Wysokie | ⏭ Pominięty (celowa decyzja — CLAUDE.md) |
| SEC2 | Strava OAuth atomic state | Wysokie | ✅ Ukończony |
| SEC3 | Error boundaries — logowanie | Niskie | ✅ Ukończony |
| SEC4 | Strava — walidacja + error handling | Średnie | ✅ Ukończony |
| SEC5 | Contact rate limit | Średnie | ✅ Ukończony |
| SEC6 | Session-types position bug + error exposure | Niskie-Średnie | ✅ Ukończony |
| SEC7 | Proxy slug validation + type safety | Niskie | ✅ Ukończony |

### Poza zakresem (przyszłość)
- CSRF protection na athlete verify (GET → POST)
- Audit logging (session creation, OAuth, invite usage)
- Sections API pagination
- Sentry / external error monitoring
- Strava sync retry queue

---
---

# Cleanup techniczny (cross-cutting)

Status: **Do wdrożenia**
Ostatnia aktualizacja: 2026-03-19

---

## Etap X1: Cleanup importów i date utils
**Ryzyko: NISKIE** | Status: **Przeniesiony do A1** ✅

Przeniesiony do etapu A1 (Analityka) — deduplikacja helperów + calendar import.

---

## Podsumowanie

| Etap | Opis | Ryzyko | Status |
|------|------|--------|--------|
| X1 | Cleanup importów i date utils | Niskie | Przeniesiony do A1 |
