# Plan Poprawek Podstron Coach

Status: **W przygotowaniu i wdrażaniu sekcjami**
Ostatnia aktualizacja: 2026-03-18
Cel: jeden wspólny dokument planów jakościowych dla kolejnych podstron panelu `coach`, rozpisany modułami tak, żeby łatwo było wracać do konkretnej sekcji i wdrażać etapami.

---

## Spis sekcji

1. Feedback
2. Czat
3. Faktury
4. Analityka
5. Ustawienia
6. Pomoc
7. Zawodnicy
8. Panel zawodnika
9. Sidebar + Topbar
10. Login / Register
11. Landing page
12. Panel zawodnika mobile
13. Error states

---

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

## Czat

### Cel sekcji

Podstrona `Czat` ma być centrum komunikacji trenera z zawodnikami, a nie tylko listą wiadomości.

Po pełnym wdrożeniu ta sekcja ma odpowiadać na trzy pytania:

- kto wymaga mojej odpowiedzi teraz,
- z kim komunikacja jest aktywna lub ryzykowna,
- jak szybko przejść z rozmowy do działania w innych częściach panelu.

---

### Aktualna ocena

Sekcja ma już dobrą bazę:

- działa lista rozmów i aktywny wątek,
- nieprzeczytane rozmowy są wynoszone wyżej,
- deep-linki z dashboardu i profilu już istnieją,
- polling działa tylko przy widocznej zakładce,
- wiadomości są automatycznie oznaczane jako przeczytane po realnym wejściu w wątek.

Największe braki:

- brak prawdziwego modelu `wymaga odpowiedzi`,
- sidebar jest zbyt prosty jak na narzędzie operacyjne,
- wybór rozmowy nie synchronizuje się z URL,
- wysyłka i read state nie są wystarczająco natychmiastowe lokalnie,
- dane są jeszcze oparte o MVP-owe limity, które przy skali zaczną kłamać.

---

### Definicja ukończenia

Sekcję `Czat` uznajemy za domkniętą, gdy:

- trener od razu widzi, które rozmowy wymagają odpowiedzi,
- sidebar pozwala szybko skanować priorytety bez otwierania każdego wątku,
- aktywny wątek reaguje lokalnie i natychmiast po wysyłce oraz odczycie,
- URL zachowuje aktualny kontekst rozmowy,
- ekran skaluje się do większej liczby rozmów i dłuższej historii,
- czat jest spójnie powiązany z profilem zawodnika, feedbackiem i dashboardem.

---

### Etap 1: Semantyka pracy i definicja priorytetów

Priorytet: **Krytyczny**
Ryzyko: **Średnie**

#### Zakres

1. Zdefiniować statusy operacyjne rozmowy
- `Nieprzeczytane`
- `Wymaga odpowiedzi`
- `Aktywne dziś`
- `Bez nowych wiadomości`

2. Ustalić logikę `Wymaga odpowiedzi`
- proponowana definicja:
  - ostatnia wiadomość w wątku jest od zawodnika,
  - trener jeszcze nie odpowiedział po tej wiadomości,
  - albo wątek ma nieprzeczytane wiadomości od zawodnika.

3. Zmienić logikę priorytetu z samego `unread`
- ekran ma odpowiadać na pytanie:
  - `czy trener powinien coś zrobić teraz`.

4. Przygotować model summary wątku
- `unreadCount`
- `lastMessageSender`
- `lastMessageAt`
- `awaitingCoachReply`
- `lastMessagePreview`

#### Pliki

- `app/coach/chat/page.tsx`
- `app/coach/chat/_components/ChatClient.tsx`
- opcjonalnie helper/agregat w `lib/`

#### Kryteria ukończenia

- mamy jasno zdefiniowane `wymaga odpowiedzi`,
- lista rozmów odróżnia nowe wiadomości od rozmów wymagających akcji.

---

### Etap 2: Sidebar jako narzędzie operacyjne

Priorytet: **Bardzo wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Przebudować pojedynczy wiersz rozmowy
- wyraźniejsza nazwa zawodnika,
- czytelniejszy czas,
- lepszy preview,
- status rozmowy.

2. Dodać statusy wizualne w sidebarze
- `Wymaga odpowiedzi`
- `Nieprzeczytane`
- `Ty ostatnio pisałeś`
- `Brak aktywności`

3. Ulepszyć snippet ostatniej wiadomości
- lepsze prefixy,
- bardziej kontrolowane skracanie,
- mniej przypadkowego urwania.

4. Ulepszyć prezentację czasu
- dziś: godzina,
- wczoraj: `Wczoraj`,
- starsze: krótka data,
- bardzo świeże: `x min temu`, jeśli to ma sens.

5. Rozszerzyć filtry w sidebarze
- `Wszystkie`
- `Nieprzeczytane`
- `Wymaga odpowiedzi`
- opcjonalnie `Aktywne dziś`

6. Dodać liczniki tam, gdzie to pomaga
- przy filtrach,
- ewentualnie przy wydzielonych sekcjach.

#### Pliki

- `app/coach/chat/_components/ChatClient.tsx`

#### Kryteria ukończenia

- sidebar daje wartość jako inbox operacyjny,
- trener jednym spojrzeniem rozumie, które rozmowy są ważne.

---

### Etap 3: Synchronizacja z URL i zachowanie kontekstu

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Aktualizować URL po zmianie rozmowy
- `?athlete=<id>`
- zachować aktywny filtr.

2. Aktualizować URL po zmianie filtra
- tak, aby stan ekranu był odtwarzalny po refreshu.

3. Spiąć wejścia z innych miejsc
- dashboard,
- profil zawodnika,
- lista zawodników.

4. Ustalić zachowanie po odświeżeniu
- zachowany aktywny wątek,
- zachowany aktywny filtr,
- opcjonalnie zachowany search.

#### Pliki

- `app/coach/chat/_components/ChatClient.tsx`
- `app/coach/chat/page.tsx`
- miejsca linkujące z innych modułów

#### Kryteria ukończenia

- refresh nie gubi aktywnego wątku,
- ręcznie wybrana rozmowa ma odzwierciedlenie w adresie.

---

### Etap 4: Natychmiastowość UI i optimistic updates

Priorytet: **Bardzo wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Dodać optimistic send
- wiadomość pojawia się lokalnie od razu po kliknięciu `Wyślij`,
- input czyści się od razu,
- wiadomość może chwilowo mieć status `sending`.

2. Po sukcesie zsynchronizować lokalny placeholder z odpowiedzią serwera
- bez skoku i bez migotania.

3. Po błędzie przywrócić stan sensownie
- przywrócić treść inputu,
- pokazać czytelny błąd,
- opcjonalnie oznaczyć wiadomość jako niewysłaną.

4. Lokalnie zbić unread count po oznaczeniu wątku jako przeczytany
- bez czekania na polling lub pełny refresh.

5. Lokalnie aktualizować summary wątku po wysyłce
- `lastMessage`
- `lastMessageSender`
- `lastMessageAt`
- `awaitingCoachReply = false`

#### Pliki

- `app/coach/chat/_components/ChatClient.tsx`
- `lib/actions/messages.ts`

#### Kryteria ukończenia

- wysyłka i odczyt są natychmiast widoczne lokalnie,
- użytkownik nie ma wrażenia opóźnienia.

---

### Etap 5: Czytelność samego wątku rozmowy

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Dodać separatory dni
- `Dziś`
- `Wczoraj`
- pełna data dla starszych wiadomości.

2. Uporządkować timestamps
- lżejsza forma w samym wątku,
- mocniejszy kontekst na separatorach dni.

3. Dopracować bańki wiadomości
- szerokość,
- łamanie treści,
- zachowanie dla długich wiadomości.

4. Rozważyć grupowanie kolejnych wiadomości od tej samej strony
- ograniczyć powtarzanie avatarów tam, gdzie nie pomaga.

5. Dodać mały status lokalny przy wysyłce
- `Wysyłanie...`
- opcjonalnie `Nie wysłano`.

#### Pliki

- `app/coach/chat/_components/ChatClient.tsx`

#### Kryteria ukończenia

- długie rozmowy są łatwe do skanowania,
- kontekst czasu jest czytelny bez wysiłku.

---

### Etap 6: Header wątku jako panel kontekstowy trenera

Priorytet: **Średni do wysokiego**
Ryzyko: **Średnie**

#### Zakres

1. Rozbudować header aktywnego wątku
- imię i nazwisko,
- pakiet,
- cel,
- status zawodnika, jeśli istnieje,
- ważne badge, jeśli są.

2. Dodać szybkie akcje
- `Profil`
- `Plan`
- `Feedback`
- opcjonalnie inne wejścia, jeśli realnie pomagają.

3. Pokazać ważne sygnały przy zawodniku
- czerwony feedback,
- zaległa płatność,
- brak planu,
- alert/warning status.

4. Utrzymać prostotę
- header ma pomagać, ale nie może zamienić się w mini-dashboard.

#### Pliki

- `app/coach/chat/page.tsx`
- `app/coach/chat/_components/ChatClient.tsx`

#### Kryteria ukończenia

- trener ma szybki kontekst i szybkie przejścia bez wychodzenia z rozmowy,
- header wspiera działanie, a nie tylko prezentuje nazwę.

---

### Etap 7: Stany błędu, empty states i stany pośrednie

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Rozdzielić stany widoku
- brak wiadomości,
- brak rozmów,
- błąd ładowania,
- brak dostępu,
- brak wyników po filtrze.

2. Dodać retry przy błędzie ładowania wątku
- bez konieczności ręcznego odświeżania całej strony.

3. Dopracować stan po błędzie wysyłki
- bardziej widoczny komunikat,
- sensowne odzyskanie treści,
- opcja ponowienia.

4. Dopracować globalny empty state
- bardziej produktowy onboarding komunikacyjny.

5. Ucywilizować baner powiadomień push
- lepsza integracja wizualna,
- możliwość schowania,
- nie może dominować nad ekranem.

#### Pliki

- `app/coach/chat/_components/ChatClient.tsx`
- `lib/actions/messages.ts`

#### Kryteria ukończenia

- użytkownik zawsze wie, czy coś jest puste, czy zepsute,
- błędy nie wyglądają jak brak danych.

---

### Etap 8: Dane i wydajność przy skali

Priorytet: **Wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Odejść od globalnego `limit(200)` przy budowie summary threadów
- dane summary muszą być poprawne także przy większej liczbie wiadomości.

2. Odejść od prostego `limit(200)` w samym wątku
- wprowadzić ładowanie starszych wiadomości,
- lub paginację/cursor.

3. Uporządkować model ładowania threadu
- porcjowanie,
- kontrola zakresu,
- przewidywalne zachowanie dla długiej historii.

4. Ograniczyć nadmiarowe `router.refresh()`
- część stanu utrzymywać lokalnie tam, gdzie to bezpieczne.

5. Rozważyć wydzielenie agregatu danych do sidebaru
- bardziej trwała i testowalna warstwa danych.

#### Pliki

- `app/coach/chat/page.tsx`
- `app/coach/chat/_components/ChatClient.tsx`
- `lib/actions/messages.ts`
- opcjonalnie nowy helper w `lib/`

#### Kryteria ukończenia

- summary rozmów nie traci poprawności przy skali,
- historia czatu nie urywa się sztucznie po MVP-owym limicie.

---

### Etap 9: Integracja z resztą panelu

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Pogłębić wejścia z dashboardu
- lepsze filtry,
- bardziej precyzyjny kontekst.

2. Spiąć czat z profilem zawodnika
- lepszy powrót do profilu,
- szybkie wejście do feedbacku i planu.

3. Rozważyć sygnały z innych modułów w czacie
- feedback,
- status zawodnika,
- alerty,
- inne ważne konteksty.

4. Utrzymać spójny język z resztą panelu
- `wymaga reakcji`
- `nieprzeczytane`
- `alert`
- `uwaga`

#### Pliki

- `app/coach/chat/page.tsx`
- `app/coach/chat/_components/ChatClient.tsx`
- miejsca linkujące w innych modułach

#### Kryteria ukończenia

- czat działa jako część jednego workflow trenera,
- nie jest już osobnym silosem komunikacyjnym.

---

### Etap 10: Final polish UX/UI

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Dopracować gęstość i hierarchię sidebaru
- więcej rozmów na ekranie,
- bez wrażenia ciasnoty.

2. Dopracować kolorystykę stanów
- unread,
- waiting reply,
- active thread,
- neutral.

3. Sprawdzić zachowanie na mniejszych szerokościach
- ergonomia,
- ewentualny tryb przełączania lista/wątek.

4. Dopracować mikrocopy
- input,
- filtry,
- błędy,
- empty states.

5. Dopracować accessibility
- focus states,
- aria labels,
- kontrasty,
- obsługa klawiatury.

#### Pliki

- `app/coach/chat/_components/ChatClient.tsx`

#### Kryteria ukończenia

- ekran wygląda dojrzale i jest wygodny w codziennej pracy,
- nie ma już wrażenia niedokończonego MVP.

---

### Rekomendowana kolejność wdrożenia

1. Etap 1: Semantyka pracy i definicja priorytetów
2. Etap 2: Sidebar jako narzędzie operacyjne
3. Etap 3: Synchronizacja z URL i zachowanie kontekstu
4. Etap 4: Natychmiastowość UI i optimistic updates
5. Etap 5: Czytelność samego wątku rozmowy
6. Etap 6: Header wątku jako panel kontekstowy trenera
7. Etap 7: Stany błędu, empty states i stany pośrednie
8. Etap 8: Dane i wydajność przy skali
9. Etap 9: Integracja z resztą panelu
10. Etap 10: Final polish UX/UI

---

### Minimalny zestaw o największym wpływie

Jeśli chcemy szybki, mocny upgrade `Czat`, największy efekt dadzą:

- Etap 1
- Etap 2
- Etap 3
- Etap 4
- Etap 5

---

## Faktury

### Cel sekcji

Podstrona `Faktury` ma być centrum pracy finansowej trenera, a nie tylko listą dokumentów.

Po pełnym wdrożeniu ta sekcja ma odpowiadać na trzy pytania:

- które płatności wymagają mojej reakcji teraz,
- jaki jest realny stan finansów zawodników,
- jak szybko przejść od widoku faktury do działania wobec konkretnego zawodnika.

---

### Aktualna ocena

Sekcja ma już dobrą bazę:

- działa tworzenie, edycja i pobieranie faktur,
- działa szybka zmiana statusu,
- są KPI, filtry, wyszukiwarka i filtrowanie po zawodniku,
- przeterminowanie jest liczone także po dacie, a nie tylko po ręcznie ustawionym statusie,
- dashboard i profil zawodnika są już częściowo spięte z modułem faktur.

Największe braki:

- status zapisany i stan wyliczony z terminu nie są jeszcze semantycznie do końca uporządkowane,
- sekcja jest bardziej rejestrem dokumentów niż panelem działań finansowych,
- filtry są poprawne, ale za mało operacyjne,
- tabela nie wyróżnia jeszcze wystarczająco mocno rekordów wymagających działania,
- URL nie zachowuje kontekstu po ręcznej pracy na filtrach.

---

### Definicja ukończenia

Sekcję `Faktury` uznajemy za domkniętą, gdy:

- statusy i stany płatności są jednoznaczne i spójne w całym systemie,
- trener od razu widzi, które faktury wymagają działania,
- tabela dobrze wspiera codzienną pracę przy większej liczbie rekordów,
- tworzenie i edycja faktur są szybkie i przewidywalne,
- ekran zachowuje kontekst przez URL i dobrze współpracuje z dashboardem, profilem zawodnika i analityką,
- moduł wygląda i działa jak dojrzały panel finansowy, a nie jak MVP-owy rejestr.

---

### Etap 1: Semantyka statusów i jedna prawda biznesowa

Priorytet: **Krytyczny**
Ryzyko: **Średnie**

#### Zakres

1. Ustalić model docelowy statusów
- zdecydować, czy `overdue` jest:
  - stanem zapisywanym,
  - czy stanem pochodnym liczonym z `due_date`.

2. Rozdzielić pojęcia
- `status dokumentu`
- `stan płatności`
- `priorytet działania`

3. Ujednolicić logikę w całym systemie
- `Faktury`
- `Dashboard`
- `Analityka`
- profil zawodnika

4. Uporządkować helpery i logikę pochodną
- `isInvoiceOverdue`
- `isInvoicePending`
- ewentualnie wspólny `getInvoiceState`

#### Pliki

- `app/coach/invoices/_components/InvoicesClient.tsx`
- `app/coach/invoices/page.tsx`
- `lib/actions/invoices.ts`
- miejsca użycia w dashboardzie i analityce

#### Kryteria ukończenia

- istnieje jedna spójna definicja:
  - `opłacona`
  - `oczekująca`
  - `po terminie`
  - `anulowana`
- system nie miesza już dwóch konkurencyjnych źródeł prawdy.

---

### Etap 2: KPI jako narzędzie decyzji

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Przebudować KPI tak, aby lepiej wspierały decyzję
- `Opłacone`
- `W terminie`
- `Po terminie`
- `Wymagają działania`

2. Rozważyć dodatkowe metryki
- liczba przeterminowanych faktur,
- liczba faktur po terminie 7+ dni,
- średnia zaległość,
- wystawione w tym miesiącu.

3. Ustalić semantykę KPI
- czy pokazują dane dla całego systemu,
- czy dla aktualnie filtrowanego widoku.

4. Jeśli KPI zależą od filtrów, jasno to zakomunikować
- np. `dla bieżącego widoku`.

#### Pliki

- `app/coach/invoices/_components/InvoicesClient.tsx`

#### Kryteria ukończenia

- górne boxy pokazują poziom ryzyka i priorytet działań,
- trener od razu rozumie, jaka jest skala zaległości.

---

### Etap 3: Filtry i workflow pracy finansowej

Priorytet: **Bardzo wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Dodać bardziej operacyjne filtry
- `Wymagają działania`
- `Po terminie 7+ dni`
- `Po terminie 14+ dni`
- `Ten miesiąc`
- `Bez załącznika`
- opcjonalnie `Nowo wystawione`

2. Ustalić, które filtry są główne, a które pomocnicze
- nie przeładować interfejsu.

