## Login / Register

### Cel sekcji

`Login / Register` mają być dopracowanym wejściem do produktu, a nie tylko prostym formularzem auth.

Po pełnym wdrożeniu ta sekcja ma odpowiadać na trzy pytania:

- jak szybko i bezpiecznie wejść do panelu,
- co stanie się po zalogowaniu albo rejestracji,
- co zrobić, jeśli coś poszło nie tak lub utraciłem dostęp.

---

### Aktualna ocena

Obecne flow jest czyste i funkcjonalne:

- ekrany są proste i czytelne,
- używają `useActionState` i server actions,
- callback auth ma zabezpieczenie przed open redirect,
- login i rejestracja są wizualnie spójne.

Największe braki:

- brak guardu dla zalogowanego użytkownika na `/login` i `/register`,
- nie do końca jasny model po rejestracji i ewentualnym potwierdzeniu emaila,
- surowe komunikaty błędów z backendu,
- brak resetu hasła,
- zbyt słabe pierwsze wrażenie i zbyt mało kontekstu produktowego.

---

### Definicja ukończenia

Sekcję `Login / Register` uznajemy za domkniętą, gdy:

- zalogowany użytkownik nie trafia już na ekrany auth,
- login, register i callback mają spójny i przewidywalny flow,
- użytkownik dokładnie wie, co dzieje się po rejestracji,
- błędy są ludzkie i czytelne,
- dostęp można odzyskać bez kontaktu z supportem,
- ekrany budują zaufanie i dobre pierwsze wrażenie produktu.

---

### Etap 1: Uporządkowanie flow wejścia i wyjścia z auth

Priorytet: **Krytyczny**
Ryzyko: **Niskie**

#### Zakres

1. Dodać guard dla zalogowanego użytkownika:
- jeśli istnieje aktywna sesja, `/login` i `/register` powinny przekierowywać do panelu.

2. Ustalić docelowy landing po auth:
- `dashboard`
- albo `athletes`
- ale świadomie i spójnie.

3. Ujednolicić redirect po:
- loginie,
- rejestracji,
- callbacku auth.

4. Rozważyć obsługę `next`
- jeśli użytkownik próbował wejść na chronioną stronę przed logowaniem.

#### Pliki

- `app/login/page.tsx`
- `app/register/page.tsx`
- `lib/actions/auth.ts`
- `app/api/auth/callback/route.ts`

#### Kryteria ukończenia

- zalogowany użytkownik nie trafia już na ekrany auth,
- po loginie i rejestracji zawsze trafia do logicznego miejsca.

---

### Etap 2: Jasny model rejestracji i potwierdzenia emaila

Priorytet: **Bardzo wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Ustalić model docelowy:
- natychmiastowy dostęp po rejestracji,
- albo obowiązkowe potwierdzenie emaila.

2. Dostosować UX do tego modelu:
- jeśli trzeba potwierdzić email:
  - nie redirectować tak, jakby konto było gotowe,
  - pokazać ekran sukcesu z instrukcją.
- jeśli konto działa od razu:
  - zakomunikować to jednoznacznie.

3. Dodać komunikaty po rejestracji:
- co się stało,
- co użytkownik ma zrobić dalej,
- gdzie trafi po zakończeniu procesu.

#### Pliki

- `lib/actions/auth.ts`
- `app/register/page.tsx`
- ewentualna nowa strona sukcesu po rejestracji

#### Kryteria ukończenia

- użytkownik po rejestracji dokładnie wie, czy ma już dostęp, czy musi wykonać dodatkowy krok,
- flow rejestracji nie zostawia niepewności.

---

### Etap 3: Lepsza walidacja i komunikaty błędów

Priorytet: **Bardzo wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Dodać walidację po stronie serwera
- najlepiej przez schematy dla email, hasło i name.

2. Dodać mapowanie błędów auth na własne komunikaty:
- zły email/hasło,
- konto już istnieje,
- za słabe hasło,
- problem z potwierdzeniem,
- błąd chwilowy / sieciowy.

3. Dodać bardziej precyzyjne komunikaty przy formularzu
- nie tylko „error”, ale co dokładnie poszło nie tak.

4. Rozważyć lepsze przypięcie błędu do pola
- jeśli błąd dotyczy konkretnego inputu.

#### Pliki

- `lib/actions/auth.ts`
- ewentualne schematy w `lib/`
- `app/login/page.tsx`
- `app/register/page.tsx`

