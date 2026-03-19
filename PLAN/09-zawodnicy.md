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

