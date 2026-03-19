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

### Uzupełnienie techniczne (z audytu kodu — plan2.md)

#### S1: Disabled upload + progress avatara
- Podczas uploadu avatara formularz pozostaje aktywny, brak wizualnego feedbacku
- Disable emoji grid + file input gdy `avatarPending` (pointer-events-none + opacity)
- **Wpada do:** Etap 4 (awatar)

#### S2: Auto-dismiss success messages
- Komunikaty sukcesu zostają na stałe — trener wraca po godzinie i widzi zielony komunikat
- Dodać auto-dismiss po 4 sekundach
- **Wpada do:** Etap 10 (spójność zapisów)

#### S3: Deduplikacja typu ArchivedAthlete
- `ArchivedAthlete` zdefiniowany identycznie w SettingsClient i SettingsArchiveTab
- Import z SettingsClient zamiast duplikacji
- **Wpada do:** Etap 11 (rozbicie komponentów)

#### S4: Archiwum — responsywność + confirm przywracania
- Tabela 5-kolumnowa bez `overflow-x-auto` — na mobile się nie mieści
- "Przywróć" natychmiastowe bez confirmacji
- Dodać overflow-x-auto + confirm przed przywróceniem
- **Wpada do:** Etap 9 (archiwum)

#### S5: Kompresja sekcji avatara + karta Plan
- Sekcja avatara zajmuje ~300px (emoji grid 24szt + upload)
- Karta Plan czysto informacyjna, zero interaktywności
- Zmniejszyć emoji grid do 2 rzędów z "Pokaż więcej"
- Zwinąć kartę Plan do jednej linii
- **Wpada do:** Etap 4 (awatar) + Etap 3 (profil)

#### S6: Walidacja ceny pakietu
- Formularz pakietu nie waliduje ceny — 0 zł lub ujemna dozwolona
- Dodać min="0.01" + walidacja po stronie klienta
- **Wpada do:** Etap 8 (pakiety)

#### Pliki dotyczące tej sekcji
- `app/coach/settings/_components/SettingsClient.tsx`
- `app/coach/settings/_components/SettingsArchiveTab.tsx`
- `app/coach/packages/_components/PackagesClient.tsx`
- `lib/actions/profile.ts`

#### Poza zakresem (z plan2)
- Ustawienia powiadomień (push/email preferences)
- Motyw (dark/light) w ustawieniach (teraz jest w topbar)
- Opcja usunięcia konta (RODO)

---