3. Rozszerzyć liczniki filtrów
- liczba rekordów,
- opcjonalnie wartość kwotowa tam, gdzie ma sens.

4. Rozważyć filtr stricte operacyjny
- `Do przypomnienia dziś`
- jeśli kiedyś pojawią się follow-upy.

#### Pliki

- `app/coach/invoices/_components/InvoicesClient.tsx`

#### Kryteria ukończenia

- trener może szybko wejść w widok „co dziś wymaga ruchu”,
- filtry odpowiadają realnej pracy, a nie tylko statusom danych.

---

### Etap 4: Tabela jako realne centrum pracy

Priorytet: **Bardzo wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Mocniej wyróżnić rekordy po terminie
- tło wiersza,
- akcent przy terminie,
- wyraźniejszy stan pilności.

2. Dopracować kolumnę `Termin / stan`
- termin,
- liczba dni po terminie,
- priorytet działania.

3. Uprościć lub osłabić mniej ważne informacje
- tak, by najważniejsze kolumny nie ginęły.

4. Dodać szybsze akcje w wierszu
- `Otwórz zawodnika`
- `Pobierz`
- `Edytuj`
- opcjonalnie `Oznacz jako opłacona`

5. Rozważyć sticky header i lepsze sortowanie domyślne
- najpierw priorytet,
- potem termin,
- potem data.

#### Pliki

- `app/coach/invoices/_components/InvoicesClient.tsx`

#### Kryteria ukończenia

- najważniejsze faktury nie giną w tabeli,
- trener od razu widzi, od czego zacząć.

---

### Etap 5: Empty states, komunikacja i stany pośrednie

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Rozdzielić empty states
- brak faktur w systemie,
- brak wyników po filtrze,
- brak wyników po search,
- brak faktur dla wybranego zawodnika.

2. Dodać bardziej użyteczne komunikaty
- `Spróbuj wyczyścić filtry`
- `Wystaw pierwszą fakturę`
- `Ten zawodnik nie ma jeszcze dokumentów`

3. Uporządkować statusy sukcesu i błędu
- tworzenie,
- edycja,
- zmiana statusu,
- pobieranie załącznika,
- usuwanie.

4. Dopracować widoczne stany przy pobieraniu i zapisie
- bardziej świadome sprzężenie zwrotne.

#### Pliki

- `app/coach/invoices/_components/InvoicesClient.tsx`
- `app/coach/invoices/_components/InvoiceCreateModal.tsx`
- `app/coach/invoices/_components/InvoiceEditModal.tsx`

#### Kryteria ukończenia

- użytkownik zawsze rozumie, dlaczego widok jest pusty,
- ekran zachowuje się dojrzale poza happy path.

---

### Etap 6: Tworzenie faktury jako lepszy workflow

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Dodać mikrocopy i podpowiedzi w modalu
- kwota podpowiadana z pakietu,
- brak terminu = domyślnie +14 dni,
- opis może oznaczać miesiąc lub zakres usługi.

2. Rozważyć lepsze prefillowanie opisu
- pakiet,
- miesiąc,
- nazwa zawodnika.

3. Dodać mały podgląd skutku utworzenia
- numer wygeneruje się automatycznie,
- data wystawienia = dziś,
- termin = domyślnie +14 dni.

4. Ulepszyć UX załącznika
- jasne formaty,
- limit rozmiaru,
- czytelniejsza prezentacja.

#### Pliki

- `app/coach/invoices/_components/InvoiceCreateModal.tsx`
- `lib/actions/invoices.ts`

#### Kryteria ukończenia

- trener rozumie, co dokładnie system utworzy po kliknięciu,
- wystawianie faktury jest szybsze i bardziej przewidywalne.

---

### Etap 7: Edycja, anulowanie i bezpieczeństwo operacji

Priorytet: **Wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Ustalić politykę zmian po wystawieniu faktury
- co można edytować,
- kiedy wystarczy anulowanie,
- czy pełne usuwanie powinno pozostać dostępne.

2. Jeśli usuwanie zostaje
- schować głębiej,
- dodać mocniejsze potwierdzenie,
- dopisać informację o konsekwencji.

3. Jeśli usuwanie ma zostać ograniczone
- promować `Anulowana` jako główną ścieżkę.

4. Rozdzielić zmianę statusu od zmiany treści
- aby użytkownik lepiej rozumiał konsekwencje akcji.

5. Rozważyć blokadę części pól po opłaceniu
- jeśli to zgodne z logiką biznesową.

#### Pliki

- `app/coach/invoices/_components/InvoiceEditModal.tsx`
- `app/coach/invoices/_components/InvoicesClient.tsx`
- `lib/actions/invoices.ts`

#### Kryteria ukończenia

- operacje na fakturach są bezpieczne i przewidywalne,
- sekcja jest bardziej wiarygodna jako moduł finansowy.

---

### Etap 8: Synchronizacja z URL i nawigacja między modułami

Priorytet: **Średni do wysokiego**
Ryzyko: **Niskie**

#### Zakres

1. Aktualizować URL po zmianie
- filtra,
- zawodnika,
- opcjonalnie wyszukiwania.

2. Zachowywać kontekst po refreshu
- filtr,
- zawodnik,
- opcjonalnie search.

3. Pogłębić wejścia z innych miejsc
- dashboard,
- profil zawodnika,
- lista zawodników.

4. Rozważyć dodatkowe query params
- `sort=...`
- `highlight=invoiceId`

#### Pliki

- `app/coach/invoices/page.tsx`
- `app/coach/invoices/_components/InvoicesClient.tsx`
- miejsca linkujące z innych modułów

#### Kryteria ukończenia

- praca ręczna i wejścia z innych ekranów nie gubią kontekstu,
- ekran jest łatwy do linkowania i odtwarzania.

---

### Etap 9: Spójność danych i revalidacji

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Ujednolicić revalidacje po:
- tworzeniu,
- edycji,
- zmianie statusu,
- usunięciu.

2. Sprawdzić wpływ na:
- `/coach/invoices`
- `/coach/dashboard`
- `/coach/analytics`
- `/coach/athletes/[id]`

3. Wydzielić wspólne helpery finansowe
- spójne wyliczanie stanu i priorytetu faktury.

4. Ograniczyć ryzyko rozjazdu logiki między modułami.

#### Pliki

- `lib/actions/invoices.ts`
- `app/coach/invoices/_components/InvoicesClient.tsx`
- miejsca zależne od agregatów faktur

#### Kryteria ukończenia

- wszystkie istotne ekrany reagują spójnie na operacje finansowe,
- nie ma już przypadków częściowo odświeżonych danych.

---

### Etap 10: Skala i final polish

Priorytet: **Średni**
Ryzyko: **Średnie**

#### Zakres

1. Rozważyć paginację lub lazy loading
- zamiast zawsze ładować pełną listę.

2. Rozważyć alternatywne widoki przy skali
- np. grupowanie po zawodniku lub stanie.

3. Dopracować zachowanie na mniejszych szerokościach
- tabela pozioma,
- czytelność,
- ergonomia.

4. Dopracować accessibility
- focus states,
- opisy działań,
- kontrasty,
- obsługa klawiatury.

5. Dopracować finalny polish wizualny
- badge statusów,
- hierarchia priorytetów,
- gęstość danych,
- spójność z resztą panelu.

#### Pliki

- `app/coach/invoices/_components/InvoicesClient.tsx`
- `app/coach/invoices/_components/InvoiceCreateModal.tsx`
- `app/coach/invoices/_components/InvoiceEditModal.tsx`

#### Kryteria ukończenia

- moduł wygląda dojrzale i działa dobrze przy większej liczbie rekordów,
- nie zdradza już cech „MVP only”.

---

### Rekomendowana kolejność wdrożenia

1. Etap 1: Semantyka statusów i jedna prawda biznesowa
2. Etap 2: KPI jako narzędzie decyzji
3. Etap 3: Filtry i workflow pracy finansowej
4. Etap 4: Tabela jako realne centrum pracy
5. Etap 5: Empty states, komunikacja i stany pośrednie
6. Etap 6: Tworzenie faktury jako lepszy workflow
7. Etap 7: Edycja, anulowanie i bezpieczeństwo operacji
8. Etap 8: Synchronizacja z URL i nawigacja między modułami
9. Etap 9: Spójność danych i revalidacji
10. Etap 10: Skala i final polish

---

### Minimalny zestaw o największym wpływie

Jeśli chcemy szybki, mocny upgrade `Faktury`, największy efekt dadzą:

- Etap 1
- Etap 2
- Etap 3
- Etap 4
- Etap 8

To podniesie ekran bardzo mocno bez pełnej przebudowy wszystkiego naraz.

---

## Analityka

### Cel sekcji

Podstrona `Analityka` ma być panelem decyzji biznesowych trenera, a nie tylko estetycznym raportem z faktur.

Po pełnym wdrożeniu ta sekcja ma odpowiadać na trzy pytania:

- jak wygląda realny przychód i stan pieniędzy,
- co dzieje się z bazą płacących zawodników,
- jakie trendy pokazują wzrost, stagnację albo ryzyko.

---

### Aktualna ocena

Sekcja ma już dobrą bazę:

- jest czytelna i nieprzeładowana,
- pokazuje podstawowe KPI finansowe,
- ma prosty wykres miesięczny,
- pokazuje ranking zawodników po przychodzie,
- pokazuje rozkład pakietów.

Największe braki:

- ekran jest bardziej raportem z faktur niż prawdziwą analityką biznesową,
- część metryk opiera się na dacie wystawienia faktury, a nie na realnej dacie opłacenia,
- brakuje MRR, aktywnych płacących zawodników, retencji i churnu,
- pakiety są pokazane bardziej ilościowo niż przychodowo,
- ekran nie daje jeszcze pełnego obrazu rozwoju biznesu.

---

### Definicja ukończenia

Sekcję `Analityka` uznajemy za domkniętą, gdy:

- metryki finansowe są semantycznie poprawne i spójne z `Fakturami`,
- ekran rozróżnia przychód wystawiony od realnie opłaconego,
- trener widzi trendy miesięczne, MRR i stan zaległości,
- sekcja pokazuje wartość zawodników, pakietów i zmiany bazy klientów,
- retencja i churn są widoczne przynajmniej w podstawowej formie,
- ekran wspiera decyzje biznesowe, a nie tylko przegląd danych.

---

### Etap 1: Uporządkowanie semantyki danych finansowych

Priorytet: **Krytyczny**
Ryzyko: **Średnie**

#### Zakres

1. Rozdzielić pojęcia
- `data wystawienia`
- `termin płatności`
- `data opłacenia`
- `stan płatności`

2. Wprowadzić lub przygotować model `paid_at`
- jeśli jeszcze nie istnieje w danych faktur.

3. Ustalić jedną definicję:
- `wystawione`
- `opłacone`
- `należne`
- `po terminie`
- `anulowane`

4. Ujednolicić semantykę z modułami:
- `Faktury`
- `Dashboard`
- `Analityka`

#### Pliki

- `app/coach/analytics/page.tsx`
- `lib/actions/invoices.ts`
- helpery współdzielone z `Faktury` i `Dashboard`

#### Kryteria ukończenia

- wiadomo dokładnie, po jakiej dacie liczone są wpływy,
- ekran nie myli wystawienia faktury z realnym przychodem.

---

### Etap 2: Przebudowa górnych KPI

Priorytet: **Bardzo wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Przebudować górne KPI na bardziej decyzjotwórcze
- `Opłacone w tym miesiącu`
- `Wystawione w tym miesiącu`
- `Po terminie`
- `Szacowany MRR`

2. Rozważyć dodatkowe KPI
- `Aktywni płacący zawodnicy`
- `Średni przychód na zawodnika`
- `Zmiana vs poprzedni miesiąc`
- `Zaległości 7+ dni`

3. Dodać doprecyzowanie semantyczne
- czy KPI oznacza:
  - wpływ gotówki,
  - należności,
  - estymację.

4. Dodać mocniejszą hierarchię wizualną dla ryzyka
- spadki,
- zaległości,
- niepokojące trendy.

#### Pliki

- `app/coach/analytics/page.tsx`

#### Kryteria ukończenia

- trener po wejściu na ekran rozumie realny stan pieniędzy,
- KPI przestają być tylko ładnym zestawem sum.

---

### Etap 3: Trendy miesięczne i wykresy, które coś znaczą

Priorytet: **Wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Przebudować wykres główny
- tak, aby opierał się na realnej logice przychodu:
  - opłacone wg `paid_at`,
  - wystawione wg `date`,
  - zaległe wg aktualnego stanu.

2. Rozważyć dwa widoki trendu
- `Przychód opłacony`
- `Faktury wystawione / należne`

3. Dodać zakresy czasu
- 3 miesiące
- 6 miesięcy
- 12 miesięcy
- cały okres

4. Rozważyć dodatkowe wykresy
- trend zaległości,
- trend liczby płacących zawodników,
- trend MRR.

#### Pliki

- `app/coach/analytics/page.tsx`

#### Kryteria ukończenia

- wykresy pokazują realne trendy, a nie tylko poprawnie narysowane słupki,
- użytkownik nie wyciąga błędnych wniosków przez złą semantykę danych.

---

### Etap 4: Miesięczny przegląd finansowy jako tabela decyzyjna

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Rozbudować tabelę miesięczną o dodatkowe kolumny
- `Wystawione`
- `Opłacone`
- `Po terminie`
- `Liczba płacących zawodników`
- opcjonalnie `MRR est.`

2. Dodać wskaźnik zmiany miesiąc do miesiąca
- kwotowo,
- procentowo,
- albo obie wersje.

3. Wyróżnić aktualny miesiąc
- wyraźniejszy akcent wizualny.

4. Rozważyć kliknięcie w miesiąc
- przejście do odpowiednio przefiltrowanych `Faktur`.

#### Pliki

- `app/coach/analytics/page.tsx`

#### Kryteria ukończenia

- tabela miesięczna pomaga porównywać jakość miesięcy,
- nie jest tylko archiwum agregatów.

---

### Etap 5: Analityka zawodników i wartości klienta

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Rozbudować ranking zawodników o:
- ostatnią płatność,
- średnią miesięczną wartość,
- długość współpracy,
- liczbę miesięcy płatnych,
- zaległości, jeśli istnieją.

2. Dodać dodatkowe rankingi
- najwyższy aktualny MRR per zawodnik,
- największy lifetime value,
- zawodnicy z zaległościami.

3. Zamienić samo `Od` na bardziej użyteczny kontekst
- np. staż współpracy.

4. Umożliwić szybsze przejścia do profilu i filtrowanych faktur zawodnika.

#### Pliki

- `app/coach/analytics/page.tsx`

#### Kryteria ukończenia

- trener widzi, którzy zawodnicy są najważniejsi biznesowo,
- ranking daje realną wartość decyzyjną.

---

### Etap 6: Pakiety jako realna analityka oferty

Priorytet: **Średni do wysokiego**
Ryzyko: **Niskie**

#### Zakres

1. Rozbudować sekcję `Pakiety`
- liczba zawodników,
- udział w bazie,
- estymowany MRR,
- opłacone przychody historyczne,
- udział w przychodzie.

2. Rozważyć ranking pakietów
- najlepszy po przychodzie,
- najczęściej wybierany,
- najwyższa średnia wartość.

3. Dodać wizualizację udziału pakietów
- nie tylko w liczbie zawodników,
- ale też w przychodzie.

#### Pliki

- `app/coach/analytics/page.tsx`

#### Kryteria ukończenia

- sekcja `Pakiety` pomaga ocenić ofertę,
- nie pokazuje już tylko rozkładu klientów.

---

### Etap 7: Retencja i churn

Priorytet: **Wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Dodać podstawowe KPI retencyjne
- nowi zawodnicy w 30 dni,
- archiwizowani w 30 dni,
- saldo netto,
- churn miesięczny.

2. Dodać prosty wykres lub tabelę retencji
- nowi vs odchodzący per miesiąc,
- aktywni płacący per miesiąc.

3. Rozważyć prosty model segmentacji
- `aktywny płacący`
- `aktywny bez płatności`
- `archiwalny`

4. Powiązać retencję z pakietami i przychodem
- które pakiety rosną,
- które tracą klientów.

#### Pliki

- `app/coach/analytics/page.tsx`
- ewentualnie helpery z danymi zawodników

#### Kryteria ukończenia

- trener widzi, czy biznes rośnie, stoi czy traci klientów,
- ekran pokazuje nie tylko pieniądze, ale też zdrowie bazy.

---

### Etap 8: Filtry czasu i segmentacja widoku

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Dodać filtry czasu
- bieżący miesiąc,
- ostatnie 3 miesiące,
- ostatnie 6 miesięcy,
- ostatnie 12 miesięcy,
- cały okres.

2. Dodać segmentację widoku
- wszyscy zawodnicy,
- aktywni,
- archiwalni,
- wybrany pakiet.

3. Rozważyć filtrowanie po zawodniku
- dla głębszego drill-down.

4. Spiąć filtrowanie z URL
- żeby widok dało się odtworzyć i podlinkować.

#### Pliki

- `app/coach/analytics/page.tsx`

#### Kryteria ukończenia

- trener może szybko zmieniać perspektywę czasową i biznesową,
- ekran staje się bardziej elastyczny.

---

### Etap 9: Architektura danych i spójność między modułami

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Wydzielić wspólną warstwę helperów/agregatów
- np. `lib/finance-metrics.ts`
- albo `lib/analytics-data.ts`

2. Ujednolicić:
- logikę `overdue`,
- logikę `pending`,
- sposób liczenia przychodu,
- sposób liczenia agregatów miesięcznych.

3. Rozważyć osobne DTO dla ekranu analityki
- gotowe struktury widokowe,
- mniej logiki bezpośrednio w `page.tsx`.

4. Dodać testy logiki finansowej
- statusy,
- miesiące,
- zaległości,
- przychód opłacony,
- delta miesiąc do miesiąca.

#### Pliki

- `app/coach/analytics/page.tsx`
- nowe helpery w `lib/`
- miejsca współdzielone z `Dashboard` i `Faktury`

#### Kryteria ukończenia

- ta sama faktura jest interpretowana tak samo wszędzie w systemie,
- logika finansowa jest łatwiejsza do utrzymania.

