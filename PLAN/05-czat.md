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

