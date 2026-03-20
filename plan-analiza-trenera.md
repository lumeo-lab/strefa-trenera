# Plan Wdrożenia: `Analiza` trenera + przebudowa `Historii`

## Cel główny

Przebudować obecne `Wykonanie` tak, aby:

- `Historia` stała się czystą warstwą operacyjną i logiem wykonania,
- nowa zakładka `Analiza` stała się prawdziwym panelem decyzji dla trenera,
- trener po kilku sekundach rozumiał:
  - czy zawodnik toleruje obciążenie,
  - czy plan działa,
  - które bodźce działają, a które się sypią,
  - czy zwiększać obciążenie, utrzymać je, czy zrobić krok w tył.

To nie ma być „jeszcze więcej statystyk”.  
To ma być system, który zamienia dane w decyzję planistyczną.

---

## Zasada nadrzędna

### `Historia`
Odpowiada na pytanie:

`Co się wydarzyło?`

### `Analiza`
Odpowiada na pytanie:

`Co z tego wynika dla kolejnego planu?`

Jeśli jakaś sekcja nie pomaga trenerowi podjąć decyzji treningowej, nie powinna być w `Analizie`.

---

## Diagnoza obecnego stanu

Obecna zakładka `Wykonanie` miesza trzy warstwy:

1. raport wykonania,
2. monitoring jakości danych,
3. lekkie insighty planistyczne.

To powoduje, że:

- część sekcji jest zbyt operacyjna,
- część sekcji jest zbyt ogólna,
- a warstwa „co trener ma zrobić dalej” jest za słaba.

Największe obecne problemy:

- za mało wykresów i trendów,
- brak czasu w strefach HR 1-5,
- brak sensownego modelu obciążenia treningowego,
- brak warstwy `key sessions`,
- brak `session_goal`,
- brak silnej sekcji końcowej: `rekomendacja`,
- zbyt duża liczba bloków raportowych, które bardziej pasują do `Historii`.

---

## Docelowy efekt

Po wdrożeniu trener ma wejść w `Analizę` i:

### po 3 sekundach
widzieć:

- główny werdykt,
- czy można progresować,
- czy trzeba uważać,
- czy trzeba odpuścić.

### po 10 sekundach
rozumieć:

- jak wygląda obciążenie,
- jak wygląda rozkład intensywności,
- jak zawodnik reaguje,
- które bodźce działają,
- które bodźce wymagają korekty.

### po 30 sekundach
być gotowym do planowania kolejnego tygodnia bez ręcznego przekopywania logu sesji.

To jest definicja efektu `wow`.

---

## Docelowy podział odpowiedzialności między zakładkami

## `Historia` ma zawierać

- log sesji,
- status wykonania,
- źródło wykonania,
- źródło actual danych,
- feedback szczegółowy,
- powiązanie ze Stravą,
- aktywności poza planem,
- elementy „do weryfikacji”,
- operacyjne filtry i przeglądanie przypadków.

## `Analiza` ma zawierać

- werdykt,
- obciążenie i trend,
- strefy intensywności,
- reakcję zawodnika,
- jakość realizacji bodźców,
- analizę kluczowych jednostek,
- rekomendację planistyczną.

---

## Co przenosimy z obecnego `Wykonania` do `Historii`

### Do `Historii`

- `Ostatnie sesje`
- `Aktywności poza planem`
- surowe liczniki statusów sesji, jeśli mają charakter operacyjny
- rozwijalne szczegóły feedbacku
- część tabelarycznego widoku typów sesji, jeśli jest czysto logowa
- wszystko, co wymaga filtrowania i „sprawdzania pojedynczego przypadku”

### W `Analizie` zostaje tylko to, co pomaga podejmować decyzję

- trend
- interpretacja
- porównanie okresów
- jakość absorpcji bodźca
- reakcja na obciążenie
- rekomendacja

---

# Architektura docelowej zakładki `Analiza`

## Sekcja 1: `Werdykt`