---

### Etap 10: Final polish UX/UI

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Dopracować hierarchię wizualną
- co jest najważniejsze,
- co jest ryzykiem,
- co jest tylko informacją.

2. Dopracować gęstość informacji
- tak, aby ekran nie był ani pusty, ani zbyt tabelaryczny.

3. Dopracować wykresy
- podpisy,
- kolory,
- zachowanie przy małej liczbie danych,
- stany puste.

4. Dopracować mikrocopy
- KPI,
- sekcje,
- puste stany,
- nazwy trendów.

5. Dopracować accessibility
- kontrast,
- focus states,
- czytelność tabel i wykresów.

#### Pliki

- `app/coach/analytics/page.tsx`

#### Kryteria ukończenia

- ekran wygląda jak gotowy moduł analityczny,
- nie sprawia już wrażenia prostego raportu z danych.

---

### Rekomendowana kolejność wdrożenia

1. Etap 1: Uporządkowanie semantyki danych finansowych
2. Etap 2: Przebudowa górnych KPI
3. Etap 3: Trendy miesięczne i wykresy, które coś znaczą
4. Etap 4: Miesięczny przegląd finansowy jako tabela decyzyjna
5. Etap 5: Analityka zawodników i wartości klienta
6. Etap 6: Pakiety jako realna analityka oferty
7. Etap 7: Retencja i churn
8. Etap 8: Filtry czasu i segmentacja widoku
9. Etap 9: Architektura danych i spójność między modułami
10. Etap 10: Final polish UX/UI

---

### Minimalny zestaw o największym wpływie

Jeśli chcemy szybki, mocny upgrade `Analityki`, największy efekt dadzą:

- Etap 1
- Etap 2
- Etap 3
- Etap 5
- Etap 6

---

## Ustawienia

### Cel sekcji

Podstrona `Ustawienia` ma być centrum konfiguracji konta trenera i podstawowych ustawień biznesowych, a nie tylko stroną „profil + dodatki”.

Po pełnym wdrożeniu ta sekcja ma odpowiadać na trzy pytania:

- jak zarządzam swoim kontem i bezpieczeństwem,
- gdzie konfiguruję podstawy działania biznesu,
- jak uporządkowane są ustawienia operacyjne i dane pomocnicze.

---

### Aktualna ocena

Sekcja ma już dobrą bazę:

- działa profil trenera,
- działa zmiana awatara,
- działa zmiana nazwy, emaila i hasła,
- pakiety i cennik są dostępne z poziomu ustawień,
- archiwum zawodników pozwala szukać i przywracać osoby do aktywnej bazy.

Największe braki:

- sekcja miesza trzy różne typy rzeczy:
  - konto,
  - biznes,
  - operacje,
- zakładki nie synchronizują się z URL,
- brakuje ustawień firmy, rozliczeń, powiadomień i bezpieczeństwa jako osobnych obszarów,
- część zapisów nie odświeża globalnego UI wystarczająco jasno,
- `Pakiety` i `Archiwum` nie są jeszcze dobrze osadzone semantycznie jako część `Ustawień`.

---

### Definicja ukończenia

Sekcję `Ustawienia` uznajemy za domkniętą, gdy:

- użytkownik rozumie strukturę ustawień i to, dlaczego konkretne obszary są właśnie tutaj,
- konto, bezpieczeństwo, biznes i operacje są logicznie rozdzielone,
- zakładki zachowują kontekst przez URL,
- zmiana danych jest przewidywalna i od razu widoczna w UI,
- są dostępne podstawowe ustawienia firmy i rozliczeń,
- sekcja wygląda jak dojrzałe centrum konfiguracji konta trenera.

---

### Etap 1: Uporządkowanie architektury sekcji

Priorytet: **Krytyczny**
Ryzyko: **Średnie**

#### Zakres

1. Podzielić sekcję na logiczne grupy
- `Konto`
- `Biznes`
- `Archiwum` lub `Operacje`

2. Ustalić docelową rolę zakładki `Pakiety i cennik`
- czy zostaje częścią `Ustawień`,
- czy powinna być osobnym modułem.

3. Ustalić docelową rolę zakładki `Archiwum zawodników`
- czy zostaje częścią `Ustawień`,
- czy lepiej pasuje do modułu `Zawodnicy`.

4. Dodać spójną informację architektoniczną
- dlaczego konkretne funkcje są właśnie tutaj.

#### Pliki

- `app/coach/settings/_components/SettingsClient.tsx`
- ewentualnie routing do wydzielenia osobnych modułów

#### Kryteria ukończenia

- użytkownik rozumie, czym są `Ustawienia`,
- struktura sekcji jest logiczna i spójna.

---

### Etap 2: Synchronizacja zakładek z URL

Priorytet: **Bardzo wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Dodać URL-sync zakładek
- `?tab=profile`
- `?tab=packages`
- `?tab=archive`
- później także kolejne zakładki.

2. Odczytywać aktywną zakładkę z URL przy wejściu na stronę.

3. Aktualizować URL po ręcznym przełączaniu zakładek.

4. Zachowywać aktywną zakładkę po refreshu i przy wejściu z innych miejsc.

#### Pliki

- `app/coach/settings/page.tsx`
- `app/coach/settings/_components/SettingsClient.tsx`

#### Kryteria ukończenia

- aktywna zakładka nie ginie po odświeżeniu,
- można podlinkować konkretną część ustawień.

---

### Etap 3: Konto trenera jako pełniejszy moduł profilu

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Uporządkować strukturę zakładki `Profil`
- dane podstawowe,
- avatar,
- email,
- plan,
- bezpieczeństwo.

2. Rozważyć dodanie brakujących pól konta
- telefon,
- nazwa wyświetlana,
- ewentualnie tytuł/bio, jeśli kiedyś będzie potrzebne.

3. Dopracować blok planu
- nazwa planu,
- główne możliwości lub limity,
- jasna informacja co zrobić przy chęci zmiany.

4. Dodać lepsze komunikaty po zapisach
- co dokładnie zostało zmienione,
- czy potrzeba dodatkowego kroku.

#### Pliki

- `app/coach/settings/_components/SettingsClient.tsx`
- `lib/actions/profile.ts`

#### Kryteria ukończenia

- profil wygląda jak pełnoprawny moduł konta,
- nie jest już tylko zbiorem prostych formularzy.

---

### Etap 4: Awatar i tożsamość wizualna konta

Priorytet: **Średni do wysokiego**
Ryzyko: **Niskie**

#### Zakres

1. Uczytelnić stan awatara
- `aktualny`,
- `nowy podgląd`,
- `do usunięcia`.

2. Dodać mikrocopy wyjaśniające
- co zostanie zapisane,
- czy wybrano emoji,
- czy wybrano plik,
- czy avatar zostanie usunięty.

3. Rozważyć uproszczenie interakcji
- osobno wybór emoji,
- osobno upload zdjęcia,
- osobno przywrócenie domyślnego stanu.

4. Dopracować odświeżanie UI po zapisie
- tak, aby zmiana była od razu widoczna globalnie.

#### Pliki

- `app/coach/settings/_components/SettingsClient.tsx`
- `lib/actions/profile.ts`

#### Kryteria ukończenia

- użytkownik dokładnie rozumie, jaki stan awatara zapisze,
- zarządzanie awatarem jest w 100% czytelne.

---

### Etap 5: Email i hasło jako osobna sekcja bezpieczeństwa

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Wydzielić blok `Bezpieczeństwo`
- email logowania,
- hasło,
- w przyszłości 2FA,
- w przyszłości sesje.

2. Dopracować zmianę emaila
- wyjaśnić proces potwierdzenia,
- doprecyzować co się dzieje do czasu kliknięcia linku,
- dać bardziej czytelny komunikat sukcesu.

3. Dopracować zmianę hasła
- wymagania,
- lepszy kontekst bezpieczeństwa,
- opcjonalnie wskaźnik siły hasła.

4. Rozważyć dodatkowe elementy bezpieczeństwa
- ostatnia zmiana hasła,
- wylogowanie z innych sesji,
- przyszłe 2FA.

#### Pliki

- `app/coach/settings/_components/SettingsClient.tsx`
- `lib/actions/profile.ts`

#### Kryteria ukończenia

- email i hasło są pokazane jako element bezpieczeństwa konta,
- użytkownik lepiej rozumie konsekwencje zmian.

---

### Etap 6: Dane firmy i rozliczeń

Priorytet: **Bardzo wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Dodać sekcję `Dane firmy`
- nazwa firmy,
- NIP,
- adres,
- miasto / kod / kraj.

2. Dodać sekcję `Dane do faktur`
- wystawca,
- dane kontaktowe,
- pola potrzebne do dokumentów.

3. Rozważyć dodatkowe pola
- numer konta,
- telefon firmowy,
- logo,
- dane widoczne na fakturach.

4. Spiąć te dane z modułem `Faktury`
- tak, aby nie były rozproszone po systemie.

#### Pliki

- `app/coach/settings/_components/SettingsClient.tsx`
- nowe komponenty settings/business
- model danych i akcje profilu/biznesu

#### Kryteria ukończenia

- trener może skonfigurować podstawowe dane firmy z poziomu panelu,
- `Ustawienia` zaczynają wspierać realny biznes.

---

### Etap 7: Powiadomienia i preferencje aplikacji

Priorytet: **Średni**
Ryzyko: **Średnie**

#### Zakres

1. Dodać sekcję `Powiadomienia`
- wiadomości,
- feedback,
- płatności,
- ważne alerty.

2. Dodać preferencje działania aplikacji
- domyślne widoki,
- zachowanie dashboardu,
- preferencje robocze.

3. Rozróżnić preferencje:
- per konto,
- per urządzenie,
- per przeglądarka.

4. Spiąć to z istniejącymi mechanizmami
- push subscription,
- dashboard prefs.

#### Pliki

- `app/coach/settings/_components/SettingsClient.tsx`
- ewentualne nowe akcje/settings helpers

#### Kryteria ukończenia

- użytkownik może dostosować działanie systemu do swojego stylu pracy,
- `Ustawienia` stają się realnym centrum preferencji.

---

### Etap 8: Pakiety i cennik jako świadoma część ustawień biznesowych

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Jeśli `Pakiety` zostają w `Ustawieniach`
- opisać tę zakładkę jako konfigurację oferty,
- nadać jej bardziej biznesowy kontekst.

2. Dodać krótkie intro do zakładki
- po co są pakiety,
- na co wpływają.

3. Upewnić się, że ten moduł pasuje semantycznie do całej sekcji.

4. Alternatywnie przygotować ścieżkę wydzielenia
- osobny moduł `Pakiety`.

#### Pliki

- `app/coach/settings/_components/SettingsClient.tsx`
- `app/coach/packages/_components/PackagesClient`

#### Kryteria ukończenia

- `Pakiety` nie wyglądają już jak przypadkowo osadzony moduł,
- użytkownik rozumie ich miejsce w produkcie.

---

### Etap 9: Archiwum zawodników jako świadoma operacja

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Ustalić docelowe miejsce archiwum
- w `Ustawieniach`,
- albo w `Zawodnikach`.

2. Jeśli zostaje tutaj
- nadać mu bardziej operacyjny opis,
- wyjaśnić rolę archiwizacji.

3. Rozważyć lepsze dane w archiwum
- powód archiwizacji,
- ostatnia aktywność,
- ostatnia płatność,
- szybsze wejście w kontekst.

4. Dodać lepsze empty states i potwierdzenia przy przywracaniu.

#### Pliki

- `app/coach/settings/_components/SettingsArchiveTab.tsx`
- `app/coach/settings/_components/SettingsClient.tsx`

#### Kryteria ukończenia

- archiwum ma czytelne miejsce w strukturze produktu,
- nie wygląda jak przypadkowa zakładka w ustawieniach.

---

### Etap 10: Spójność zapisów, revalidacji i aktualizacji UI

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Przejrzeć revalidacje po:
- zmianie nazwy,
- zmianie awatara,
- zmianie emaila,
- zmianie hasła.

2. Upewnić się, że aktualizują się wszystkie miejsca zależne
- topbar,
- sidebar,
- widok profilu,
- inne elementy korzystające z danych trenera.

3. Dodać lokalne aktualizacje UI po sukcesie
- nie tylko komunikat,
- ale też odświeżony widok danych.

4. Ujednolicić komunikaty sukcesu i błędu
- tak, aby każda akcja zachowywała się równie przewidywalnie.

#### Pliki

- `lib/actions/profile.ts`
- `app/coach/settings/_components/SettingsClient.tsx`
- miejsca globalne zależne od danych trenera

#### Kryteria ukończenia

- po zapisach użytkownik od razu widzi właściwy stan,
- sekcja sprawia wrażenie dopracowanej i niezawodnej.

---

### Etap 11: Rozbicie komponentów i przygotowanie pod rozwój

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Rozbić `SettingsClient` na mniejsze komponenty
- `ProfileTab`
- `SecuritySection`
- `PlanSection`
- `AvatarSection`
- osobne panele zakładek.

2. Wydzielić helpery mikro-logiki
- szczególnie dla awatara i formularzy.

3. Przygotować sekcję na rozbudowę
- dane firmy,
- powiadomienia,
- bezpieczeństwo,
- przyszłe integracje.

#### Pliki

- `app/coach/settings/_components/SettingsClient.tsx`
- nowe komponenty w `app/coach/settings/_components/`

#### Kryteria ukończenia

- rozbudowa sekcji nie powoduje bałaganu,
- kod jest gotowy na kolejne obszary ustawień.

---

### Etap 12: Final polish UX/UI

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Dopracować hierarchię zakładek
- nazwy,
- opisy,
- grupowanie.

2. Dopracować gęstość i rytm sekcji
- żeby ekran był czytelny i spokojny.

3. Dopracować mikrocopy
- plan,
- email,
- hasło,
- avatar,
- archiwum,
- pakiety.

4. Dopracować accessibility
- focus states,
- aria labels,
- kontrast,
- obsługa klawiatury.

5. Sprawdzić zachowanie na mniejszych szerokościach
- zakładki,
- formularze,
- tabela archiwum.

#### Pliki

- `app/coach/settings/_components/SettingsClient.tsx`
- `app/coach/settings/_components/SettingsArchiveTab.tsx`
- nowe podkomponenty ustawień

#### Kryteria ukończenia

- `Ustawienia` wyglądają jak domknięte centrum konfiguracji konta i biznesu,
- nie sprawiają już wrażenia zlepku przypadkowych funkcji.

---

### Rekomendowana kolejność wdrożenia

1. Etap 1: Uporządkowanie architektury sekcji
2. Etap 2: Synchronizacja zakładek z URL
3. Etap 3: Konto trenera jako pełniejszy moduł profilu
4. Etap 4: Awatar i tożsamość wizualna konta
5. Etap 5: Email i hasło jako osobna sekcja bezpieczeństwa
6. Etap 6: Dane firmy i rozliczeń
7. Etap 7: Powiadomienia i preferencje aplikacji
8. Etap 8: Pakiety i cennik jako świadoma część ustawień biznesowych
9. Etap 9: Archiwum zawodników jako świadoma operacja
10. Etap 10: Spójność zapisów, revalidacji i aktualizacji UI
11. Etap 11: Rozbicie komponentów i przygotowanie pod rozwój
12. Etap 12: Final polish UX/UI

---

### Minimalny zestaw o największym wpływie

Jeśli chcemy szybki, mocny upgrade `Ustawień`, największy efekt dadzą:

- Etap 1
- Etap 2
- Etap 5
- Etap 6
- Etap 10

---

## Pomoc

### Cel sekcji

Podstrona `Pomoc` ma być centrum wsparcia użytkownika, a nie tylko statycznym FAQ z formularzem kontaktowym.

Po pełnym wdrożeniu ta sekcja ma odpowiadać na trzy pytania:

- jak najszybciej znaleźć odpowiedź na problem,
- kiedy przejść do konkretnego miejsca w panelu,
- kiedy i jak najlepiej skontaktować się z supportem.

---

### Aktualna ocena

Sekcja ma już dobrą bazę:

- łączy FAQ, szybkie skróty i kontakt,
- ma wyszukiwarkę i kategorie pytań,
- prowadzi do konkretnych miejsc w panelu przez CTA,
- ma formularz kontaktowy z walidacją,
- ma prosty mechanizm oceny odpowiedzi `Czy to pomogło?`.

Największe braki:

- pomoc jest w dużej mierze statyczna i nie zna kontekstu użytkownika,
- część FAQ może szybko się starzeć względem zmian produktu,
- filtrowanie FAQ ma trochę redundantnych elementów,
- ścieżka eskalacji z FAQ do kontaktu jest za słabo poprowadzona,
- feedback `Czy to pomogło?` jest dziś bardziej kosmetyczny niż realnie użyteczny.

---

### Definicja ukończenia

Sekcję `Pomoc` uznajemy za domkniętą, gdy:

- FAQ jest aktualne i zgodne z bieżącym produktem,
- użytkownik szybko znajduje odpowiedź albo trafia do właściwej akcji,
- kontakt z supportem jest dobrze opisany i sensownie poprowadzony,
- pomoc umie lepiej reagować na kontekst użytkownika,
- treści są łatwe do utrzymania i rozwijania,
- sekcja wygląda jak dojrzałe centrum wsparcia, a nie strona informacyjna v1.

---

### Etap 1: Audyt i aktualizacja treści FAQ

Priorytet: **Krytyczny**
Ryzyko: **Niskie**

#### Zakres

1. Przejrzeć wszystkie pytania i odpowiedzi
- `Feedback`
- `Czat`
- `Faktury`
- `Pakiety`
- `Konto`
- `Plan`
- `Zawodnicy`

2. Usunąć lub poprawić treści:
- nieprecyzyjne,
- zbyt ogólne,
- niespójne z obecnym produktem.

3. Dopisać dokładniejsze odpowiedzi dla obszarów krytycznych
- planner,
- feedback,
- czat,
- faktury,
- ustawienia konta,
- dostęp zawodnika.

4. Ustalić standard odpowiedzi FAQ
- krótka odpowiedź,
- kontekst,
- konkretne CTA.

#### Pliki

- `app/coach/help/page.tsx`
- docelowo plik z wydzieloną treścią pomocy

