## Feedback

### Cel sekcji

Podstrona `Feedback` ma być centrum operacyjnym dla trenera, a nie tylko listą wpisów.

Po pełnym wdrożeniu ta sekcja ma odpowiadać na trzy pytania:

- co wymaga mojej uwagi teraz,
- u którego zawodnika dzieje się coś ważnego,
- gdzie mogę najszybciej zamknąć temat albo podjąć decyzję.

---

### Aktualna ocena

Sekcja jest już używalna i ma dobry kierunek:

- działa filtrowanie,
- działa grupowanie po zawodniku,
- można odpowiedzieć bez opuszczania ekranu,
- `mark as read` ma już optimistic update,
- karta feedbacku dobrze rozpisuje strukturę wpisu.

Największe braki:

- semantyka filtrów nie rozróżnia jeszcze dobrze wpisów informacyjnych od wpisów wymagających reakcji,
- overview stats są za mało operacyjne,
- grouped view nie daje jeszcze wystarczająco mocnego summary zawodnika,
- brak akcji masowych,
- brak prawdziwej logiki `wymaga reakcji`.

---

### Definicja ukończenia

Sekcję `Feedback` uznajemy za domkniętą, gdy:

- trener od razu widzi, które feedbacki wymagają reakcji,
- grouped view pozwala ocenić sytuację zawodnika bez wchodzenia w każdy wpis,
- są dostępne sensowne akcje masowe,
- karta feedbacku daje szybki, jednoznaczny odczyt ryzyka i statusu,
- interakcje są płynne i lokalnie reagują bez wrażenia opóźnienia,
- ekran skaluje się lepiej niż obecne „limit 200 i render”.

---

### Etap 1: Semantyka i priorytety

Priorytet: **Krytyczny**
Ryzyko: **Średnie**

#### Zakres

1. Zmienić pojęcie `Bez odpowiedzi`
- obecną logikę zastąpić czymś bliższym pracy trenera:
  - `Wymaga odpowiedzi`
  - albo `Wymaga reakcji`

2. Rozdzielić typy stanów
- `nieprzeczytane`
- `ryzykowne`
- `wymagające odpowiedzi`

3. Doprecyzować etykiety filtrów
- zamiast:
  - `Średnie samopoczucie`
  - `Słabe samopoczucie`
- użyć:
  - `Sygnał żółty`
  - `Sygnał czerwony`

4. Zdefiniować logicznie filtr `wymaga reakcji`
- przykładowa logika:
  - nieprzeczytany feedback z sygnałem `yellow` lub `red`,
  - feedback bez odpowiedzi z sygnałem `yellow` lub `red`,
  - świeży problemowy feedback głosowy lub tekstowy.

#### Pliki

- `app/coach/feedback/_components/FeedbackClient.tsx`
- opcjonalnie helper w `lib/`

#### Kryteria ukończenia

- ekran nie używa już mylącej kategorii `Bez odpowiedzi`,
- filtry są semantycznie zgodne z realną pracą trenera,
- trener widzi od razu, co wymaga reakcji, a nie tylko czego „nie odpisano”.

---

### Etap 2: Lepsze statystyki u góry

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Przebudować `OverviewStats`
- obecne karty:
  - `Dziś`
  - `Nieprzeczytane`
  - `Bez odpowiedzi`
- zastąpić bardziej operacyjnym zestawem.

2. Docelowy układ KPI
- `Nieprzeczytane`
- `Wymaga reakcji`
- `Czerwone sygnały`
- opcjonalnie `Dziś`

3. Dopasować kolorystykę do ryzyka
- czerwone sygnały muszą być czytelnie wyżej w hierarchii,
- neutralne statystyki nie powinny wyglądać tak samo ważnie.

#### Pliki

- `app/coach/feedback/_components/FeedbackClient.tsx`

#### Kryteria ukończenia

- górne karty mówią, co ważne, a nie tylko ile wpisów istnieje,
- trener po wejściu na ekran od razu rozumie poziom ryzyka.

---

### Etap 3: Grouped view jako realne summary zawodnika

Priorytet: **Bardzo wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Rozbudować nagłówek grupy zawodnika
- pokazać:
  - liczbę nowych feedbacków,
  - ostatni sygnał,
  - czy brakuje odpowiedzi,
  - datę ostatniego wpisu.

2. Dodać jedną linię podsumowania
- przykłady:
  - `2 nowe · ostatni sygnał czerwony · brak odpowiedzi`
  - `1 nowy · zielony sygnał · odpowiedziano`

3. Rozważyć zwijanie/rozwijanie grup
- szczególnie przy większej liczbie wpisów od jednego zawodnika.

#### Pliki

- `app/coach/feedback/_components/FeedbackClient.tsx`

#### Kryteria ukończenia

- trener może przeskanować grouped view i zrozumieć stan każdego zawodnika bez czytania wszystkich kart,
- grouped view staje się domyślnie wartościowym trybem pracy.

---

### Etap 4: Akcje masowe

