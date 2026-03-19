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

