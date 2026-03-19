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
