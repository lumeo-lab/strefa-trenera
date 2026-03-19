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

### Uzupełnienie techniczne (z audytu kodu — plan2.md)

#### H1: Backticki + duplikat filtra
- Tekst renderuje backticki jako tekst zamiast formatowania
- Kategorie FAQ wyświetlane w pills I select jednocześnie — redundancja
- Zamienić backticki na `<a href="mailto:...">`, usunąć select kategorii
- **Wpada do:** Etap 3 (FAQ) + Etap 10 (polish)

#### H2: Pre-fill formularza + przeorganizowanie sekcji
- Formularz kontaktowy nie pre-filluje emaila i imienia
- FAQ zaczyna się dopiero po ~800px scrollu
- Połączyć "Szybki kontakt" i formularz, zmienić kolejność sekcji
- **Wpada do:** Etap 4 (ścieżki) + Etap 8 (formularz)

#### H3: Empty state FAQ + rozbicie pliku
- Empty state FAQ to Card z tekstem — brak ikony, niespójne z EmptyState
- 566 linii w jednym pliku
- Zamienić na EmptyState z ikoną 🔎, rozważyć rozbicie na komponenty
- **Wpada do:** Etap 3 (FAQ) + Etap 2 (architektura)

#### H4: Hardcoded dane kontaktowe
- Email i numer telefonu hardcoded w JSX w wielu miejscach
- Przenieść do `lib/constants.ts`: SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP
- **Wpada do:** Etap 8 (formularz)

#### Pliki dotyczące tej sekcji
- `app/coach/help/page.tsx` (566 linii, Client Component)
- `app/api/contact/route.ts`

#### Poza zakresem (z plan2)
- Wysyłanie głosów "Czy to pomogło?" na serwer (analytics)
- Konwersja na Server Component + wydzielone Client Components
- Changelog / what's new
- Keyboard shortcuts reference

---