#### Kryteria ukończenia

- użytkownik dostaje jasne i ludzkie komunikaty,
- auth flow nie pokazuje surowych błędów backendu.

---

### Etap 4: Odzyskiwanie hasła

Priorytet: **Bardzo wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Dodać link `Nie pamiętasz hasła?`
- na ekranie logowania.

2. Przygotować ekran lub modal resetu hasła.

3. Dodać jasne komunikaty:
- wysłaliśmy link,
- sprawdź email,
- co zrobić jeśli wiadomość nie przyszła.

4. Spiąć to z istniejącym systemem auth Supabase.

#### Pliki

- `app/login/page.tsx`
- nowe ekrany lub komponenty resetu hasła
- helpery auth w `lib/`

#### Kryteria ukończenia

- użytkownik może samodzielnie odzyskać dostęp,
- login nie wymaga już kontaktu z supportem przy utracie hasła.

---

### Etap 5: Lepszy UX formularzy

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Dodać bardziej świadomą walidację client-side
- zanim użytkownik wyśle formularz.

2. Rozważyć:
- `pokaż / ukryj hasło`,
- lepsze autofocusy,
- lepsze focus states.

3. W rejestracji rozważyć:
- potwierdzenie hasła,
- wskaźnik siły hasła,
- bardziej czytelne wymagania.

4. Dopracować stany pending
- bardziej czytelne i bardziej „pewne”.

#### Pliki

- `app/login/page.tsx`
- `app/register/page.tsx`

#### Kryteria ukończenia

- użytkownik rzadziej popełnia błędy,
- formularze są bardziej bezpieczne i pewne w użyciu.

---

### Etap 6: Lepsze pierwsze wrażenie i zaufanie do produktu

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Dodać trochę kontekstu produktu:
- dla kogo jest panel,
- co użytkownik dostaje po wejściu,
- krótka wartość.

2. Dodać elementy budujące zaufanie:
- bezpieczne logowanie,
- odzyskiwanie dostępu,
- prywatność,
- ewentualnie info o starcie, jeśli to produktowo prawdziwe.

3. Lekko zróżnicować `login` i `register`
- login bardziej „wróć do panelu”,
- register bardziej „załóż konto i zacznij”.

4. Zachować prostotę
- to nadal ma być szybki ekran auth, nie landing page.

#### Pliki

- `app/login/page.tsx`
- `app/register/page.tsx`

#### Kryteria ukończenia

- ekrany wejścia budują zaufanie i wartość,
- auth flow wygląda jak świadoma część produktu.

---

### Etap 7: Spójność z resztą systemu

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Ujednolicić język z resztą aplikacji:
- `panel trenera`,
- `konto`,
- `ustawienia`,
- `pomoc`.

2. Ujednolicić branding z głównym shellem i resztą designu.

3. Dostosować redirect po auth do aktualnej strategii produktu
- jeśli dashboard jest głównym hubem, auth powinien do niego prowadzić.

4. Rozważyć późniejsze wejścia onboardingowe po pierwszym logowaniu
- ustawienia profilu,
- pakiety,
- pierwszy zawodnik.

#### Pliki

- `app/login/page.tsx`
- `app/register/page.tsx`
- `lib/actions/auth.ts`
- ewentualne flow onboardingowe

#### Kryteria ukończenia

- auth flow jest naturalnym początkiem całego systemu,
- nie wygląda jak osobny lub starszy moduł.

---

### Etap 8: Architektura i bezpieczeństwo warstwy auth

Priorytet: **Średni**
Ryzyko: **Średnie**

#### Zakres

1. Dodać schematy walidacji dla login/register.

2. Wydzielić mapowanie błędów auth do helpera
- aby nie powielać logiki.

3. Uporządkować redirecty i callbacki:
- login,
- register,
- callback auth,
- reset hasła, jeśli dojdzie.

4. Przejrzeć bezpieczeństwo flow:
- brak open redirectów,
- poprawne obsłużenie `next`,
- poprawne zachowanie przy częściowo aktywnej sesji.

#### Pliki

- `lib/actions/auth.ts`
- `app/api/auth/callback/route.ts`
- nowe helpery auth w `lib/`

#### Kryteria ukończenia

- auth flow jest technicznie równie dopracowany jak reszta aplikacji,
- warstwa auth jest łatwiejsza do utrzymania.

