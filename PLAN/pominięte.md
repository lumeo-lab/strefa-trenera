# Pominięte i odłożone elementy planu

Ostatnia aktualizacja: 2026-03-19

Ten plik zawiera wszystkie punkty z planów, które zostały świadomie pominięte, odłożone na później lub zrealizowane w okrojonej wersji — wraz z uzasadnieniem.

---

## Faza 0: Bezpieczeństwo (plan2.md SEC1-SEC7)

### SEC1: Invite token expiry + rotacja — POMINIĘTY
**Powód:** Celowa decyzja produktowa. CLAUDE.md jawnie mówi: "invite links are intentionally stable and reusable" i "do not reintroduce invite expiry / rotation / generate new link UX unless explicitly requested". Memory projektu potwierdza: jeden stały link per zawodnik, bez regeneracji.
**Skutek:** Wygasłe linki zaproszenia nadal działają — to zamierzone zachowanie, nie bug.

### SEC5: Push subscription validation — OKROJONY
**Powód:** Plan zakładał Zod walidację struktury subscription object (endpoint HTTPS URL, auth/p256dh keys). Zrealizowano tylko rate limiting na contact form. Push validation pominięty — brak Zod schema dla Web Push w projekcie, istniejąca walidacja endpoint obecna jest po stronie browser API.
**Skutek:** Nieprawidłowe push subscriptions mogą trafiać do bazy, ale w praktyce browser API nie pozwala na wysłanie złego formatu.

---

## Faza 1: Login / Register (01-login-register.md Etapy 1-9)

### Etap 3 punkt 4: Przypięcie błędu do konkretnego pola
**Powód:** Plan mówi "rozważyć lepsze przypięcie błędu do pola". Nie zrealizowane — błędy auth z Supabase nie wskazują konkretnego pola (np. "Invalid login credentials" nie mówi czy problem to email czy hasło). Zrealizowano ogólne mapowanie błędów na polskie komunikaty.
**Skutek:** Błąd wyświetla się jako ogólny komunikat nad przyciskiem submit, nie przy konkretnym inpucie.

### Etap 5 punkt 2: Pokaż / ukryj hasło (toggle visibility)
**Powód:** Plan mówi "rozważyć". Nie zrealizowane — wymaga dodatkowego stanu per input + toggle button. Ryzyko rozwiązane inaczej: dodano "Powtórz hasło" w rejestracji (literówka w haśle nie blokuje konta).
**Skutek:** Użytkownik nie może podejrzeć wpisywanego hasła. To standardowe zachowanie, nie krytyczne.

### Etap 5 punkt 3: Wskaźnik siły hasła
**Powód:** Plan mówi "rozważyć". Nie zrealizowane — `minLength={6}` + placeholder "min. 6 znaków" + walidacja server-side wystarczają. Wskaźnik siły wymaga dodatkowej logiki (entropia, common passwords).
**Skutek:** Użytkownik widzi wymaganie "min. 6 znaków" ale nie dostaje real-time feedbacku o sile hasła.

### Etap 7 punkt 4: Onboarding po pierwszym logowaniu
**Powód:** Plan mówi "rozważyć późniejsze wejścia onboardingowe po pierwszym logowaniu (ustawienia profilu, pakiety, pierwszy zawodnik)". To duży feature wymagający nowej logiki (flaga `first_login`, onboarding flow, step-by-step wizard).
**Skutek:** Po pierwszej rejestracji trener trafia od razu do listy zawodników bez prowadzenia za rękę.

### Etap 8 punkt 1: Zod schematy walidacji dla login/register
**Powód:** Plan mówi "dodać schematy walidacji". Inline walidacja jest wystarczająca dla 3-4 pól. Reszta app używa Zod ale auth actions mają prostą logikę (email+password+name). Zod byłby overengineering.
**Skutek:** Walidacja działa poprawnie, ale nie przez Zod — przez inline checks w server actions.

---

## Faza 2: Error states (02-error-states.md Etapy 1-9)

### Etap 6: Szczegółowe rozdzielenie typów auth/session errors
**Powód:** Plan mówi "rozdzielić: utratę sesji coacha, utratę sesji zawodnika, wygasły link zaproszenia, brak dostępu do zasobu". `classifyError()` ma jedną klasę `access` bez takiego rozróżnienia. Error boundary dostaje `Error` object z ogólnym `message` — nie ma w nim kontekstu czy to sesja coacha czy zawodnika.
**Skutek:** Wszystkie błędy auth/session mają ten sam ekran `access`. Rozróżnienie wymagałoby custom error types rzucanych w app — do zrobienia w przyszłości.

### Etap 7: Upload error handling
**Powód:** Plan wymienia "problem uploadu" jako inline error do obsłużenia. Nie zrealizowane — upload avatara w settings ma `avatarPending` state ale nie ma dedykowanego error UI (jest w planie S1 Ustawień, nie tu).
**Skutek:** Upload errors obsługiwane przez `avatarState?.error` display — działa ale nie jest jeszcze produktowo dopracowane.

---

## Notatki ogólne

- Elementy oznaczone "rozważyć" w planach traktowane jako nice-to-have, nie blokujące
- Inline walidacja preferowana nad Zod dla prostych formularzy (3-4 pola)
- Overengineering unikany — jeśli prostsze rozwiązanie spełnia kryteria ukończenia, jest wybierane