### Cel
Dać trenerowi natychmiastową odpowiedź:

- `Można progresować`
- `Utrzymaj obciążenie`
- `Monitoruj`
- `Ryzyko przeciążenia`
- `Tydzień lżejszy`

### Co ma zawierać

- główny status / recommendation state,
- 3-5 powodów, które go wyjaśniają,
- poziom pewności danych,
- informację o brakach danych, jeśli recommendation jest niepełna.

### Przykładowe powody

- `średnie RPE rośnie 2 tygodnie z rzędu`
- `czas w Z4-Z5 wzrósł o 28% tydzień do tygodnia`
- `brak pain flags mimo wzrostu obciążenia`
- `key sessions completion spadł do 50%`
- `objętość stabilna, samopoczucie stabilne`

### Wymagania UX

- duża karta hero,
- mocny kolor stanu,
- czytelny tytuł,
- bez ściany tekstu,
- pod spodem bardzo konkretne uzasadnienie.

### Status wdrożenia
Nowa sekcja do zaprojektowania od zera.

---

## Sekcja 2: `Obciążenie i trend`

### Cel
Pokazać:

- jak rośnie lub spada obciążenie,
- czy progresja jest zdrowa,
- czy zawodnik nie wchodzi za szybko w przeciążenie.

### Co ma zawierać

#### Wykres 1: tygodniowe obciążenie

Oś X:
- ostatnie 6-8 tygodni

Serie:
- `actual training load`
- opcjonalnie `planned load`

#### Wykres 2: tygodniowy czas i dystans

Serie:
- czas
- dystans

#### KPI obok

- zmiana load vs poprzedni tydzień
- zmiana load vs rolling 4 tygodnie
- zmiana czasu vs poprzedni tydzień
- zmiana dystansu vs poprzedni tydzień
- ramp rate

### Wymagane dane

- `training_load`
- `training_load_source`
- actual_duration
- actual_distance

### Jeśli brakuje load na start
Na MVP można zacząć od:

- czasu
- dystansu
- prostego load score

### Wymagania UX

- duże, czytelne wykresy liniowe / kolumnowe,
- szybka legenda,
- porównanie tygodni bez otwierania szczegółów.

---

## Sekcja 3: `Intensywność i strefy`

### Cel
Pokazać trenerowi rozkład pracy intensywnej i tlenowej.

To jest jedna z najważniejszych sekcji całej zakładki.

### Co ma zawierać

#### Wykres główny: stacked bar

Per tydzień:

- czas w HR Z1
- czas w HR Z2
- czas w HR Z3
- czas w HR Z4
- czas w HR Z5

#### KPI obok

- `low intensity share`
- `moderate intensity share`
- `high intensity share`
- `czas w Z4-Z5`
- `zmiana high-intensity time vs poprzedni tydzień`

### Co ma dawać

- szybkie wykrywanie za dużej intensywności,
- ocenę, czy zawodnik robi za dużo „szarej strefy”,
- ocenę czy budujemy odpowiedni bodziec.

### Wymagane dane

Per athlete:

- konfiguracja stref HR

Per activity / session:

- czas w Z1-Z5

### Źródła danych

Priorytet:

1. Strava activity zones
2. Strava streams + własne liczenie
3. brak danych = brak sekcji / obniżona pewność

### Wymagania UX

- stacked bar chart,
- silne kolory i dobra legenda,
- możliwość szybkiego porównania tygodni,
- bez tabelarycznego przeciążenia.

---

## Sekcja 4: `Reakcja zawodnika`

### Cel
Pokazać, jak organizm i odczucie reagują na obciążenie.

### Co ma zawierać

#### Wykres 1

`load vs RPE`

#### Wykres 2

`load vs feeling`

#### KPI

- średnie RPE 7/14/28 dni
- trend feeling
- liczba pain flags
- liczba problematycznych sesji po mocnych jednostkach

### Co trener ma zobaczyć

