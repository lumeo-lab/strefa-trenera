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