Priorytet: **Wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Dodać akcję `Oznacz widoczne jako przeczytane`
- działa na aktualnie przefiltrowanym widoku.

2. Rozważyć `Oznacz grupę zawodnika jako przeczytaną`
- szczególnie przy grouped view.

3. Dopisać statusy sukcesu / błędu
- bez niepewności po kliknięciu.

#### Pliki

- `app/coach/feedback/_components/FeedbackClient.tsx`
- `lib/actions/feedback.ts`

#### Kryteria ukończenia

- trener może jednym ruchem zamknąć serię prostych wpisów,
- ekran jest wygodny przy większej liczbie feedbacków.

---

### Etap 5: Karta feedbacku jako lepszy obiekt roboczy

Priorytet: **Wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Dopracować header karty
- szybsze skanowanie,
- lepszy porządek informacji:
  - sygnał,
  - typ wpisu,
  - status odpowiedzi,
  - świeżość.

2. Uporządkować komunikację źródła
- zamiast uproszczonego modelu:
  - `Tekst`
  - `Głos`
  - `Tekst + głos`
  - `Zegarek`

3. Mocniej wyróżnić wpisy ryzykowne
- czerwone i żółte sygnały powinny być czytelne już w złożonym widoku.

4. Dodać lepszy preview treści bez rozwijania
- najważniejsza informacja ma być czytelna szybciej.

#### Pliki

- `components/coach/FeedbackCard.tsx`

#### Kryteria ukończenia

- trener szybciej rozpoznaje wagę wpisu,
- karta lepiej wspiera pracę na wielu rekordach pod rząd.

---

### Etap 6: Odpowiedź trenera i lokalny stan UI

Priorytet: **Średni do wysokiego**
Ryzyko: **Niskie**

#### Zakres

1. Dodać optimistic update po zapisaniu odpowiedzi
- tak jak już działa `mark as read`.

2. Po zapisaniu odpowiedzi lokalnie zaktualizować:
- `coach_reply`,
- status `odpowiedziano`,
- ewentualne zniknięcie z wybranego filtra.

3. Ujednolicić komunikaty statusowe
- sukces,
- błąd,
- zapis w toku.

#### Pliki

- `app/coach/feedback/_components/FeedbackClient.tsx`
- `lib/actions/feedback.ts`

#### Kryteria ukończenia

- odpowiedź zachowuje się równie płynnie jak oznaczenie wpisu jako przeczytany,
- trener nie ma wrażenia, że wszystko dzieje się dopiero po pełnym refreshu.

---

### Etap 7: Lepsze wejście z innych miejsc

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Rozszerzyć deep-linki do Feedback
- z dashboardu,
- z profilu zawodnika,
- z planera.

2. Rozważyć dodatkowe parametry URL
- `view=grouped|chronological`
- `sort=signal|date`
- `highlight=<feedbackId>`

3. Ustawić sensowne zachowanie po wejściu z zewnętrznego kontekstu
- np. otwarcie właściwego zawodnika,
- aktywacja odpowiedniego filtra,
- podświetlenie konkretnego wpisu.

#### Pliki

- `app/coach/feedback/page.tsx`
- `app/coach/feedback/_components/FeedbackClient.tsx`
- miejsca linkujące z innych modułów

#### Kryteria ukończenia

- wejście do Feedback z innych ekranów otwiera od razu właściwy kontekst,
- trener nie musi ręcznie szukać właściwego wpisu po przejściu.

---

### Etap 8: Skala i final polish

Priorytet: **Średni**
Ryzyko: **Średnie**

#### Zakres

1. Odejść od prostego `.limit(200)`
- wprowadzić prawdziwą paginację lub cursor-based loading.

2. Dodać jawne sortowanie po dacie
- nie opierać logiki wyłącznie na kolejności z backendu.

3. Dopracować empty states
- brak aktywnych zawodników,
- brak wpisów,
- brak wyników po filtrze.

4. Rozważyć utrwalanie preferencji widoku
- grouped / chronological,
- sort,
- filtr.

#### Pliki

- `app/coach/feedback/page.tsx`
- `app/coach/feedback/_components/FeedbackClient.tsx`

#### Kryteria ukończenia

- ekran jest gotowy na większą liczbę zawodników i wpisów,
- nie ma już zachowań typowo „MVP-only”.

---

### Rekomendowana kolejność wdrożenia

1. Etap 1: Semantyka i priorytety
2. Etap 2: Lepsze statystyki u góry
3. Etap 3: Grouped view jako realne summary zawodnika
4. Etap 4: Akcje masowe
5. Etap 5: Karta feedbacku jako lepszy obiekt roboczy
6. Etap 6: Odpowiedź trenera i lokalny stan UI
7. Etap 7: Lepsze wejście z innych miejsc
8. Etap 8: Skala i final polish

---

### Minimalny zestaw o największym wpływie

Jeśli chcemy szybki, mocny upgrade `Feedback`, największy efekt dadzą:

- Etap 1
- Etap 2
- Etap 3
- Etap 4

---

