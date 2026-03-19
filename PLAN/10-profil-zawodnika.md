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

