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

### Uzupełnienie techniczne (z audytu kodu — plan2.md)

Poniższe punkty zostały wykryte podczas audytu kodu i uzupełniają plan produktowy o konkretne detale implementacyjne.

#### A1: Deduplikacja helperów + import calendar utils
- `isInvoiceOverdue` i `isInvoicePending` zduplikowane w `InvoicesClient.tsx` i `analytics/page.tsx`
- `prevYM` obliczany inline — identyczny `shiftMonth` jest w `lib/calendar.ts`
- Wydzielić do wspólnego `lib/invoice-helpers.ts`, zaimportować `shiftMonth`
- **Wpada do:** Etap 1 (semantyka) + Etap 9 (architektura)

#### A2: Limity na tabele + empty state
- Tabela miesięczna renderuje PEŁNĄ historię bez limitu (może być 60+ wierszy)
- Top zawodnicy renderuje WSZYSTKICH z fakturami (50+)
- Brak ogólnego empty state dla nowego trenera
- Tabela miesięczna: domyślnie 12, przycisk "Pokaż pełną historię"
- Top zawodnicy: domyślnie top 10, przycisk "Pokaż wszystkich"
- EmptyState gdy brak faktur
- **Wpada do:** Etap 4 (tabela) + Etap 10 (polish)

#### A3: Wykres — oś Y + linie siatki
- Wykres słupkowy nie ma osi Y ani linii siatki
- Dodać 3-4 horyzontalnych linii z wartościami
- **Wpada do:** Etap 3 (wykresy)

#### A4: Wybór zakresu dat
- "Ostatnie 12 miesięcy" hardcoded
- Dodać select: Ostatnie 12 mies. / Rok / Wszystko
- Wymaga wydzielenia Client Component
- **Wpada do:** Etap 8 (filtry czasu) — większa zmiana architektoniczna

#### A5: Suma pod tabelą top zawodników
- Brak wiersza "Razem" w tabeli top zawodników
- Dodać `<tfoot>` z sumą przychodu i liczbą faktur
- **Wpada do:** Etap 5 (analityka zawodników)

#### Pliki dotyczące tej sekcji
- `app/coach/analytics/page.tsx` (312 linii, Server Component)

#### Poza zakresem (z plan2)
- Analityka treningowa (km, sesje, compliance, feedback trend)
- Drill-down (kliknięcie → filtrowanie faktur)
- Porównanie rok do roku (Y-o-Y)
- Eksport CSV/PDF

---