- czy rosnące obciążenie nadal jest dobrze tolerowane,
- czy odczuwana trudność rośnie szybciej niż obciążenie,
- czy ból pojawia się po określonych typach sesji.

### Wymagane dane

- structured feedback
- pain flag
- feeling
- RPE
- powiązanie z sesją i typem sesji

### Wymagania UX

- nie same liczby,
- połączenie wykresów i sygnałów,
- czytelne oznaczenie „problem”, „stabilnie”, „dobrze tolerowane”.

---

## Sekcja 5: `Jakość realizacji bodźców`

### Cel
Ocenić nie tylko „czy zawodnik trenuje”, ale:

`jakie bodźce wchodzą, a jakie nie`

### Co analizować

- easy
- long
- tempo
- interval
- strength
- cross
- inne typy zgodne z systemem

### Dla każdego typu pokazać

- completion rate
- skip rate
- avg RPE
- pain frequency
- plan vs actual
- dominant feeling
- udział danego typu w obciążeniu

### Co ma z tego wynikać

- które bodźce są tolerowane dobrze,
- które trzeba uprościć,
- które trzeba zmienić formą,
- które są regularnie pomijane lub kończą się gorszą reakcją.

### Wymagania UX

- zamiast ciężkiej tabeli:
  - mini cards,
  - mini bars,
  - lekka heatmapa,
  - ranking typów sesji.

---

## Sekcja 6: `Kluczowe jednostki`

### Cel
Pokazać trenerowi, czy zawodnik dowozi to, co najważniejsze.

### Wymaga nowego pola

- `session_priority`
  - `key`
  - `normal`
  - `optional`

### Co ma zawierać

- key session completion rate
- key session skip rate
- average RPE po key sessions
- pain flags po key sessions
- trend key session execution

### Dlaczego to jest ważne

Ogólny completion rate może wyglądać dobrze, ale jeśli padają kluczowe jednostki, plan nie działa.

### Wymagania UX

- krótki, bardzo mocny blok,
- najlepiej nad sekcją rekomendacji albo tuż przed nią.

---

## Sekcja 7: `Rekomendacja planistyczna`

### Cel
Dać trenerowi końcowy wniosek.

### Typy rekomendacji

- `Progresuj`
- `Utrzymaj`
- `Zmniejsz intensywność`
- `Zmniejsz objętość`
- `Tydzień lżejszy`
- `Monitoruj bez zmian`

### Co ma zawierać

- decyzję,
- 2-4 konkretne uzasadnienia,
- poziom pewności,
- ewentualne ostrzeżenie o brakach danych.

### Bardzo ważna zasada

To nie może być „poetycka analiza AI”.

To ma być:

- konkret,
- krótki format,
- język trenerski,
- powiązanie z danymi.

---

# Docelowa struktura `Historii`

## Cel

`Historia` ma być najlepszym miejscem do:

- przeglądu sesji,
- sprawdzania szczegółów,
- filtrowania,
- weryfikacji problemów,
- ręcznego ogarniania edge case'ów.

## Sekcja 1: Pasek filtrowania

Filtry:

- zakres czasu / miesiąc
- status
- typ sesji
- z feedbackiem / bez feedbacku
- tylko sparowane / tylko niesparowane
- tylko key sessions
- wyszukiwarka

## Sekcja 2: Główna tabela sesji

Kolumny:

- data
- sesja
- typ
- planned
- actual
- status
- source of completion
- source of actuals
- feedback
- Strava pairing

## Sekcja 3: Szczegóły sesji

Po rozwinięciu:

- structured feedback
- voice/text
- notes
- pain note
- watch link
- Strava details
- override info

## Sekcja 4: `Do weryfikacji`

Osobny panel:

- aktywności poza planem
- wykryte sesje czekające na potwierdzenie
- błędne lub niejednoznaczne pairingi

## Sekcja 5: Operacyjne summary

Małe, lekkie summary może zostać, ale tylko jako:

- liczba wykonanych
- pominiętych
- wykrytych
- bez potwierdzenia

