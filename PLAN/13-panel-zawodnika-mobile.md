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