#### Kryteria ukończenia

- FAQ jest zgodne z aktualnym produktem,
- odpowiedzi nie wprowadzają użytkownika w błąd.

---

### Etap 2: Lepsza architektura treści pomocy

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Wydzielić treści do osobnej struktury
- np. `lib/help-content.ts`
- albo `app/coach/help/content.ts`

2. Rozdzielić:
- kategorie,
- FAQ,
- quick actions,
- wyróżnione treści.

3. Przygotować strukturę pod dalszy rozwój
- łatwe dopisywanie wpisów,
- łatwa edycja,
- możliwość reużycia w innych miejscach.

4. Rozważyć metadane wpisu
- `category`
- `priority`
- `keywords`
- `href`
- `cta`
- `audience`

#### Pliki

- `app/coach/help/page.tsx`
- nowy plik z contentem pomocy

#### Kryteria ukończenia

- treści pomocy nie są już wymieszane z logiką UI,
- sekcja jest łatwiejsza do utrzymania.

---

### Etap 3: FAQ jako lepsza wyszukiwalna baza odpowiedzi

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Uporządkować filtrowanie kategorii
- nie dublować niepotrzebnie selecta i chipów,
- dobrać mechanizm do desktop/mobile.

2. Dodać lepszą strukturę treści
- `Najczęstsze`
- `Na start`
- `Rozwiązywanie problemów`
- `Finanse`
- `Komunikacja`
- `Planowanie`

3. Dodać wyróżnione pytania
- najczęściej używane,
- najważniejsze dla nowych użytkowników.

4. Dodać lepsze fallbacki przy braku wyników
- polecane pytania,
- kontakt,
- szybkie akcje.

#### Pliki

- `app/coach/help/page.tsx`
- plik z contentem pomocy

#### Kryteria ukończenia

- użytkownik łatwo znajduje odpowiedź,
- FAQ skaluje się lepiej przy większej liczbie treści.

---

### Etap 4: Ścieżki pomocy zależne od problemu

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Rozdzielić jasno dwa tryby:
- `Znajdź odpowiedź samodzielnie`
- `Skontaktuj się z nami`

2. Dodać lepsze prowadzenie użytkownika
- kiedy czytać FAQ,
- kiedy przejść do kontaktu.

3. Dodać mikrocopy przy kanałach kontaktu
- email,
- WhatsApp,
- formularz.

4. Dodać blok `Nie znalazłeś odpowiedzi?`
- po FAQ,
- po pustych wynikach,
- po negatywnym feedbacku.

#### Pliki

- `app/coach/help/page.tsx`

#### Kryteria ukończenia

- użytkownik rozumie, kiedy użyć FAQ, a kiedy wsparcia,
- ścieżka eskalacji jest naturalna i czytelna.

---

### Etap 5: Lepsze wykorzystanie feedbacku „Czy to pomogło?”

Priorytet: **Średni do wysokiego**
Ryzyko: **Niskie**

#### Zakres

1. Po kliknięciu `Nie` pokazać od razu działania
- `Napisz do nas`
- `Skopiuj email`
- `Otwórz formularz`
- `Przejdź do odpowiedniego modułu`

2. Rozważyć zapis feedbacku nie tylko lokalnie
- jeśli chcecie mieć realne dane produktowe.

3. Rozważyć prostą analitykę
- które odpowiedzi pomagają,
- które najczęściej nie pomagają.

4. Dodać lepsze komunikaty po oddaniu oceny.

#### Pliki

- `app/coach/help/page.tsx`
- opcjonalnie nowy endpoint/warstwa zapisu feedbacku pomocy

#### Kryteria ukończenia

- feedback użytkownika ma realną wartość,
- `Nie` nie kończy się martwym kliknięciem.

---

### Etap 6: Szybkie skróty jako realne centrum działań

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Przebudować `Szybkie skróty`
- dodać ważniejsze moduły,
- ograniczyć skróty zbyt generyczne.

2. Rozważyć skróty dynamiczne
- brak pakietów,
- brak zawodników,
- zaległe faktury,
- nieprzeczytane wiadomości,
- nieprzeczytane feedbacki.

3. Lepiej odróżnić skróty:
- częste,
- pomocowe,
- onboardingowe.

#### Pliki

- `app/coach/help/page.tsx`
- ewentualnie warstwa danych kontekstowych

#### Kryteria ukończenia

- szybkie skróty faktycznie skracają drogę do rozwiązania problemu,
- nie są tylko zestawem ogólnych linków.

---

### Etap 7: Dynamiczna pomoc zależna od stanu konta

Priorytet: **Średni**
Ryzyko: **Średnie**

#### Zakres

1. Dodać lekką personalizację treści
- brak zawodników,
- brak pakietów,
- brak planów,
- zaległe faktury,
- nieużywany feedback,
- nieużywany czat.

2. Dodać sekcję
- `Polecane dla Ciebie`
- albo `Na początek`.

3. Rozważyć lekkie onboardingowe podpowiedzi dla nowych trenerów.

#### Pliki

- `app/coach/help/page.tsx`
- dane kontekstowe z innych modułów

#### Kryteria ukończenia

- użytkownik najpierw widzi te treści, które mają sens dla jego aktualnej sytuacji.

---

### Etap 8: Formularz kontaktowy i ścieżki wsparcia

Priorytet: **Wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Dodać bardziej precyzyjne typy spraw
- błąd techniczny,
- pytanie o funkcję,
- konto,
- rozliczenia,
- sugestia.

2. Dodać lepszy kontekst po wysyłce
- kiedy odpowiadacie,
- jaką drogą,
- co zrobić w pilnej sprawie.

3. Rozważyć automatyczne wypełnienie części danych
- email użytkownika,
- nazwa trenera.

4. Dodać zabezpieczenia formularza
- rate limit,
- honeypot,
- proste antyspamowe mechanizmy.

5. Lepiej komunikować brak konfiguracji formularza
- nie dopiero po nieudanej próbie wysyłki.

#### Pliki

- `app/coach/help/page.tsx`
- `app/api/contact/route.ts`

#### Kryteria ukończenia

- kontakt z supportem jest bardziej profesjonalny i przewidywalny,
- formularz jest odporniejszy na błędy i spam.

---

### Etap 9: Lepszy podział dla nowych i zaawansowanych użytkowników

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Dodać tagi lub sekcje:
- `Na start`
- `Codzienna praca`
- `Rozwiązywanie problemów`
- `Zaawansowane`

2. Wyróżnić kilka ścieżek startowych
- pierwszy zawodnik,
- pierwszy plan,
- pierwszy feedback,
- pierwsza faktura.

3. Rozważyć mini-przewodnik startowy
- 4-5 kroków dla nowych trenerów.

#### Pliki

- `app/coach/help/page.tsx`
- plik z contentem pomocy

#### Kryteria ukończenia

- początkujący i zaawansowany użytkownik szybciej znajdują treści dla siebie.

---

### Etap 10: Final polish UX/UI

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Dopracować hierarchię sekcji
- co jest najważniejsze,
- co jest dodatkiem,
- co jest ścieżką eskalacji.

2. Dopracować długość strony i rytm treści
- aby ekran nie był zbyt ciężki pionowo.

3. Dopracować accordion FAQ
- stan otwarty/zamknięty,
- prezentacja CTA,
- widoczność kategorii.

4. Dopracować mikrocopy
- FAQ,
- kontakt,
- puste stany,
- komunikaty sukcesu i błędu.

5. Dopracować accessibility
- focus states,
- aria labels,
- obsługa klawiatury,
- kontrast.

#### Pliki

- `app/coach/help/page.tsx`

#### Kryteria ukończenia

- `Pomoc` wygląda jak dojrzałe centrum wsparcia,
- nie przypomina już strony informacyjnej v1.

---

### Rekomendowana kolejność wdrożenia

1. Etap 1: Audyt i aktualizacja treści FAQ
2. Etap 2: Lepsza architektura treści pomocy
3. Etap 3: FAQ jako lepsza wyszukiwalna baza odpowiedzi
4. Etap 4: Ścieżki pomocy zależne od problemu
5. Etap 5: Lepsze wykorzystanie feedbacku „Czy to pomogło?”
6. Etap 6: Szybkie skróty jako realne centrum działań
7. Etap 7: Dynamiczna pomoc zależna od stanu konta
8. Etap 8: Formularz kontaktowy i ścieżki wsparcia
9. Etap 9: Lepszy podział dla nowych i zaawansowanych użytkowników
10. Etap 10: Final polish UX/UI

---

### Minimalny zestaw o największym wpływie

Jeśli chcemy szybki, mocny upgrade `Pomocy`, największy efekt dadzą:

- Etap 1
- Etap 3
- Etap 4
- Etap 5
- Etap 8

---

## Zawodnicy

### Cel sekcji

Podstrona `Zawodnicy` ma być centrum zarządzania bazą zawodników: CRM-em, monitorem ryzyk i miejscem szybkiego przechodzenia do działania.

Po pełnym wdrożeniu ta sekcja ma odpowiadać na trzy pytania:

- kto jest w mojej bazie i w jakim jest stanie,
- kto wymaga uwagi teraz,
- jak najszybciej przejść z listy do właściwego działania.

---

### Aktualna ocena

Sekcja ma już bardzo mocną bazę:

- pokazuje szeroki zestaw metryk per zawodnik,
- łączy status, plan, komunikację, feedback, zawody i płatności,
- wspiera własną kolejność zawodników,
- ma dostosowywane kolumny,
- ma własne statusy trenera,
- działa jako bogaty ekran CRM-owo-operacyjny.

Największe braki:

- ekran pokazuje dużo danych, ale za słabo priorytetyzuje, kto wymaga uwagi,
- część etykiet jest szersza niż dane, które za nimi stoją,
- filtry są dobre, ale jeszcze za mało operacyjne,
- search, filtry i sortowanie nie zachowują kontekstu przez URL,
- menu `Akcje` nie wykorzystuje jeszcze pełnego potencjału tego widoku.

---

### Definicja ukończenia

Sekcję `Zawodnicy` uznajemy za domkniętą, gdy:

- trener od razu widzi, którzy zawodnicy wymagają uwagi,
- wskaźniki są semantycznie jasne i wiarygodne,
- filtry odpowiadają realnej pracy CRM i operacyjnej,
- kontekst listy jest zachowywany przez URL,
- z listy da się przejść bezpośrednio do rozwiązania problemu,
- ekran działa jak dojrzałe centrum CRM, a nie tylko bogata tabela.

---

### Etap 1: Uporządkowanie semantyki wskaźników

Priorytet: **Krytyczny**
Ryzyko: **Niskie**

#### Zakres

1. Przejrzeć i doprecyzować wskaźniki:
- `Forma`
- `Realizacja 30 dni`
- `Brak planu`
- `Nieopłacone`

2. Rozważyć zmianę etykiety `Forma`
- np.:
  - `Ostatni sygnał`
  - `Sygnał z feedbacku`

3. Ustalić dokładną definicję `Realizacja 30 dni`
- co wchodzi do `total`,
- jak traktowane są sesje przeszłe i przyszłe,
- jak traktować sesje niezamknięte.

4. Rozdzielić semantycznie płatności
- `oczekujące`
- `po terminie`

#### Pliki

- `app/coach/athletes/page.tsx`
- `app/coach/athletes/_components/AthletesTable.tsx`
- helpery współdzielone z `Dashboard` i `Faktury`

#### Kryteria ukończenia

- wszystkie główne wskaźniki są nazwane zgodnie z logiką danych,
- ekran jest bardziej wiarygodny biznesowo i operacyjnie.

---

### Etap 2: Priorytetyzacja i widok „Wymagają uwagi”

Priorytet: **Bardzo wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Zdefiniować logikę `Wymagają uwagi`
- czerwony sygnał,
- unread feedback,
- unread wiadomości,
- brak planu,
- zaległości płatnicze,
- niska realizacja.

2. Dodać filtr lub preset:
- `Wymagają uwagi`

3. Rozważyć ranking pilności wewnątrz tego widoku
- najpierw krytyczne,
- potem ostrzegawcze,
- potem organizacyjne.

4. Dodać licznik zawodników wymagających działania.

#### Pliki

- `app/coach/athletes/_components/AthletesClient.tsx`
- `app/coach/athletes/_components/AthletesFilters.tsx`
- ewentualnie agregaty danych listy zawodników

#### Kryteria ukończenia

- trener może jednym kliknięciem wejść w listę najważniejszych spraw,
- sekcja odpowiada na pytanie „od kogo dziś zacząć?”.

---

### Etap 3: Lepsze filtry i segmentacja bazy

Priorytet: **Bardzo wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Dodać filtry operacyjne
- `Wymagają uwagi`
- `Bez planu`
- `Nieodpisane`
- `Nieprzeczytane feedbacki`
- `Po terminie`
- `Nowi`
- `Zawody wkrótce`

2. Rozważyć filtry po:
- sygnale,
- realizacji,
- aktywności,
- płatnościach.

3. Umożliwić sensowne łączenie filtrów
- status + pakiet + problem.

4. Nie uzależniać filtra pakietu od widoczności kolumny `Pakiet`.

#### Pliki

- `app/coach/athletes/_components/AthletesClient.tsx`
- `app/coach/athletes/_components/AthletesFilters.tsx`

#### Kryteria ukończenia

- filtry odpowiadają realnym scenariuszom pracy CRM i operacyjnej,
- segmentacja bazy jest dużo bardziej praktyczna.

---

### Etap 4: URL-sync filtrów, wyszukiwania i sortowania

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Dodać URL-sync dla:
- `search`
- `status`
- `package`
- `sort`
- opcjonalnie aktywnych kolumn.

2. Odczytywać stan listy z URL przy wejściu na stronę.

3. Aktualizować URL po zmianie filtrów i sortowania.

4. Zachowywać kontekst po refreshu i przy wejściu z innych miejsc.

#### Pliki

- `app/coach/athletes/page.tsx`
- `app/coach/athletes/_components/AthletesClient.tsx`

#### Kryteria ukończenia

- użytkownik nie traci kontekstu po odświeżeniu,
- lista jest łatwa do linkowania i odtwarzania.

---

### Etap 5: Tabela jako prawdziwy cockpit CRM

Priorytet: **Wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Mocniej wyróżnić rekordy problematyczne
- akcent wiersza,
- badge priorytetu,
- bardziej widoczny stan pilności.

2. Rozważyć przypięcie ważniejszych kolumn
- `Status`
- `Ostatni sygnał`
- `Następna sesja`

3. Dodać sticky header lub poprawić zachowanie przy dłuższej liście.

4. Dopracować komunikację pustych wartości
- tam, gdzie sam `—` jest zbyt mało mówiący.

5. Rozważyć tryb bardziej kompaktowy lub zaawansowany.

#### Pliki

- `app/coach/athletes/_components/AthletesTable.tsx`

#### Kryteria ukończenia

- tabela jest szybsza do skanowania,
- najważniejsze rekordy nie giną wizualnie.

---

### Etap 6: Akcje kontekstowe jako realne skróty do działania

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Rozszerzyć menu `Akcje`
- `Feedback`
- `Zawody`
- `Kopiuj link zawodnika`
- opcjonalnie akcje problemowe zależne od stanu.

2. Dodać akcje kontekstowe
- jeśli unread message → `Otwórz czat`
- jeśli brak planu → `Uzupełnij plan`
- jeśli zaległość → `Przejdź do faktur`
- jeśli czerwony sygnał → `Sprawdź feedback`

3. Dopracować copy akcji
- bardziej zadaniowe i mniej ogólne.

#### Pliki

- `app/coach/athletes/_components/AthletesActionMenu.tsx`
- `app/coach/athletes/_components/AthletesTable.tsx`

#### Kryteria ukończenia

- z listy da się od razu przejść do rozwiązania konkretnego problemu,
- menu `Akcje` realnie skraca pracę trenera.

---

### Etap 7: Statusy zawodników jako pełniejszy system CRM

Priorytet: **Średni do wysokiego**
Ryzyko: **Niskie**

#### Zakres

1. Dopracować UX interakcji statusów
- czytelniej pokazać, że pole jest klikalne i zmienne.

2. Rozważyć lepszy podział statusów
- systemowe,
- własne,
- grupy statusów.

3. Rozważyć tooltipy lub opisy statusów.

4. Dodać sensowniejsze filtrowanie po grupach statusów
- jeśli model statusów urośnie.

#### Pliki

- `app/coach/athletes/_components/AthletesTable.tsx`
- `app/coach/athletes/_components/AthletesFilters.tsx`
- `app/coach/athletes/_components/AthletesStatusMenu.tsx`
- `app/coach/athletes/_components/StatusEditorModal.tsx`

#### Kryteria ukończenia

- statusy są jeszcze bardziej użyteczne jako narzędzie CRM,
- interakcja z nimi jest czytelna i naturalna.

---

### Etap 8: Lepsze modelowanie komunikacji i płatności na liście

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Rozdzielić płatności na:
- `oczekujące`
- `po terminie`

2. Dopracować badge wiadomości i feedbacków
- liczba,
- świeżość,
- czy wymagają reakcji.

3. Rozważyć mały agregat problemów per zawodnik
- np. `2 sygnały`
- albo `pilne`.

4. Lepiej spiąć komunikację i płatności z akcjami kontekstowymi.

#### Pliki

- `app/coach/athletes/page.tsx`
- `app/coach/athletes/_components/AthletesTable.tsx`

#### Kryteria ukończenia

- trener szybciej rozumie, czy problem jest komunikacyjny, coachingowy czy finansowy.

---

### Etap 9: Widoki alternatywne i skalowanie sekcji

Priorytet: **Średni**
Ryzyko: **Średnie**

#### Zakres

1. Rozważyć alternatywne widoki
- `Tabela`
- `Karty`
- opcjonalnie `CRM`.

2. W widoku kartowym pokazać najważniejsze sygnały na pierwszy rzut oka.

3. Rozważyć zapis preferowanego widoku użytkownika.

4. Sprawdzić zachowanie sekcji przy dużej liczbie zawodników.

#### Pliki

- `app/coach/athletes/_components/AthletesClient.tsx`
- nowe komponenty widoków listy

#### Kryteria ukończenia