bez interpretacji planistycznej.

---

# Dane i backend potrzebne do wdrożenia

## 1. Nowe pola per athlete

### Konfiguracja stref HR

- `hr_zone_method`
- `threshold_hr`
- `max_hr`
- opcjonalnie ręczne widełki Z1-Z5

Najlepiej w osobnej konfiguracji zawodnika.

## 2. Nowe pola per session

- `session_priority`
- `session_goal`
- `training_load`
- `training_load_source`

### `session_priority`

- `key`
- `normal`
- `optional`

### `session_goal`

Przykładowe wartości:

- `recovery`
- `z2_volume`
- `threshold`
- `vo2`
- `speed`
- `long_run`
- `strength`
- `race_specific`

## 3. Dane per activity / execution

- `time_in_hr_z1`
- `time_in_hr_z2`
- `time_in_hr_z3`
- `time_in_hr_z4`
- `time_in_hr_z5`

## 4. Źródła danych

### Feedback

Używany do:

- RPE
- feeling
- pain
- note

### Session execution

Używany do:

- statusu
- source of completion
- actuals

### Strava

Używana do:

- HR
- time in zones
- cadence
- pace
- elevation
- activity pairing
- load input

---

# Model analityczny

## MVP model obciążenia

Na start nie trzeba kopiować 1:1 TrainingPeaks.

Najrozsądniej:

### Faza początkowa

- `training_load` z HR jeśli dostępne,
- fallback do `RPE * czas`,
- oznaczanie źródła load.

### Poziomy jakości load

- wysoka pewność: Strava HR / zones
- średnia pewność: HR bez pełnych zones
- niższa pewność: RPE-based estimate

To musi być widoczne w UI.

---

# Plan wdrożenia

## Etap 0: Zamrożenie modelu

### Cel
Ustalić ostateczne definicje przed kodem.

### Do zamrożenia

- rola `Historii`
- rola `Analizy`
- lista sekcji w `Analizie`
- model HR zones
- model `training_load`
- `session_priority`
- `session_goal`
- co liczymy w MVP, a co odkładamy do V2

### Kryterium wyjścia

Brak otwartych pytań o:

- gdzie ma żyć dana sekcja,
- jakie pola są obowiązkowe,
- jaki jest scope MVP.

---

## Etap 1: Reorganizacja informacji między zakładkami

### Cel
Rozdzielić operację od analizy.

### Zakres

- usunąć z `Wykonania` sekcje stricte logowe,
- przenieść je do `Historii`,
- przygotować `Wykonanie` pod nową nazwę `Analiza`,
- zrobić nowy porządek informacji.

### Co dokładnie zrobić

- przenieść `Ostatnie sesje` do `Historii`
- przenieść `Aktywności poza planem` do `Historii`
- przenieść operacyjne statusy do `Historii`
- ograniczyć obecne `Wykonanie` do sekcji insightowych

### Kryterium wyjścia

Po wejściu w `Historię` widać log i szczegóły.  
Po wejściu w `Analizę` nie ma już wrażenia „tabeli wykonania”.

---

## Etap 2: Rozszerzenie modelu danych

### Cel
Przygotować dane potrzebne do prawdziwej analizy.

### Zakres

- `session_priority`
- `session_goal`
- konfiguracja stref HR per athlete
- pola pod `training_load`
- pola / agregaty pod `time in zones`

### Kryterium wyjścia

Backend i baza umieją przechować wszystko, czego potrzebuje `Analiza`.

---

## Etap 3: Integracja danych HR i stref

### Cel
Dostarczyć twarde dane intensywności.

### Zakres

- pobranie athlete zones ze Stravy, jeśli możliwe
- pobranie activity zones / streams
- zapis stref dla aktywności
- fallback gdy danych brak
- przygotowanie agregacji tygodniowych

### Ważna zasada

Robić to ostrożnie pod rate limits i cache.

### Kryterium wyjścia