---

### Etap 9: Final polish UX/UI

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Dopracować hierarchię wizualną kart i formularzy
- tytuł,
- opis,
- pola,
- błędy,
- CTA.

2. Dopracować mikrocopy
- logowanie,
- rejestracja,
- błędy,
- sukcesy,
- reset hasła.

3. Dopracować accessibility
- focus states,
- aria labels,
- poprawne label/input semantics,
- kontrast.

4. Sprawdzić zachowanie mobile
- rytm,
- paddingi,
- wielkość pól,
- CTA.

#### Pliki

- `app/login/page.tsx`
- `app/register/page.tsx`
- nowe komponenty auth jeśli powstaną

#### Kryteria ukończenia

- auth flow wygląda i działa jak dopracowana część produktu,
- nie sprawia już wrażenia tylko technicznego formularza.

---

### Rekomendowana kolejność wdrożenia

1. Etap 1: Uporządkowanie flow wejścia i wyjścia z auth
2. Etap 2: Jasny model rejestracji i potwierdzenia emaila
3. Etap 3: Lepsza walidacja i komunikaty błędów
4. Etap 4: Odzyskiwanie hasła
5. Etap 5: Lepszy UX formularzy
6. Etap 6: Lepsze pierwsze wrażenie i zaufanie do produktu
7. Etap 7: Spójność z resztą systemu
8. Etap 8: Architektura i bezpieczeństwo warstwy auth
9. Etap 9: Final polish UX/UI

---

### Minimalny zestaw o największym wpływie

Jeśli chcemy szybki, mocny upgrade `Login / Register`, największy efekt dadzą:

- Etap 1
- Etap 2
- Etap 3
- Etap 4
- Etap 5

---

### Uzupełnienie techniczne (z audytu kodu — plan2.md)

Poniższe punkty zostały wykryte podczas audytu kodu i uzupełniają powyższy plan produktowy o konkretne detale implementacyjne.

#### Sanityzacja email
- W `login` i `register` actions: `email.trim().toLowerCase()` przed wysłaniem do Supabase
- Spacje na końcu lub wielkie litery powodują "Invalid login credentials" mimo poprawnych danych
- **Wpada do:** Etap 3 (walidacja i komunikaty błędów)

#### Focus state + placeholdery
- `outline: 'none'` na inputach — brak widocznego focus ring (accessibility problem)
- Login nie ma placeholderów (register ma `"np. Tomasz Kowalski"` i `"min. 6 znaków"`)
- Przycisk submit bez hover state
- **Wpada do:** Etap 5 (lepszy UX formularzy) lub Etap 9 (final polish)

#### "Powtórz hasło" w rejestracji
- Register ma jedno pole hasła bez potwierdzenia — literówka = zablokowane konto
- W ustawieniach zmiana hasła wymaga potwierdzenia, ale przy rejestracji nie — niespójne
- **Wpada do:** Etap 5 (lepszy UX formularzy)

#### Email confirmation handling
- Po `signUp` od razu redirect do `/coach/athletes`
- Jeśli Supabase wymaga email confirmation — trener trafia na stronę z błędem auth
- Sprawdzić `data.user?.confirmed_at` — jeśli brak, pokazać info zamiast redirect
- **Wpada do:** Etap 2 (model rejestracji i potwierdzenia)

#### Inline styles → Tailwind
- Wyłącznie inline `style={{...}}` — niespójne z resztą aplikacji (Tailwind + CSS vars)
- ~80% kodu zduplikowane między login i register
- Border-radius `10px` zamiast `rounded-xl` (12px) jak w reszcie
- **Wpada do:** Etap 9 (final polish) lub osobny krok refaktorowy

#### Pliki dotyczące tej sekcji
- `app/login/page.tsx`
- `app/register/page.tsx`
- `lib/actions/auth.ts`
- `app/api/auth/callback/route.ts`

#### Wspólny layout (z plan2 LR4)
- Login i register mają ~80% wspólnego kodu (layout, logo, card wrapper, input styles)
- Rozważyć wydzielenie `AuthLayout` komponentu — logo + card + bottom link
- **Wpada do:** Etap 9 (final polish) lub osobny refaktor

#### Poza zakresem (z plan2)
- Social login (Google)
- Toggle "Pokaż hasło"
- Terms/privacy checkbox przy rejestracji
- Rate limiting na formularzu auth

---