- sekcja działa dobrze zarówno przy kilku, jak i przy wielu zawodnikach,
- nie jest uzależniona wyłącznie od jednej formy tabeli.

---

### Etap 10: Spójność danych i architektury

Priorytet: **Średni**
Ryzyko: **Średnie**

#### Zakres

1. Wydzielić warstwę agregacji danych listy zawodników
- np. `lib/athletes-list-data.ts`

2. Uporządkować model metryk
- unread messages,
- unread feedback,
- compliance,
- unpaid/overdue,
- next session,
- next race.

3. Ujednolicić semantykę z innymi sekcjami
- `Dashboard`
- `Feedback`
- `Czat`
- `Faktury`

4. Dodać testy logiki kluczowych agregatów.

#### Pliki

- `app/coach/athletes/page.tsx`
- nowe helpery w `lib/`
- miejsca współdzielące te same definicje

#### Kryteria ukończenia

- logika listy zawodników jest spójna i łatwiejsza do rozwijania,
- te same sygnały znaczą to samo w całym systemie.

---

### Etap 11: Final polish UX/UI

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Dopracować hierarchię wizualną tabeli
- co jest krytyczne,
- co informacyjne,
- co pomocnicze.

2. Dopracować gęstość treści
- tak, by ekran nie był ani przeładowany, ani zbyt luźny.

3. Dopracować mikrocopy
- wskaźniki,
- puste stany,
- akcje kontekstowe,
- hinty.

4. Dopracować accessibility
- focus states,
- aria labels,
- obsługa klawiatury,
- kontrast.

5. Sprawdzić zachowanie na mniejszych szerokościach
- przewijalność,
- czytelność,
- kolejność priorytetów.

#### Pliki

- `app/coach/athletes/_components/AthletesClient.tsx`
- `app/coach/athletes/_components/AthletesTable.tsx`
- `app/coach/athletes/_components/AthletesFilters.tsx`
- powiązane podkomponenty

#### Kryteria ukończenia

- sekcja wygląda i działa jak dojrzałe centrum CRM dla trenera,
- nie jest już tylko bogatą tabelą z metrykami.

---

### Rekomendowana kolejność wdrożenia

1. Etap 1: Uporządkowanie semantyki wskaźników
2. Etap 2: Priorytetyzacja i widok „Wymagają uwagi”
3. Etap 3: Lepsze filtry i segmentacja bazy
4. Etap 4: URL-sync filtrów, wyszukiwania i sortowania
5. Etap 5: Tabela jako prawdziwy cockpit CRM
6. Etap 6: Akcje kontekstowe jako realne skróty do działania
7. Etap 7: Statusy zawodników jako pełniejszy system CRM
8. Etap 8: Lepsze modelowanie komunikacji i płatności na liście
9. Etap 9: Widoki alternatywne i skalowanie sekcji
10. Etap 10: Spójność danych i architektury
11. Etap 11: Final polish UX/UI

---

### Minimalny zestaw o największym wpływie

Jeśli chcemy szybki, mocny upgrade `Zawodników`, największy efekt dadzą:

- Etap 1
- Etap 2
- Etap 3
- Etap 4
- Etap 6

---

## Panel zawodnika

### Cel sekcji

Panel zawodnika ma być najważniejszym ekranem roboczym trenera dla jednej osoby.

Po pełnym wdrożeniu ta sekcja ma odpowiadać na trzy pytania:

- jaki jest aktualny stan zawodnika i współpracy,
- co wymaga reakcji teraz,
- do której zakładki i jakiej akcji powinienem przejść od razu.

---

### Aktualna ocena

Sekcja jest już bardzo mocna i ma dobry fundament:

- serwer ładuje pełny kontekst zawodnika,
- zakładki są dobrze dobrane,
- URL obsługuje `?tab=...`,
- header daje szeroki skrót stanu zawodnika,
- `Powiadomienia` zbierają najważniejsze sygnały,
- link zawodnika i status dostępu są sensownie osadzone produktowo.

Największe braki:

- header pokazuje dużo, ale nie buduje jeszcze wystarczająco silnej hierarchii priorytetów,
- `Powiadomienia` są bardziej podsumowaniem niż listą zadań,
- semantyka części skrótów jest zbyt szeroka lub myląca,
- skróty i alerty nie prowadzą jeszcze wystarczająco dobrze do konkretnej akcji,
- finanse w górnym skrócie nadal mieszają `pending` i `overdue`.

---

### Definicja ukończenia

Sekcję `Panel zawodnika` uznajemy za domkniętą, gdy:

- trener po kilku sekundach rozumie ogólny stan współpracy z zawodnikiem,
- alerty i powiadomienia prowadzą bezpośrednio do właściwej zakładki i działania,
- header ma jednoznaczną semantykę i nie miesza typów statusów,
- finanse, kontakt, plan i aktywność są pokazane jasno i bez skrótów myślowych,
- ekran pozostaje bogaty funkcjonalnie, ale jest lżejszy i bardziej zadaniowy w odbiorze.

---

### Etap 1: Uporządkowanie semantyki górnego headera

Priorytet: **Krytyczny**
Ryzyko: **Średnie**

#### Zakres

1. Zmienić semantykę statusu dostępu zawodnika
- zamiast:
  - `Aktywny`
  - `Nieaktywny`
- użyć czegoś bliższego prawdzie:
  - `Aktywna sesja panelu`
  - `Brak aktywnej sesji`
  - albo `Panel aktywny / brak aktywnej sesji`

2. Rozdzielić komunikacyjnie:
- status współpracy zawodnika,
- status dostępu do panelu zawodnika.

3. Dopracować skrót `Finanse`
- rozróżnić:
  - `oczekujące`
  - `po terminie`

4. Przemyśleć kartę `Feedback i wiadomości`
- zdecydować, czy zostaje wspólna,
- czy powinna być rozdzielona,
- albo czy ma mieć lepszą wewnętrzną hierarchię.

#### Pliki

- `app/coach/athletes/[id]/_components/AthleteProfileClient.tsx`

#### Kryteria ukończenia

- wszystkie górne skróty są semantycznie jednoznaczne,
- użytkownik nie interpretuje statusu sesji jako ogólnego statusu współpracy.

---

### Etap 2: Powiadomienia jako realna lista zadań

Priorytet: **Bardzo wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Każdy element `Powiadomień` powinien mieć:
- poziom pilności,
- powód,
- krótki kontekst,
- CTA.

2. Dodać CTA zależne od typu problemu
- brak planu -> `Otwórz plan`
- unread feedback -> `Otwórz feedback`
- unread wiadomości -> `Otwórz czat`
- płatności -> `Otwórz finanse`
- start -> `Otwórz zawody`
- kontuzja -> `Otwórz dane` albo `Notatki`

3. Rozważyć pokazanie 2-3 najważniejszych alertów już w headerze bez otwierania modala.

4. Dodać sortowanie alertów:
- czerwone,
- pomarańczowe,
- żółte,
- informacyjne.

#### Pliki

- `app/coach/athletes/[id]/_components/AthleteProfileClient.tsx`
- ewentualne nowe podkomponenty alertów

#### Kryteria ukończenia

- `Powiadomienia` działają jak task list, a nie tylko jak lista problemów,
- z każdego alertu da się przejść bezpośrednio do właściwej zakładki lub działania.

---

### Etap 3: Header jako panel szybkich działań

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Dodać szybkie akcje:
- `Plan`
- `Feedback`
- `Finanse`
- `Zawody`
- opcjonalnie `Dane`

2. Rozważyć akcje dynamiczne:
- jeśli są unread wiadomości -> mocniejszy `Chat`
- jeśli unread feedback -> mocniejszy `Feedback`
- jeśli brak planu -> mocniejszy `Plan`

3. Zachować prostotę
- nie robić z headera mini-dashboardu,
- ograniczyć się do 3-4 najlepszych skrótów.

#### Pliki

- `app/coach/athletes/[id]/_components/AthleteProfileClient.tsx`

#### Kryteria ukończenia

- trener może z headera od razu wejść do najczęstszych działań,
- skróty są kontekstowe i wspierają realny workflow.

---

### Etap 4: Lepszy blok dostępu zawodnika i linku zaproszenia

Priorytet: **Wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Rozdzielić w jednym miejscu:
- czy zawodnik użył zaproszenia,
- czy ma aktywną sesję,
- kiedy był ostatnio widziany,
- czy panel był kiedykolwiek użyty.

2. Dodać bardziej czytelne stany:
- `Nie użył jeszcze zaproszenia`
- `Korzystał wcześniej, ale nie ma aktywnej sesji`
- `Aktywnie korzysta`

3. Dodać szybkie akcje:
- `Kopiuj link`
- `Pokaż link`
- opcjonalnie `Wyślij ponownie` albo `Skopiuj wiadomość`

4. Rozważyć osobny blok `Dostęp zawodnika`
- bardziej czytelny niż obecne rozproszenie statusów.

#### Pliki

- `app/coach/athletes/[id]/_components/AthleteProfileClient.tsx`

#### Kryteria ukończenia

- status dostępu zawodnika jest czytelny bez domyślania się,
- trener rozumie, czy problem dotyczy onboardingu, czy aktywnego użytkowania panelu.

---

### Etap 5: Lepsze podsumowanie stanu współpracy

Priorytet: **Wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Dodać mały blok `Status współpracy` albo `Stan zawodnika`
- plan uzupełniony / brak planu,
- ostatni sygnał,
- kontakt,
- finanse,
- dostęp do panelu.

2. Rozważyć jednozdaniowe summary
- np.:
  - `Plan wymaga uzupełnienia, czeka 1 feedback i 1 wiadomość`
  - `Spokojny stan, brak zaległości i brak pilnych sygnałów`

3. Ustalić ton podsumowania:
- zielony / spokojny,
- ostrzegawczy,
- krytyczny.

#### Pliki

- `app/coach/athletes/[id]/_components/AthleteProfileClient.tsx`
- ewentualny nowy komponent summary

#### Kryteria ukończenia

- trener po kilku sekundach rozumie ogólny stan współpracy z zawodnikiem,
- górna część ekranu daje syntetyczny obraz bez wchodzenia w zakładki.

---

### Etap 6: Lepsze wejście do zakładek z kontekstu

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Linkować alerty i skróty bezpośrednio do konkretnych zakładek
- `?tab=feedback`
- `?tab=finance`
- `?tab=races`
- `?tab=plan`
- `?tab=data`

2. Rozważyć dodatkowe parametry kontekstu
- `highlight=...`
- `section=...`

3. Upewnić się, że wejścia z innych ekranów też potrafią otworzyć właściwą zakładkę panelu zawodnika.

#### Pliki

- `app/coach/athletes/[id]/page.tsx`
- `app/coach/athletes/[id]/_components/AthleteProfileClient.tsx`
- miejsca linkujące z innych sekcji

#### Kryteria ukończenia

- problem wykryty na górze profilu otwiera właściwe miejsce jednym kliknięciem,
- wejścia z innych modułów zachowują kontekst zawodnika i zakładki.

---

### Etap 7: Spójność finansów i semantyki płatności

Priorytet: **Wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Rozdzielić w summary:
- `oczekujące`
- `po terminie`

2. Dodać lepszy komunikat finansowy w headerze
- `1 po terminie`
- `2 oczekujące`
- `Brak zaległości`

3. Ujednolicić semantykę z:
- `Faktury`
- `Dashboard`
- `Zawodnicy`

4. Rozważyć szybki skrót do konkretnego widoku finansowego zawodnika.

#### Pliki

- `app/coach/athletes/[id]/_components/AthleteProfileClient.tsx`
- współdzielona logika finansowa w `lib/` jeśli powstanie

#### Kryteria ukończenia

- finanse nie są już pokazywane jako zbyt szerokie `otwarte`,
- trener od razu widzi, czy problem jest miękki czy pilny finansowo.

---

### Etap 8: Lepsze wykorzystanie danych o treningu i aktywności

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Dopracować skrót `Ostatni trening`
- dodać bardziej czytelny kontekst:
  - typ,
  - data,
  - jak dawno,
  - feedback jeśli istnieje

2. Dopracować `Najbliższy start`
- mocniejszy akcent, jeśli start jest bardzo blisko,
- CTA do zakładki `Zawody`

3. Rozważyć skrót `Najbliższa sesja`
- jeśli okaże się ważniejszy niż część obecnych boxów.

#### Pliki

- `app/coach/athletes/[id]/_components/AthleteProfileClient.tsx`
- `app/coach/athletes/[id]/page.tsx`

#### Kryteria ukończenia

- skróty sportowe są równie użyteczne jak komunikacyjne i finansowe,
- header lepiej wspiera coachingowy rytm pracy.

---

### Etap 9: Spójność z zakładkami i architekturą danych

Priorytet: **Średni**
Ryzyko: **Średnie**

#### Zakres

1. Wydzielić logikę headera i summary do osobnych komponentów
- np. `AthleteProfileHeader`
- `AthleteAttentionPanel`

2. Wydzielić logikę derived state
- `attentionItems`
- summary cards
- lookup mapy feedbacku

3. Ujednolicić logikę dat
- używać `getBusinessToday()` konsekwentnie,
- nie mieszać z `new Date().toISOString().slice(0, 10)`.

4. Ograniczyć `select('*')` tam, gdzie niepotrzebne.

#### Pliki

- `app/coach/athletes/[id]/page.tsx`
- `app/coach/athletes/[id]/_components/AthleteProfileClient.tsx`
- nowe podkomponenty profilu zawodnika

#### Kryteria ukończenia

- panel jest bardziej modularny i mniej kruchy,
- logika dat i agregatów jest spójna z resztą systemu.

---

### Etap 10: Final polish UX/UI

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Dopracować hierarchię wizualną headera
- co jest najważniejsze,
- co ostrzegawcze,
- co pomocnicze.

2. Dopracować rytm i gęstość kart summary
- żeby nie były zbyt równe i zbyt płaskie.

3. Dopracować mikrocopy
- status dostępu,
- powiadomienia,
- finanse,
- link zawodnika,
- puste stany.

4. Dopracować accessibility
- focus states,
- aria labels,
- kontrast,
- interaktywność badge i przycisków.

5. Sprawdzić zachowanie na mniejszych szerokościach
- header,
- summary cards,
- pasek zakładek.

#### Pliki

- `app/coach/athletes/[id]/_components/AthleteProfileClient.tsx`
- powiązane komponenty zakładek i headera

#### Kryteria ukończenia

- panel zawodnika wygląda i działa jak pełnoprawne centrum pracy na jednej osobie,
- bogactwo funkcji nie obciąża odbioru ekranu.

---

### Rekomendowana kolejność wdrożenia

1. Etap 1: Uporządkowanie semantyki górnego headera
2. Etap 2: Powiadomienia jako realna lista zadań
3. Etap 3: Header jako panel szybkich działań
4. Etap 4: Lepszy blok dostępu zawodnika i linku zaproszenia
5. Etap 5: Lepsze podsumowanie stanu współpracy
6. Etap 6: Lepsze wejście do zakładek z kontekstu
7. Etap 7: Spójność finansów i semantyki płatności
8. Etap 8: Lepsze wykorzystanie danych o treningu i aktywności
9. Etap 9: Spójność z zakładkami i architekturą danych
10. Etap 10: Final polish UX/UI

---

### Minimalny zestaw o największym wpływie

Jeśli chcemy szybki, mocny upgrade `Panelu zawodnika`, największy efekt dadzą:

- Etap 1
- Etap 2
- Etap 3
- Etap 6
- Etap 7

---

## Sidebar + Topbar

### Cel sekcji

`Sidebar + Topbar` mają tworzyć razem prawdziwy system nawigacji i orientacji w panelu trenera, a nie tylko:

- boczne menu modułów,
- pasek z tytułem strony.

Po pełnym wdrożeniu ta sekcja ma odpowiadać na trzy pytania:

- gdzie jestem,
- co wymaga uwagi teraz,
- dokąd mogę przejść najszybciej.

---

### Aktualna ocena

Układ bazowy jest dobry i stabilny:

- sidebar daje czytelną strukturę modułów,
- topbar jest spójnie używany na podstronach,
- shell panelu jest prosty i przewidywalny,
- `NotificationBell` działa jako lekkie centrum feedbackowych powiadomień,
- aktywny link w sidebarze działa poprawnie także dla podtras.

Największe braki:

- sidebar jest zbyt statyczny i nie pokazuje priorytetów modułów,
- topbar jest bardziej nagłówkiem niż prawdziwym paskiem roboczym,
- `NotificationBell` wygląda jak globalne centrum notyfikacji, ale semantycznie jest nadal głównie wejściem do feedbacku,
- stan zwinięcia sidebara się nie zapisuje,
- shell wygląda mocno desktop-first i wymaga dopracowania responsywnego.

---

### Definicja ukończenia

Sekcję `Sidebar + Topbar` uznajemy za domkniętą, gdy:

- użytkownik od razu widzi, gdzie jest i które moduły mają zaległości,
- topbar daje szybkie akcje i globalne wejścia, a nie tylko tytuł strony,
- powiadomienia są rzeczywiście globalne i wiarygodne,
- sidebar zachowuje preferencje użytkownika,
- cała nawigacja działa dobrze także na mniejszych szerokościach,
- system jest semantycznie spójny z dashboardem, feedbackiem, czatem i fakturami.

---

### Etap 1: Uporządkowanie roli sidebara i topbara

Priorytet: **Krytyczny**
Ryzyko: **Niskie**

#### Zakres

1. Ustalić rolę sidebara:
- nawigacja globalna,
- szybkie sygnały statusowe modułów,
- dostęp do profilu i wylogowania.

2. Ustalić rolę topbara:
- kontekst aktualnej strony,
- szybkie akcje lokalne,
- powiadomienia globalne,
- global search / command palette.

3. Zdefiniować, czego nie dublować:
- sidebar nie powinien konkurować z lokalnymi akcjami strony,
- topbar nie powinien dublować struktury modułów.

#### Pliki

- `app/coach/_components/CoachShell.tsx`
- `components/coach/CoachSidebar.tsx`
- `components/coach/CoachTopbar.tsx`

#### Kryteria ukończenia