Można policzyć tygodniowy czas w Z1-Z5 dla zawodnika z działającą Stravą.

---

## Etap 4: Model obciążenia

### Cel
Zbudować pierwszy użyteczny model load.

### Zakres

- load per session
- load source
- tygodniowe agregaty
- ramp rate
- trend rolling

### MVP

- prosty load model
- bez udawania pełnego PMC, jeśli fundament nie jest jeszcze wystarczający

### Kryterium wyjścia

System liczy stabilny load i można go pokazać na wykresach.

---

## Etap 5: `Analiza` MVP

### Cel
Dowieźć pierwszą wersję efektu `wow`.

### Sekcje MVP

1. `Werdykt`
2. `Obciążenie i trend`
3. `Intensywność i strefy`
4. `Reakcja zawodnika`
5. `Jakość realizacji bodźców`
6. `Rekomendacja`

### Co musi być gotowe

- wykres obciążenia
- wykres stref
- podstawowe recommendation rules
- trend RPE/feeling/pain

### Kryterium wyjścia

Trener po wejściu w zakładkę widzi konkretną decyzję i jej uzasadnienie.

---

## Etap 6: `Historia` 2.0

### Cel
Po przebudowie analityki domknąć `Historię`.

### Zakres

- lepsza tabela
- więcej logiki operacyjnej
- sekcja `Do weryfikacji`
- lepsze filtry
- wyraźne źródła danych
- Strava pairing visibility

### Kryterium wyjścia

Historia jest najlepszym miejscem do pracy operacyjnej na sesjach.

---

## Etap 7: `Key sessions` i analiza bodźców

### Cel
Podnieść jakość analizy do poziomu bardzo praktycznego coachingu.

### Zakres

- session_priority
- key session completion
- response after key sessions
- skipped key sessions
- pain after key sessions

### Kryterium wyjścia

Trener widzi, czy zawodnik dowozi to, co najważniejsze.

---

## Etap 8: Polish i efekt `wow`

### Cel
Zrobić z tego zakładkę premium.

### Zakres

- dopracować hierarchię wizualną
- duże wykresy
- kolorystykę stanów
- tooltips
- mikrocopy
- legendy
- empty states
- graceful degradation przy niepełnych danych

### Kryterium wyjścia

Zakładka wygląda jak prawdziwe centrum decyzji, a nie panel pomocniczy.

---

# Priorytety wdrożenia

## Najpierw

1. rozdział `Historia` vs `Analiza`
2. HR zones
3. training load
4. wykresy
5. recommendation panel

## Potem

6. key sessions
7. session_goal
8. lepszy model readiness / fatigue
9. głębsza analiza bodźców

---

# Czego nie robić za wcześnie

- nie robić zaawansowanego AI-recommendation przed stabilnym load modelem,
- nie budować 20 wykresów bez silnej hierarchii,
- nie przeciążać `Analizy` logami,
- nie próbować kopiować całego TrainingPeaks od razu,
- nie robić stref bez poprawnej konfiguracji zawodnika,
- nie mieszać `Historia` i `Analiza` z powrotem po drodze.

---

# Definicja sukcesu

Projekt jest udany, jeśli:

- `Historia` jest szybsza i bardziej operacyjna niż dziś,
- `Analiza` daje realny wgląd w obciążenie, intensywność i reakcję,
- trener nie musi ręcznie składać danych z kilku bloków,
- recommendation jest zwięzła i trafna,
- wykresy naprawdę pomagają podejmować decyzje,
- a całość sprawia wrażenie narzędzia premium, nie tylko dashboardu statystyk.

---

# Końcowa rekomendacja

To wdrażać spokojnie i etapami.

Najlepsza ścieżka:

1. najpierw rozdział informacji,
2. potem dane pod load i strefy,
3. potem wykresy i recommendation,
4. potem key sessions,
5. na końcu polish.

To jest najbardziej rozsądna droga do efektu `wow` bez chaosu i bez połowicznych rozwiązań.