- sidebar i topbar mają wyraźnie różne, komplementarne funkcje,
- dalsza rozbudowa nawigacji nie powoduje chaosu semantycznego.

---

### Etap 2: Sidebar jako narzędzie orientacji i priorytetów

Priorytet: **Bardzo wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Dodać badge przy najważniejszych sekcjach:
- `Feedback`
- `Czat`
- `Faktury`
- opcjonalnie `Dashboard`

2. Badge powinny pokazywać:
- unread feedback,
- unread wiadomości,
- zaległe faktury,
- opcjonalnie liczbę rzeczy wymagających uwagi.

3. Rozważyć priorytety wizualne:
- normalny stan,
- informacyjny,
- ostrzegawczy,
- krytyczny.

4. Nie przeciążyć sidebara:
- badge tylko tam, gdzie naprawdę dają wartość.

#### Pliki

- `components/coach/CoachSidebar.tsx`
- helpery globalnych agregatów w `lib/`

#### Kryteria ukończenia

- sidebar pokazuje, które moduły mają zaległości lub pilne sygnały,
- użytkownik jednym spojrzeniem widzi, gdzie czeka praca.

---

### Etap 3: Lepszy active state i hierarchia sidebara

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Wzmocnić aktywny stan linku:
- wyraźniejszy background,
- mocniejszy kontrast tekstu,
- lepszy akcent boczny,
- lepsza relacja z hover.

2. Dopracować nagłówki sekcji:
- `Zawodnicy`
- `Finanse`
- ewentualne nowe grupy jeśli dojdą.

3. Uporządkować spacing i rytm:
- dashboard jako osobna pozycja,
- sekcje logicznie odseparowane,
- dół sidebara bardziej świadomie oddzielony.

4. Dopracować collapsed state:
- lepsze tooltipy,
- czytelniejsze separatory,
- mocniejszy active state także w trybie zwiniętym.

#### Pliki

- `components/coach/CoachSidebar.tsx`

#### Kryteria ukończenia

- aktualna sekcja panelu jest rozpoznawalna natychmiast,
- sidebar wygląda bardziej świadomie i mniej surowo.

---

### Etap 4: Zapamiętywanie stanu sidebara

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Zapisywać stan collapse:
- w `localStorage`,
- albo docelowo per konto użytkownika.

2. Odtwarzać stan po wejściu do panelu.

3. Zachować ostrożność przy SSR:
- pierwszy render spójny,
- preferencje ładowane po mount bez hydration mismatch.

#### Pliki

- `app/coach/_components/CoachShell.tsx`
- ewentualny helper preferencji nawigacji

#### Kryteria ukończenia

- sidebar pamięta preferowany stan rozwinięcia,
- użytkownik nie musi ustawiać go od nowa po odświeżeniu.

---

### Etap 5: Responsywność i zachowanie shellu

Priorytet: **Wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Przeanalizować zachowanie przy mniejszych szerokościach:
- tablet,
- mniejsze laptopy,
- mobile.

2. Wprowadzić tryb mobilny sidebara:
- overlay / drawer,
- zamiast stałego `marginLeft`.

3. Dodać sensowny trigger otwierania menu na mniejszych szerokościach.

4. Sprawdzić sticky behavior, przewijanie i focus management.

#### Pliki

- `app/coach/_components/CoachShell.tsx`
- `components/coach/CoachSidebar.tsx`
- ewentualnie `components/coach/CoachTopbar.tsx`

#### Kryteria ukończenia

- shell działa świadomie na desktopie i na mniejszych ekranach,
- sidebar nie sprawia wrażenia rozwiązania wyłącznie desktopowego.

---

### Etap 6: Topbar jako prawdziwy pasek roboczy

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Zdefiniować standard zawartości topbara:
- tytuł,
- subtitle,
- lokalne akcje,
- globalne akcje,
- powiadomienia,
- theme toggle.

2. Uporządkować użycie `actions`:
- kiedy strona powinna dostarczyć quick action,
- kiedy nie.

3. Rozważyć wspólny wzorzec prawej strony topbara:
- najpierw `actions`,
- potem narzędzia globalne.

4. Dopracować spacing i hierarchię tytułu/subtitle.

#### Pliki

- `components/coach/CoachTopbar.tsx`
- wszystkie główne strony używające `CoachTopbar`

#### Kryteria ukończenia

- topbar daje realną wartość użytkową na kluczowych podstronach,
- nie jest już tylko nagłówkiem strony.

---

### Etap 7: Global search / command palette

Priorytet: **Bardzo wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Dodać global search w topbarze:
- wyszukaj zawodnika,
- przejdź do planera,
- otwórz czat,
- znajdź fakturę,
- przejdź do dashboardu.

2. Docelowo rozważyć command palette:
- `Cmd/Ctrl+K`
- szybkie akcje i nawigacja.

3. Zacząć od wersji prostej:
- wyszukiwanie zawodników,
- skróty do modułów.

#### Pliki

- `components/coach/CoachTopbar.tsx`
- nowe komponenty global search / command palette
- helpery wyszukiwania w `lib/`

#### Kryteria ukończenia

- użytkownik może przejść do kluczowego miejsca bez ręcznego klikania po menu,
- topbar staje się realnym narzędziem pracy.

---

### Etap 8: NotificationBell jako prawdziwe centrum powiadomień

Priorytet: **Bardzo wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Ustalić semantykę:
- albo to jest globalne `Powiadomienia`,
- albo trzeba je zawęzić i jasno tak nazwać.

2. Jeśli zostaje jako globalne centrum:
- dodać typy powiadomień:
  - feedback,
  - wiadomości,
  - płatności,
  - alerty zawodników,
  - starty.

3. Każdy typ powinien mieć:
- ikonę,
- krótki opis,
- datę,
- CTA do właściwego miejsca.

4. Dodać lepszy stan pusty i ewentualnie grupowanie.

5. Dodać odświeżanie:
- polling,
- refetch po powrocie do zakładki,
- albo po otwarciu dropdownu.

#### Pliki

- `components/coach/NotificationBell.tsx`
- `lib/actions/notifications.ts`
- ewentualne nowe helpery agregujące powiadomienia

#### Kryteria ukończenia

- użytkownik ufa, że dzwonek pokazuje realne globalne priorytety,
- bell nie jest już tylko aliasem do feedbacku.

---

### Etap 9: Lepsze stany pośrednie i niezawodność topbara

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Dodać stany:
- loading,
- empty,
- error.

2. Dodać odświeżanie danych powiadomień:
- polling,
- refetch po powrocie do zakładki,
- albo przy otwarciu dropdownu.

3. Dodać local updates po `mark read / mark all`.

4. Sprawdzić zachowanie przy długiej sesji użytkownika.

#### Pliki

- `components/coach/NotificationBell.tsx`
- powiązane akcje i helpery

#### Kryteria ukończenia

- powiadomienia są świeże i przewidywalne,
- topbar nie sprawia wrażenia „zastygłego” przy długiej pracy.

---

### Etap 10: Profil trenera w sidebarze jako lepszy punkt konta

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Uczytelnić rolę dolnego bloku:
- konto,
- plan,
- ustawienia,
- wylogowanie.

2. Rozważyć dodatkowe skróty:
- `Ustawienia`
- `Mój plan`
- `Pomoc`

3. Dopracować collapsed state:
- lepsze tooltipy,
- bardziej czytelne wylogowanie,
- nie tylko mała ikona z `↩`.

4. Rozważyć lepszą informację o planie:
- nie tylko nazwa planu,
- ale subtelny status lub wartość.

#### Pliki

- `components/coach/CoachSidebar.tsx`

#### Kryteria ukończenia

- blok profilu trenera jest czytelny i przydatny w obu stanach sidebara,
- dół nawigacji wygląda bardziej jak świadoma część produktu.

---

### Etap 11: Spójność architektury i danych

Priorytet: **Średni**
Ryzyko: **Średnie**

#### Zakres

1. Wydzielić warstwę danych globalnej nawigacji:
- unread messages,
- unread feedback,
- overdue invoices,
- global alerts.

2. Ujednolicić definicje z:
- `Dashboard`
- `Feedback`
- `Czat`
- `Faktury`
- `Zawodnicy`

3. Przygotować lekkie DTO dla:
- sidebar badges,
- notification center.

4. Rozważyć testy helperów globalnych agregatów.

#### Pliki

- nowe helpery w `lib/`
- `components/coach/CoachSidebar.tsx`
- `components/coach/NotificationBell.tsx`
- miejsca współdzielące te same definicje

#### Kryteria ukończenia

- te same sygnały znaczą to samo w sidebarze, topbarze i modułach,
- globalna nawigacja nie duplikuje niespójnej logiki.

---

### Etap 12: Final polish UX/UI

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Dopracować hierarchię wizualną:
- active,
- hover,
- muted,
- warning,
- danger.

2. Rozważyć spójniejszy system ikon
- docelowo odejście od emoji, jeśli to będzie produktowo uzasadnione.

3. Dopracować mikrocopy
- tooltipy,
- etykiety,
- stany puste,
- komunikaty powiadomień.

4. Dopracować accessibility
- focus states,
- aria labels,
- keyboard nav,
- kontrast.

5. Dopracować motion i feeling
- subtelne animacje otwierania,
- lepszy collapse/expand,
- spokojniejsze dropdowny.

#### Pliki

- `app/coach/_components/CoachShell.tsx`
- `components/coach/CoachSidebar.tsx`
- `components/coach/CoachTopbar.tsx`
- `components/coach/NotificationBell.tsx`

#### Kryteria ukończenia

- sidebar i topbar wyglądają jak dopracowany system nawigacji produktu,
- nawigacja nie sprawia już wrażenia zestawu wspólnych komponentów MVP.

---

### Rekomendowana kolejność wdrożenia

1. Etap 1: Uporządkowanie roli sidebara i topbara
2. Etap 2: Sidebar jako narzędzie orientacji i priorytetów
3. Etap 3: Lepszy active state i hierarchia sidebara
4. Etap 4: Zapamiętywanie stanu sidebara
5. Etap 5: Responsywność i zachowanie shellu
6. Etap 6: Topbar jako prawdziwy pasek roboczy
7. Etap 7: Global search / command palette
8. Etap 8: NotificationBell jako prawdziwe centrum powiadomień
9. Etap 9: Lepsze stany pośrednie i niezawodność topbara
10. Etap 10: Profil trenera w sidebarze jako lepszy punkt konta
11. Etap 11: Spójność architektury i danych
12. Etap 12: Final polish UX/UI

---

### Minimalny zestaw o największym wpływie

Jeśli chcemy szybki, mocny upgrade `Sidebar + Topbar`, największy efekt dadzą:

- Etap 2
- Etap 4
- Etap 5
- Etap 7
- Etap 8

---

## Login / Register

### Cel sekcji

`Login / Register` mają być dopracowanym wejściem do produktu, a nie tylko prostym formularzem auth.

Po pełnym wdrożeniu ta sekcja ma odpowiadać na trzy pytania:

- jak szybko i bezpiecznie wejść do panelu,
- co stanie się po zalogowaniu albo rejestracji,
- co zrobić, jeśli coś poszło nie tak lub utraciłem dostęp.

---

### Aktualna ocena

Obecne flow jest czyste i funkcjonalne:

- ekrany są proste i czytelne,
- używają `useActionState` i server actions,
- callback auth ma zabezpieczenie przed open redirect,
- login i rejestracja są wizualnie spójne.

Największe braki:

- brak guardu dla zalogowanego użytkownika na `/login` i `/register`,
- nie do końca jasny model po rejestracji i ewentualnym potwierdzeniu emaila,
- surowe komunikaty błędów z backendu,
- brak resetu hasła,
- zbyt słabe pierwsze wrażenie i zbyt mało kontekstu produktowego.

---

### Definicja ukończenia

Sekcję `Login / Register` uznajemy za domkniętą, gdy:

- zalogowany użytkownik nie trafia już na ekrany auth,
- login, register i callback mają spójny i przewidywalny flow,
- użytkownik dokładnie wie, co dzieje się po rejestracji,
- błędy są ludzkie i czytelne,
- dostęp można odzyskać bez kontaktu z supportem,
- ekrany budują zaufanie i dobre pierwsze wrażenie produktu.

---

### Etap 1: Uporządkowanie flow wejścia i wyjścia z auth

Priorytet: **Krytyczny**
Ryzyko: **Niskie**

#### Zakres

1. Dodać guard dla zalogowanego użytkownika:
- jeśli istnieje aktywna sesja, `/login` i `/register` powinny przekierowywać do panelu.

2. Ustalić docelowy landing po auth:
- `dashboard`
- albo `athletes`
- ale świadomie i spójnie.

3. Ujednolicić redirect po:
- loginie,
- rejestracji,
- callbacku auth.

4. Rozważyć obsługę `next`
- jeśli użytkownik próbował wejść na chronioną stronę przed logowaniem.

#### Pliki

- `app/login/page.tsx`
- `app/register/page.tsx`
- `lib/actions/auth.ts`
- `app/api/auth/callback/route.ts`

#### Kryteria ukończenia

- zalogowany użytkownik nie trafia już na ekrany auth,
- po loginie i rejestracji zawsze trafia do logicznego miejsca.

---

### Etap 2: Jasny model rejestracji i potwierdzenia emaila

Priorytet: **Bardzo wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Ustalić model docelowy:
- natychmiastowy dostęp po rejestracji,
- albo obowiązkowe potwierdzenie emaila.

2. Dostosować UX do tego modelu:
- jeśli trzeba potwierdzić email:
  - nie redirectować tak, jakby konto było gotowe,
  - pokazać ekran sukcesu z instrukcją.
- jeśli konto działa od razu:
  - zakomunikować to jednoznacznie.

3. Dodać komunikaty po rejestracji:
- co się stało,
- co użytkownik ma zrobić dalej,
- gdzie trafi po zakończeniu procesu.

#### Pliki

- `lib/actions/auth.ts`
- `app/register/page.tsx`
- ewentualna nowa strona sukcesu po rejestracji

#### Kryteria ukończenia

- użytkownik po rejestracji dokładnie wie, czy ma już dostęp, czy musi wykonać dodatkowy krok,
- flow rejestracji nie zostawia niepewności.

---

### Etap 3: Lepsza walidacja i komunikaty błędów

Priorytet: **Bardzo wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Dodać walidację po stronie serwera
- najlepiej przez schematy dla email, hasło i name.

2. Dodać mapowanie błędów auth na własne komunikaty:
- zły email/hasło,
- konto już istnieje,
- za słabe hasło,
- problem z potwierdzeniem,
- błąd chwilowy / sieciowy.

3. Dodać bardziej precyzyjne komunikaty przy formularzu
- nie tylko „error”, ale co dokładnie poszło nie tak.

4. Rozważyć lepsze przypięcie błędu do pola
- jeśli błąd dotyczy konkretnego inputu.

#### Pliki

- `lib/actions/auth.ts`
- ewentualne schematy w `lib/`
- `app/login/page.tsx`
- `app/register/page.tsx`

#### Kryteria ukończenia

- użytkownik dostaje jasne i ludzkie komunikaty,
- auth flow nie pokazuje surowych błędów backendu.

---

### Etap 4: Odzyskiwanie hasła

Priorytet: **Bardzo wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Dodać link `Nie pamiętasz hasła?`
- na ekranie logowania.

2. Przygotować ekran lub modal resetu hasła.

3. Dodać jasne komunikaty:
- wysłaliśmy link,
- sprawdź email,
- co zrobić jeśli wiadomość nie przyszła.

4. Spiąć to z istniejącym systemem auth Supabase.

#### Pliki

- `app/login/page.tsx`
- nowe ekrany lub komponenty resetu hasła
- helpery auth w `lib/`

#### Kryteria ukończenia

- użytkownik może samodzielnie odzyskać dostęp,
- login nie wymaga już kontaktu z supportem przy utracie hasła.

---

### Etap 5: Lepszy UX formularzy

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Dodać bardziej świadomą walidację client-side
- zanim użytkownik wyśle formularz.

2. Rozważyć:
- `pokaż / ukryj hasło`,
- lepsze autofocusy,
- lepsze focus states.

3. W rejestracji rozważyć:
- potwierdzenie hasła,
- wskaźnik siły hasła,
- bardziej czytelne wymagania.

4. Dopracować stany pending
- bardziej czytelne i bardziej „pewne”.

#### Pliki

- `app/login/page.tsx`
- `app/register/page.tsx`

#### Kryteria ukończenia

- użytkownik rzadziej popełnia błędy,
- formularze są bardziej bezpieczne i pewne w użyciu.

---

### Etap 6: Lepsze pierwsze wrażenie i zaufanie do produktu

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Dodać trochę kontekstu produktu:
- dla kogo jest panel,
- co użytkownik dostaje po wejściu,
- krótka wartość.

2. Dodać elementy budujące zaufanie:
- bezpieczne logowanie,
- odzyskiwanie dostępu,
- prywatność,
- ewentualnie info o starcie, jeśli to produktowo prawdziwe.

3. Lekko zróżnicować `login` i `register`
- login bardziej „wróć do panelu”,
- register bardziej „załóż konto i zacznij”.

4. Zachować prostotę
- to nadal ma być szybki ekran auth, nie landing page.

#### Pliki

- `app/login/page.tsx`
- `app/register/page.tsx`

#### Kryteria ukończenia

- ekrany wejścia budują zaufanie i wartość,
- auth flow wygląda jak świadoma część produktu.

---

### Etap 7: Spójność z resztą systemu

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Ujednolicić język z resztą aplikacji:
- `panel trenera`,
- `konto`,
- `ustawienia`,
- `pomoc`.

2. Ujednolicić branding z głównym shellem i resztą designu.

3. Dostosować redirect po auth do aktualnej strategii produktu
- jeśli dashboard jest głównym hubem, auth powinien do niego prowadzić.

4. Rozważyć późniejsze wejścia onboardingowe po pierwszym logowaniu
- ustawienia profilu,
- pakiety,
- pierwszy zawodnik.

#### Pliki

- `app/login/page.tsx`
- `app/register/page.tsx`
- `lib/actions/auth.ts`
- ewentualne flow onboardingowe

#### Kryteria ukończenia

- auth flow jest naturalnym początkiem całego systemu,
- nie wygląda jak osobny lub starszy moduł.

---

### Etap 8: Architektura i bezpieczeństwo warstwy auth

Priorytet: **Średni**
Ryzyko: **Średnie**

#### Zakres

1. Dodać schematy walidacji dla login/register.

2. Wydzielić mapowanie błędów auth do helpera
- aby nie powielać logiki.

3. Uporządkować redirecty i callbacki:
- login,
- register,
- callback auth,
- reset hasła, jeśli dojdzie.

4. Przejrzeć bezpieczeństwo flow:
- brak open redirectów,
- poprawne obsłużenie `next`,
- poprawne zachowanie przy częściowo aktywnej sesji.

#### Pliki

- `lib/actions/auth.ts`
- `app/api/auth/callback/route.ts`
- nowe helpery auth w `lib/`

#### Kryteria ukończenia

- auth flow jest technicznie równie dopracowany jak reszta aplikacji,
- warstwa auth jest łatwiejsza do utrzymania.

---

### Etap 9: Final polish UX/UI

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Dopracować hierarchię wizualną kart i formularzy
- tytuł,
- opis,
- pola,
- błędy,
- CTA.

2. Dopracować mikrocopy
- logowanie,
- rejestracja,
- błędy,
- sukcesy,
- reset hasła.

3. Dopracować accessibility
- focus states,
- aria labels,
- poprawne label/input semantics,
- kontrast.

4. Sprawdzić zachowanie mobile
- rytm,
- paddingi,
- wielkość pól,
- CTA.

#### Pliki

- `app/login/page.tsx`
- `app/register/page.tsx`
- nowe komponenty auth jeśli powstaną

#### Kryteria ukończenia

- auth flow wygląda i działa jak dopracowana część produktu,
- nie sprawia już wrażenia tylko technicznego formularza.

---

### Rekomendowana kolejność wdrożenia

1. Etap 1: Uporządkowanie flow wejścia i wyjścia z auth
2. Etap 2: Jasny model rejestracji i potwierdzenia emaila
3. Etap 3: Lepsza walidacja i komunikaty błędów
4. Etap 4: Odzyskiwanie hasła
5. Etap 5: Lepszy UX formularzy
6. Etap 6: Lepsze pierwsze wrażenie i zaufanie do produktu
7. Etap 7: Spójność z resztą systemu
8. Etap 8: Architektura i bezpieczeństwo warstwy auth
9. Etap 9: Final polish UX/UI

---

### Minimalny zestaw o największym wpływie

Jeśli chcemy szybki, mocny upgrade `Login / Register`, największy efekt dadzą:

- Etap 1
- Etap 2
- Etap 3
- Etap 4
- Etap 5

---

## Landing page

### Cel sekcji

`Landing page` ma być nie tylko estetyczną stroną marketingową, ale skuteczną stroną sprzedażową produktu, która:

- jasno tłumaczy wartość,
- buduje zaufanie,
- prowadzi do rejestracji albo kontaktu,
- i jest spójna z realnym stanem systemu.

Po pełnym wdrożeniu ta sekcja ma odpowiadać na trzy pytania:

- czym jest produkt i dla kogo,
- dlaczego warto zacząć teraz,
- dlaczego mogę zaufać tej platformie.

---

### Aktualna ocena

Landing jest ambitny i ma pełną strukturę sprzedażową:

- hero,
- problem,
- dwie perspektywy,
- moduły,
- onboarding,
- porównanie,
- pricing,
- testimonials,
- końcowe CTA,
- footer.

Największe braki:

- część claimów jest zbyt ambitna względem aktualnego produktu,
- strona jest za długa i zbyt ciężka informacyjnie,
- social proof nie jest jeszcze maksymalnie wiarygodny,
- footer zawiera martwe linki,
- cały landing siedzi w jednym dużym komponencie z dużą ilością inline styles,
- mobile navigation nie jest domknięte.

---

### Definicja ukończenia

Sekcję `Landing page` uznajemy za domkniętą, gdy:

- wszystkie obietnice są zgodne z realnym stanem produktu,
- użytkownik szybko rozumie produkt i wartość wejścia,
- strona prowadzi jasną ścieżką do rejestracji lub kontaktu,
- pricing i CTA są klarowne,
- social proof i footer budują wiarygodność,
- kod strony jest rozbity i łatwy do utrzymania.

---

### Etap 1: Audyt obietnic i zgodności z produktem

Priorytet: **Krytyczny**
Ryzyko: **Średnie**

#### Zakres

1. Przejrzeć wszystkie obietnice na stronie:
- funkcje,
- automatyzacje,
- oszczędność czasu,
- enterprise,
- offline,
- API,
- white label,
- retencja,
- alerty.

2. Podzielić claimy na:
- w pełni gotowe,
- częściowo gotowe,
- planowane / roadmapa,
- do usunięcia.

3. Przepisać sekcje tak, żeby:
- nie obiecywały za dużo,
- były dalej mocne, ale prawdziwe,
- nie rozjeżdżały się z panelem.

4. Ujednolicić język z rzeczywistym produktem:
- dashboard,
- feedback,
- czat,
- finanse,
- zawodnicy.

#### Pliki

- `app/page.tsx`
- ewentualne współdzielone pliki copy jeśli powstaną

#### Kryteria ukończenia

- każda ważna obietnica na stronie jest zgodna z realnym systemem,
- landing nie sprzedaje funkcji, których użytkownik później nie znajdzie.

---

### Etap 2: Uproszczenie narracji i skrócenie strony

Priorytet: **Bardzo wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Ocenić, które sekcje są naprawdę niezbędne:
- hero,
- problem,
- dla kogo,
- funkcje,
- pricing,
- social proof,
- końcowe CTA.

2. Skrócić lub uprościć sekcje o niższym wpływie:
- część porównań,
- część claimów modułowych,
- część list i opisów.

3. Zmniejszyć liczbę długich bloków tekstu.

4. Wzmocnić flow konwersyjny:
- wartość,
- dowód,
- oferta,
- CTA.

#### Pliki

- `app/page.tsx`

#### Kryteria ukończenia

- strona jest krótsza i łatwiejsza do przeskanowania,
- użytkownik szybciej rozumie, dlaczego ma przejść dalej.

---

### Etap 3: Wzmocnienie hero i pozycjonowania produktu

Priorytet: **Bardzo wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Doprecyzować dla kogo jest produkt:
- trener solo,
- trener z rosnącą bazą,
- mały zespół,
- itp.

2. Wzmocnić główną obietnicę
- mniej ogólna,
- bardziej konkretna,
- łatwiejsza do zapamiętania.

3. Dopracować supporting copy
- co dokładnie jest w systemie,
- co użytkownik zyskuje od razu.

4. Rozważyć mocniejszy element zaufania przy hero:
- bez karty,
- za darmo do 2 zawodników,
- konkretny use case,
- liczby jeśli są realne.

5. Dopracować CTA:
- główne,
- drugorzędne,
- ewentualnie kontakt/demo jeśli potrzebne.

#### Pliki

- `app/page.tsx`

#### Kryteria ukończenia

- hero po wejściu od razu tłumaczy produkt, grupę docelową i następną akcję,
- pierwsze 10 sekund kontaktu ze stroną jest dużo mocniejsze.

---

### Etap 4: Wiarygodność i social proof

Priorytet: **Wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Dopracować opinie:
- jeśli są prawdziwe, pokazać je bardziej wiarygodnie,
- jeśli nie ma jeszcze mocnych case studies, uprościć lub osłabić ton.

2. Rozważyć lepsze formy social proof:
- liczba trenerów,
- liczba zawodników,
- liczba feedbacków,
- realne case studies,
- screeny produktu,
- logotypy jeśli istnieją.

3. Ograniczyć marketingowe „przestrzelenie”
- mniej claimów bez wsparcia,
- więcej konkretu.

4. Przejrzeć sekcję `Porównanie`
- czy ma zostać,
- czy jest aktualna,
- czy nie jest zbyt ryzykowna marketingowo.

#### Pliki

- `app/page.tsx`
- ewentualne assety i dane social proof

#### Kryteria ukończenia

- landing buduje zaufanie realnymi dowodami,
- użytkownik nie ma wrażenia „marketingowej przesady”.

---

### Etap 5: Pricing i oferta jako mocniejszy moduł konwersyjny

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Dopracować billing toggle:
- wyraźniej pokazać różnicę,
- oszczędność kwotowo i procentowo,
- sposób rozliczania rocznego.

2. Uporządkować plany:
- czy wszystkie są rzeczywiście gotowe,
- czy enterprise nie jest zbyt „z roadmapy”.

3. Dodać lepsze odpowiedzi na pytania cenowe:
- co oznacza limit zawodników,
- co dzieje się po przekroczeniu limitu,
- czy plan można zmienić później.

4. Rozważyć mini-FAQ przy pricingu.

#### Pliki

- `app/page.tsx`

#### Kryteria ukończenia

- cennik jest jasny i wspiera decyzję,
- użytkownik łatwo rozumie różnice między planami.

---

### Etap 6: Mobile UX i nawigacja

Priorytet: **Wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Dodać prawdziwe mobile menu:
- funkcje,
- porównanie,
- cennik,
- jak zacząć.

2. Sprawdzić czytelność sekcji na mobile:
- spacing,
- długość tekstów,
- szerokość boxów,
- tabele.

3. Dopracować sekcję porównania i pricing na małych ekranach.

4. Dopracować sticky navbar na mobile.

#### Pliki

- `app/page.tsx`
- nowe komponenty mobilnej nawigacji jeśli powstaną

#### Kryteria ukończenia

- landing działa świadomie także na telefonie,
- mobile nie wygląda jak niepełna wersja strony.

---

### Etap 7: Footer i prawdziwe ścieżki informacyjne

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Usunąć lub zastąpić wszystkie martwe linki.

2. Zdecydować, które linki naprawdę istnieją:
- kontakt,
- pomoc,
- polityka prywatności,
- regulamin,
- status systemu,
- blog,
- o nas.

3. Jeśli dane strony jeszcze nie istnieją:
- ukryć linki,
- albo stworzyć minimalne wersje.

4. Dopracować końcowy CTA i footer jako ostatni etap konwersji.

#### Pliki

- `app/page.tsx`
- ewentualne nowe strony marketingowe/informacyjne

#### Kryteria ukończenia

- footer jest realny i wiarygodny,
- koniec strony nie psuje odbioru całego produktu.

---

### Etap 8: Refaktor architektury landing page

Priorytet: **Średni**
Ryzyko: **Średnie**

#### Zakres

1. Rozbić landing na sekcje:
- `LandingNavbar`
- `HeroSection`
- `ProblemSection`
- `FeaturesSection`
- `PricingSection`
- `TestimonialsSection`
- `FooterSection`

2. Ograniczyć `use client` do minimum
- zachować client-side tylko tam, gdzie naprawdę potrzeba:
  - `isYearly`
  - `navScrolled`
  - mobile menu.

3. Uporządkować style:
- CSS variables,
- bardziej spójne utility classes,
- mniej inline styles.

4. Ułatwić przyszłe zmiany copy i układu.

#### Pliki

- `app/page.tsx`
- nowe komponenty landingu

#### Kryteria ukończenia

- landing nie jest już jednym dużym komponentem,
- kod jest łatwiejszy do utrzymania i rozwijania.

---

### Etap 9: Final polish UX/UI

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Dopracować hierarchię wizualną sekcji
- co jest najważniejsze,
- co wspierające,
- co można osłabić.

2. Dopracować mikrocopy
- hero,
- CTA,
- pricing,
- testimonials,
- footer.

3. Dopracować rytm strony
- długość sekcji,
- tempo informacji,
- miejsca oddechu.

4. Dopracować motion
- navbar,
- pricing toggle,
- hover states,
- CTA.

5. Dopracować accessibility
- focus states,
- kontrasty,
- poprawne semantyczne nagłówki,
- tabele i linki.

#### Pliki

- `app/page.tsx`
- nowe komponenty landingu

#### Kryteria ukończenia

- landing wygląda jak dopracowana, wiarygodna strona produktu,
- nie jest już tylko rozbudowaną prezentacją funkcji.

---

### Rekomendowana kolejność wdrożenia

1. Etap 1: Audyt obietnic i zgodności z produktem
2. Etap 2: Uproszczenie narracji i skrócenie strony
3. Etap 3: Wzmocnienie hero i pozycjonowania produktu
4. Etap 4: Wiarygodność i social proof
5. Etap 5: Pricing i oferta jako mocniejszy moduł konwersyjny
6. Etap 6: Mobile UX i nawigacja
7. Etap 7: Footer i prawdziwe ścieżki informacyjne
8. Etap 8: Refaktor architektury landing page
9. Etap 9: Final polish UX/UI

---

### Minimalny zestaw o największym wpływie

Jeśli chcemy szybki, mocny upgrade `Landing page`, największy efekt dadzą:

- Etap 1
- Etap 2
- Etap 3
- Etap 4
- Etap 7

---

## Panel zawodnika mobile

### Cel sekcji

Ta sekcja dotyczy panelu zawodnika pod `/u/[slug]`, czyli mobilnego interfejsu zawodnika, a nie profilu zawodnika w panelu trenera.

`Panel zawodnika mobile` ma być maksymalnie prosty, szybki i bez tarcia:

- zawodnik otwiera aplikację,
- od razu widzi co ma dziś zrobić,
- robi trening,
- daje feedback,
- i ma prosty kontakt z trenerem.

Po pełnym wdrożeniu ta sekcja ma odpowiadać na trzy pytania:

- co mam zrobić dziś,
- jak najprościej dać feedback po treningu,
- gdzie sprawdzić plan, historię i kontakt z trenerem.

---

### Aktualna ocena

Panel ma bardzo dobrą bazę produktową:

- działa prywatny dostęp przez link i sesję,
- `Dziś` jest głównym ekranem dnia,
- `Plan` ma widok tygodnia i miesiąca,
- `Historia` zawiera historię planu i Stravę,
- `Czat` jest prosty i czytelny,
- bottom nav trafia w główne moduły mobilne.

Największe braki:

- ekran `Dziś` nie prowadzi jeszcze wystarczająco mocno do jednej najważniejszej akcji,
- feedback tekstowy i głosowy nie mają do końca jasnej relacji,
- modal feedbacku jest trochę za ciężki jak na codzienny mobile flow,
- czat nie jest jeszcze wystarczająco płynny,
- bottom nav ma zbyt dużo funkcji drugorzędnych,
- historia nie pokazuje jeszcze wystarczająco mocno `plan vs wykonanie`.

---

### Definicja ukończenia

Sekcję `Panel zawodnika mobile` uznajemy za domkniętą, gdy:

- zawodnik po wejściu od razu wie, co ma zrobić dziś,
- feedback po treningu jest bardzo szybki i intuicyjny,
- plan i historia pomagają orientować się w treningu bez chaosu,
- czat działa płynnie i naturalnie,
- nawigacja mobilna jest prosta i nie przeładowuje dolnego paska,
- panel realnie spełnia obietnicę `mobile-first` i `zero tarcia`.

---

### Etap 1: Uporządkowanie głównego flow „Dziś”

Priorytet: **Krytyczny**
Ryzyko: **Niskie**

#### Zakres

1. Ustalić hierarchię treści na ekranie `Dziś`:
- dzisiejszy trening,
- stan wykonania,
- feedback po treningu,
- odpowiedź trenera.

2. Wyeksponować jedną główną akcję dnia:
- jeśli trening jeszcze nieopisany -> `Dodaj feedback`
- jeśli nic nie ma na dziś -> `Sprawdź plan tygodnia`
- jeśli jest odpowiedź trenera -> mocniej ją pokazać

3. Dodać bardziej świadomy stan dnia:
- `Masz dziś trening`
- `Trening ukończony`
- `Czeka feedback`
- `Dziś odpoczynek`

4. Ograniczyć poczucie „wszystko jest równie ważne”.

#### Pliki

- `app/u/[slug]/_components/AthleteTodayPage.tsx`

#### Kryteria ukończenia

- ekran `Dziś` prowadzi użytkownika bez wątpliwości do kolejnego kroku,
- użytkownik po wejściu od razu wie, co ma zrobić teraz.

---

### Etap 2: Uproszczenie i doprecyzowanie feedback flow

Priorytet: **Bardzo wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Ustalić model produktu:
- tekst albo głos,
- tekst + głos,
- preferowany domyślny wariant.

2. Jeśli oba zostają:
- jasno wyjaśnić różnicę:
  - szybki feedback tekstowy,
  - komentarz głosowy jako rozszerzenie
- albo:
  - tekstowy = strukturalny
  - głosowy = opcjonalny komentarz

3. Ograniczyć tarcie w modalach
- mniej pól na start,
- najważniejsze pytania najpierw,
- reszta jako opcjonalna.

4. Zastanowić się, czy modal tekstowy nie powinien mieć:
- trybu szybkiego,
- trybu rozszerzonego.

#### Pliki

- `app/u/[slug]/_components/AthleteTodayPage.tsx`
- `app/u/[slug]/_components/FeedbackModal.tsx`

#### Kryteria ukończenia

- zawodnik bez zastanowienia rozumie, jak ma dać feedback,
- feedback flow jest szybki i intuicyjny.

---

### Etap 3: Szybszy i bardziej mobilny modal feedbacku

Priorytet: **Bardzo wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Skrócić i uprościć modal tekstowy:
- najpierw:
  - samopoczucie,
  - intensywność,
  - krótka notatka
- reszta jako opcjonalna lub schowana.

2. Dodać lepszy flow zapisu:
- bardziej czytelny pending,
- bardziej czytelny sukces,
- bez `alert(...)` przy błędzie.

3. Dodać lepsze komunikaty błędu/sukcesu
- lekkie mobile toast lub inline state.

4. Dopracować edycję już dodanego feedbacku
- tak, żeby użytkownik wiedział, że może poprawić wpis.

#### Pliki

- `app/u/[slug]/_components/FeedbackModal.tsx`
- `app/u/[slug]/_components/AthleteTodayPage.tsx`

#### Kryteria ukończenia

- dodanie feedbacku jest szybkie i przyjemne na telefonie,
- modal nie sprawia wrażenia małego formularza administracyjnego.

---

### Etap 4: Lepsze wykorzystanie wolnego dnia i dni bez treningu

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Dodać bardziej wartościowy stan `Wolny dzień`:
- regeneracja,
- przypomnienie o planie tygodnia,
- odpowiedź od trenera,
- informacja o jutrzejszym treningu.

2. Rozważyć „co dalej” dla dnia bez sesji:
- `Sprawdź plan`
- `Przeczytaj odpowiedź trenera`
- `Zobacz historię`

3. Upewnić się, że wolny dzień nie wygląda jak pusty ekran.

#### Pliki

- `app/u/[slug]/_components/AthleteTodayPage.tsx`

#### Kryteria ukończenia

- dzień bez treningu nadal daje użytkownikowi wartość,
- ekran nie wygląda jak brak danych.

---

### Etap 5: Plan jako lepszy ekran orientacji, nie tylko kalendarz

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Dopracować tydzień jako główny widok orientacyjny:
- wyraźniej zaznaczyć dziś,
- jutrzejszy trening,
- ukończone / nieukończone,
- feedback istnieje / brak feedbacku.

2. Ulepszyć widok miesiąca:
- bardziej do szybkiej orientacji,
- mniej „mini tabela”, bardziej kalendarz planu.

3. Dodać prosty skrót:
- ile treningów w tygodniu,
- ile zrobionych,
- co dalej.

4. Rozważyć lepsze przejście z `Planu` do `Dziś`
- jeśli użytkownik wybiera konkretny dzień.

#### Pliki

- `app/u/[slug]/_components/AthletePlanPage.tsx`

#### Kryteria ukończenia

- `Plan` pomaga szybko zorientować się w tygodniu,
- użytkownik łatwo przechodzi z orientacji do działania.

---

### Etap 6: Historia jako realne „plan vs wykonanie”

Priorytet: **Wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Wzmocnić warstwę `plan vs wykonanie`:
- zaplanowany trening,
- wykonany trening,
- zgodność / różnica,
- brak wykonania.

2. Dodać lepsze podsumowania miesięczne:
- liczba sesji,
- km,
- czas,
- zgodność z planem.

3. Jeśli Strava jest podłączona:
- lepiej pokazać jej rolę:
  - automatyczny import,
  - porównanie,
  - uzupełnienie historii.

4. Uprościć układ i język miesięcy.

#### Pliki

- `app/u/[slug]/_components/AthleteHistoryPage.tsx`
- `app/u/[slug]/history/page.tsx`

#### Kryteria ukończenia

- historia pokazuje nie tylko co było, ale jak to się miało do planu,
- sekcja daje realny wgląd w postęp zawodnika.

---

### Etap 7: Czat jako szybki i bezproblemowy kanał kontaktu

Priorytet: **Wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Dodać optimistic send:
- wiadomość powinna pojawić się lokalnie od razu po wysłaniu.

2. Ograniczyć polling:
- dodać obsługę visibility,
- nie odświeżać agresywnie, gdy zakładka nie jest aktywna.

3. Dodać lepszy stan wysyłania / błędu
- bardziej czytelny niż samo `...`

4. Rozważyć separatory dni i czytelniejsze grupowanie wiadomości.

5. Upewnić się, że unread od coacha znika lokalnie bardziej przewidywalnie.

#### Pliki

- `app/u/[slug]/_components/AthleteChatPage.tsx`
- `lib/actions/messages.ts`

#### Kryteria ukończenia

- czat daje poczucie szybkiej i naturalnej komunikacji,
- nie sprawia wrażenia „refreshowego”.

---

### Etap 8: Bottom navigation i hierarchia mobilna

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Ograniczyć bottom nav do najważniejszych sekcji:
- `Dziś`
- `Plan`
- `Historia`
- `Czat`
- ewentualnie `Więcej`

2. Przenieść:
- theme toggle,
- logout
do ekranu `Więcej` / ustawień zawodnika / menu dodatkowego.

3. Dopracować active state i czytelność nawigacji.

4. Zachować prostotę i jednoznaczność na mobile.

#### Pliki

- `app/u/[slug]/_components/AthleteBottomNav.tsx`
- ewentualne nowe ekrany dodatkowe

#### Kryteria ukończenia

- bottom nav pokazuje tylko to, co najważniejsze na co dzień,
- mobilna nawigacja jest lżejsza i bardziej naturalna.

---

### Etap 9: Lepsze stany błędu, braku dostępu i przejść

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Dopracować ekran bez dostępu:
- wygasły link,
- brak sesji,
- potrzeba nowego zaproszenia.

2. Dodać czytelniejsze przejścia po błędach:
- feedback save failed,
- chat send failed,
- strava connect failed.

3. Upewnić się, że stany puste nie wyglądają jak awarie.

4. Dopracować ekran błędu `app/u/[slug]/error.tsx`
- bardziej produktowy i mniej techniczny.

#### Pliki

- `app/u/[slug]/page.tsx`
- `app/u/[slug]/error.tsx`
- `app/u/[slug]/_components/FeedbackModal.tsx`
- `app/u/[slug]/_components/AthleteChatPage.tsx`

#### Kryteria ukończenia

- użytkownik zawsze rozumie, co się stało i co ma zrobić dalej,
- mniej szczęśliwe ścieżki są domknięte UX-owo.

---

### Etap 10: Spójność danych, dat i architektury

Priorytet: **Średni**
Ryzyko: **Średnie**

#### Zakres

1. Ujednolicić logikę dat:
- korzystać konsekwentnie z helperów biznesowych,
- ograniczyć lokalne `new Date(...)` tam, gdzie to ryzykowne.

2. Wydzielić wspólną logikę panelu zawodnika:
- daty,
- statusy dnia,
- feedback state,
- chat updates.

3. Ograniczyć techniczny ciężar komponentów:
- `AthleteTodayPage`
- `AthleteHistoryPage`
- `AthleteChatPage`
- `FeedbackModal`

4. Dodać testy helperów najważniejszych przepływów, jeśli będą wydzielane.

#### Pliki

- `app/u/[slug]/_components/AthleteTodayPage.tsx`
- `app/u/[slug]/_components/AthleteHistoryPage.tsx`
- `app/u/[slug]/_components/AthleteChatPage.tsx`
- `app/u/[slug]/_components/FeedbackModal.tsx`
- nowe helpery w `lib/`

#### Kryteria ukończenia

- mobilny panel zawodnika ma uporządkowaną logikę,
- mniej lokalnych wyjątków i mniejsze ryzyko rozjazdu dat i stanów.

---

### Etap 11: Final polish UX/UI

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Dopracować hierarchię wizualną:
- ekran `Dziś`,
- przyciski feedbacku,
- odpowiedź trenera,
- stany ukończenia.

2. Dopracować mikrocopy:
- feedback,
- czat,
- wolny dzień,
- historia,
- stany dostępu.

3. Dopracować motion i feel:
- przejścia między stanami,
- otwieranie modali,
- zapis feedbacku.

4. Dopracować accessibility:
- focus states,
- tap targets,
- kontrast,
- czytelność tekstu na mobile.

#### Pliki

- `app/u/[slug]/_components/AthleteTodayPage.tsx`
- `app/u/[slug]/_components/AthletePlanPage.tsx`
- `app/u/[slug]/_components/AthleteHistoryPage.tsx`
- `app/u/[slug]/_components/AthleteChatPage.tsx`
- `app/u/[slug]/_components/AthleteBottomNav.tsx`

#### Kryteria ukończenia

- panel zawodnika wygląda i działa jak dopracowana aplikacja mobile-first,
- nie jest już tylko webowym panelem zwężonym do telefonu.

---

### Rekomendowana kolejność wdrożenia

1. Etap 1: Uporządkowanie głównego flow „Dziś”
2. Etap 2: Uproszczenie i doprecyzowanie feedback flow
3. Etap 3: Szybszy i bardziej mobilny modal feedbacku
4. Etap 4: Lepsze wykorzystanie wolnego dnia i dni bez treningu
5. Etap 5: Plan jako lepszy ekran orientacji
6. Etap 6: Historia jako realne „plan vs wykonanie”
7. Etap 7: Czat jako szybki i bezproblemowy kanał kontaktu
8. Etap 8: Bottom navigation i hierarchia mobilna
9. Etap 9: Lepsze stany błędu, braku dostępu i przejść
10. Etap 10: Spójność danych, dat i architektury
11. Etap 11: Final polish UX/UI

---

### Minimalny zestaw o największym wpływie

Jeśli chcemy szybki, mocny upgrade `Panelu zawodnika mobile`, największy efekt dadzą:

- Etap 1
- Etap 2
- Etap 3
- Etap 7
- Etap 8

---

## Error states

### Cel sekcji

`Error states` mają być nie tylko techniczną siatką bezpieczeństwa, ale realną warstwą produktu, która:

- wyjaśnia, co się stało,
- mówi, co użytkownik może zrobić dalej,
- i pomaga odzyskać kontrolę nad sytuacją.

Po pełnym wdrożeniu ta sekcja ma odpowiadać na trzy pytania:

- czy to chwilowy błąd, czy coś poważniejszego,
- czy retry ma sens,
- gdzie mam wrócić albo co zrobić dalej.

---

### Aktualna ocena

Obecne error boundaries spełniają minimalną rolę bezpieczeństwa:

- istnieje fallback globalny,
- istnieje fallback dla panelu trenera,
- istnieje fallback dla panelu zawodnika,
- każdy daje podstawowy komunikat i przycisk `Spróbuj ponownie`.

Największe braki:

- wszystkie błędy wyglądają praktycznie tak samo,
- `reset()` jest jedynym realnym CTA,
- brakuje rozróżnienia typów błędów,
- brak kontekstowych ścieżek wyjścia,
- stany błędów są bardziej techniczne niż produktowe.

---

### Definicja ukończenia

Sekcję `Error states` uznajemy za domkniętą, gdy:

- użytkownik rozumie, co mniej więcej się stało,
- ekrany błędu rozróżniają podstawowe klasy problemów,
- dostępne są sensowne CTA odzyskania kontroli,
- błędy są osadzone w kontekście miejsca:
  - global,
  - coach,
  - athlete,
- error states budują zaufanie zamiast tylko mówić „spróbuj ponownie”.

---

### Etap 1: Uporządkowanie strategii błędów

Priorytet: **Krytyczny**
Ryzyko: **Niskie**

#### Zakres

1. Zdefiniować podstawowe klasy błędów:
- chwilowy błąd aplikacji,
- brak dostępu / utrata sesji,
- problem z danymi lub integracją,
- błąd po akcji użytkownika.

2. Ustalić, które klasy mają być obsługiwane przez:
- error boundary,
- stany inline,
- dedykowane ekrany lub komunikaty.

3. Rozdzielić:
- globalny błąd aplikacji,
- błąd wewnątrz panelu coacha,
- błąd w panelu zawodnika.

#### Pliki

- `app/error.tsx`
- `app/coach/error.tsx`
- `app/u/[slug]/error.tsx`
- ewentualne helpery w `lib/`

#### Kryteria ukończenia

- zespół ma spójną strategię error handlingu,
- błędy nie są już traktowane jako jedna generyczna kategoria.

---

### Etap 2: Kontekstowe CTA odzyskania kontroli

Priorytet: **Bardzo wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Dodać sensowne CTA zależne od miejsca:
- global:
  - `Wróć na stronę główną`
- coach:
  - `Wróć do Dashboardu`
  - `Wróć do Zawodników`
- athlete:
  - `Wróć do dziś`
  - `Otwórz czat`
  - `Skontaktuj się z trenerem`

2. Nie ograniczać recovery tylko do `reset()`.

3. Ustalić, kiedy retry jest główną akcją, a kiedy tylko jedną z opcji.

#### Pliki

- `app/error.tsx`
- `app/coach/error.tsx`
- `app/u/[slug]/error.tsx`

#### Kryteria ukończenia

- użytkownik zawsze ma jasną drogę wyjścia z błędu,
- ekran błędu nie kończy się wyłącznie na `Spróbuj ponownie`.

---

### Etap 3: Lepsze rozróżnienie typów błędów w copy i UI

Priorytet: **Wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Dodać minimum 2-3 warianty komunikatów:
- chwilowy problem,
- brak dostępu / sesji,
- problem integracji / danych.

2. Rozważyć lekkie różnice wizualne:
- neutralny problem techniczny,
- ostrzeżenie dostępu,
- problem integracyjny.

3. Dopasować ton do kontekstu:
- coach bardziej roboczo i operacyjnie,
- athlete bardziej prosto i uspokajająco.

#### Pliki

- `app/error.tsx`
- `app/coach/error.tsx`
- `app/u/[slug]/error.tsx`
- helper klasyfikacji błędów jeśli powstanie

#### Kryteria ukończenia

- użytkownik widzi różnicę między typami błędów,
- komunikaty są bardziej pomocne i mniej generyczne.

---

### Etap 4: Coach error jako część panelu, nie osobna kartka

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Lepiej osadzić błąd wewnątrz kontekstu panelu trenera.

2. Rozważyć zachowanie większej ilości kontekstu nawigacyjnego:
- shell,
- topbar,
- szybki powrót do głównych modułów.

3. Dodać bardziej operacyjne CTA:
- `Dashboard`
- `Zawodnicy`
- `Spróbuj ponownie`

#### Pliki

- `app/coach/error.tsx`
- ewentualnie wspólne komponenty error state

#### Kryteria ukończenia

- błąd w panelu coacha nie odcina użytkownika od całego środowiska pracy,
- recovery jest zgodny z roboczym charakterem panelu.

---

### Etap 5: Athlete error jako mobile-first recovery flow

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Dopracować prosty i mobilny ekran błędu dla zawodnika.

2. Dodać prostsze, bardziej praktyczne CTA:
- `Spróbuj ponownie`
- `Wróć do dziś`
- `Napisz do trenera` albo `Skontaktuj się z trenerem`

3. Uprościć język:
- mniej techniczny,
- bardziej „co dalej”.

#### Pliki

- `app/u/[slug]/error.tsx`

#### Kryteria ukończenia

- zawodnik wie, co zrobić dalej,
- ekran błędu jest prosty i zgodny z mobile-first doświadczeniem.

---

### Etap 6: Spójność z auth, sesją i dostępem

Priorytet: **Wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Upewnić się, że błędy związane z auth i sesją nie trafiają zawsze do generycznego error state.

2. Rozdzielić:
- utratę sesji coacha,
- utratę sesji zawodnika,
- wygasły link zaproszenia,
- brak dostępu do zasobu.

3. Dla tych przypadków kierować do bardziej właściwych ekranów lub komunikatów niż zwykły error boundary.

#### Pliki

- `app/error.tsx`
- `app/coach/error.tsx`
- `app/u/[slug]/error.tsx`
- miejsca związane z auth/session flow

#### Kryteria ukończenia

- użytkownik nie trafia do generycznego błędu tam, gdzie problem dotyczy po prostu sesji lub dostępu,
- auth i access errors mają własną ścieżkę UX.

---

### Etap 7: Lepsze stany błędów inline poza error boundary

Priorytet: **Średni**
Ryzyko: **Średnie**

#### Zakres

1. Ustalić, które błędy nie powinny prowadzić do pełnego ekranu błędu:
- nieudany zapis feedbacku,
- nieudana wysyłka wiadomości,
- problem synchronizacji Stravy,
- problem pobrania powiadomień,
- problem uploadu.

2. Dodać bardziej świadome stany inline:
- retry,
- komunikat,
- lokalny fallback.

3. Ograniczyć sytuacje, w których małe problemy kończą się pełnym error state.

#### Pliki

- `app/u/[slug]/_components/FeedbackModal.tsx`
- `app/u/[slug]/_components/AthleteChatPage.tsx`
- `components/coach/NotificationBell.tsx`
- inne krytyczne mikroflow

#### Kryteria ukończenia

- drobne błędy operacyjne są obsługiwane lokalnie,
- error boundary zostaje dla naprawdę większych problemów.

---

### Etap 8: Wspólne komponenty i helpery error state

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Rozważyć wspólny komponent bazowy error state:
- ikona,
- tytuł,
- opis,
- akcje,
- wariant tonalny.

2. Wydzielić helper mapujący błędy na typy i komunikaty.

3. Ułatwić spójny rozwój error states w całym systemie.

#### Pliki

- nowe komponenty w `components/ui/` lub `components/shared/`
- helpery w `lib/`
- `app/error.tsx`
- `app/coach/error.tsx`
- `app/u/[slug]/error.tsx`

#### Kryteria ukończenia

- error states są spójne i łatwe do utrzymania,
- nie powstają trzy osobne, ręcznie klejone warianty.

---

### Etap 9: Final polish UX/UI

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Dopracować hierarchię komunikatów:
- tytuł,
- opis,
- główna akcja,
- akcje dodatkowe.

2. Dopracować mikrocopy:
- mniej techniczne,
- bardziej zadaniowe,
- bardziej pomocne.

3. Dopracować accessibility:
- focus states,
- aria labels,
- kolejność działań,
- kontrast.

4. Dopracować mobile / desktop feeling:
- spacing,
- wielkość CTA,
- rytm układu.

#### Pliki

- `app/error.tsx`
- `app/coach/error.tsx`
- `app/u/[slug]/error.tsx`
- wspólne komponenty jeśli powstaną

#### Kryteria ukończenia

- error states wyglądają jak dopracowana część produktu,
- nie są już tylko technicznym fallbackiem.

---

### Rekomendowana kolejność wdrożenia

1. Etap 1: Uporządkowanie strategii błędów
2. Etap 2: Kontekstowe CTA odzyskania kontroli
3. Etap 3: Lepsze rozróżnienie typów błędów w copy i UI
4. Etap 4: Coach error jako część panelu
5. Etap 5: Athlete error jako mobile-first recovery flow
6. Etap 6: Spójność z auth, sesją i dostępem
7. Etap 7: Lepsze stany błędów inline poza error boundary
8. Etap 8: Wspólne komponenty i helpery error state
9. Etap 9: Final polish UX/UI

---

### Minimalny zestaw o największym wpływie

Jeśli chcemy szybki, mocny upgrade `Error states`, największy efekt dadzą:

- Etap 2
- Etap 3
- Etap 4
- Etap 5
- Etap 6
