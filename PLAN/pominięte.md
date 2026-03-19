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

### Etap 3 punkt 4: Przypięcie błędu do konkretnego pola — POMINIĘTY
**Powód:** Plan mówi "rozważyć lepsze przypięcie błędu do pola". Nie zrealizowane — błędy auth z Supabase nie wskazują konkretnego pola (np. "Invalid login credentials" nie mówi czy problem to email czy hasło). Zrealizowano ogólne mapowanie błędów na polskie komunikaty.
**Skutek:** Błąd wyświetla się jako ogólny komunikat nad przyciskiem submit, nie przy konkretnym inpucie.

### Etap 8 punkt 1: Zod schematy walidacji dla login/register — POMINIĘTY
**Powód:** Plan mówi "dodać schematy walidacji". Inline walidacja jest wystarczająca dla 3-4 pól. Reszta app używa Zod ale auth actions mają prostą logikę (email+password+name). Zod byłby overengineering.
**Skutek:** Walidacja działa poprawnie, ale nie przez Zod — przez inline checks w server actions.

### Wspólny AuthLayout komponent — POMINIĘTY
**Powód:** Plan2 LR4 proponował wydzielenie wspólnego `AuthLayout` (logo + card wrapper + bottom link) z login i register. Nie zrealizowane — oba pliki mają ~160 linii, wspólny layout to ~20 linii. Przy 2 konsumentach wydzielenie dodałoby nowy plik z minimalną oszczędnością. Overengineering.
**Skutek:** Login i register mają zduplikowany wrapper (logo, card, link, trust footer). Jeśli w przyszłości pojawią się kolejne ekrany auth (np. reset password page), warto wrócić do wydzielenia.

---

## Faza 2: Error states (02-error-states.md Etapy 1-9)

### Etap 6: Szczegółowe rozdzielenie typów auth/session errors — POMINIĘTY
**Powód:** Plan mówi "rozdzielić: utratę sesji coacha, utratę sesji zawodnika, wygasły link zaproszenia, brak dostępu do zasobu". `classifyError()` ma jedną klasę `access` bez takiego rozróżnienia. Error boundary dostaje `Error` object z ogólnym `message` — nie ma w nim kontekstu czy to sesja coacha czy zawodnika.
**Skutek:** Wszystkie błędy auth/session mają ten sam ekran `access`. Rozróżnienie wymagałoby custom error types rzucanych w app.

### Etap 7: Upload error handling — POMINIĘTY
**Powód:** Plan wymienia "problem uploadu" jako inline error do obsłużenia. Nie zrealizowane — upload avatara w settings ma `avatarPending` state ale nie ma dedykowanego error UI (jest w planie S1 Ustawień, nie tu).
**Skutek:** Upload errors obsługiwane przez `avatarState?.error` display — działa ale nie jest jeszcze produktowo dopracowane.

---

## Na przyszłość

Elementy, które zostały świadomie odłożone jako duże feature'y lub nice-to-have wykraczające poza obecny zakres.

### Login / Register
- **Social login (Google)** — wymaga konfiguracji OAuth provider w Supabase + przycisk w UI
- **Toggle "Pokaż hasło"** — dodatkowy stan per input + toggle button. Ryzyko literówki rozwiązane przez "Powtórz hasło"
- **Terms/privacy checkbox** — wymaga stron regulaminu i polityki prywatności
- **Rate limiting na formularzu auth** — Supabase ma wbudowany rate limiting na auth endpoints
- **Onboarding po pierwszym logowaniu** — wizard (ustawienia profilu → pakiety → pierwszy zawodnik). Wymaga flagi `first_login`, nowego flow

### Sidebar + Topbar
- **Breadcrumbs w topbar** — wymaga śledzenia ścieżki nawigacji (np. "Zawodnicy → Jan Kowalski"), duża złożoność
- **Unifikacja CoachAvatarEl z Avatar.tsx** — sidebar ma własny CoachAvatarEl obsługujący 3 tryby (URL, emoji, gradient), Avatar.tsx tylko inicjały. Wydzielenie wymaga przebudowy Avatar.tsx
- **Topbar theme toggle animacja** — drobnostka, emoji ☀️/🌙 zmienia się natychmiast bez transition
- **Etap 11: Wspólna warstwa danych globalnej nawigacji** — wydzielenie DTO sidebar/notification agregatów. Obecne rozwiązanie (layout.tsx fetchuje counts, NotificationBell fetchuje osobno) działa poprawnie. Refaktor na przyszłość gdy pojawi się więcej źródeł danych globalnych
- **NotificationBell — link do konkretnego zawodnika** — plan mówił `/coach/athletes/{id}?tab=feedback`. Wymaga dodania `athlete_id` do danych powiadomienia w `getUnreadNotifications()`. Obecny link `/coach/feedback` działa ale jest mniej precyzyjny
- **Pełne command palette z wyszukiwaniem zawodników** — obecna wersja QuickSearch to szybkie linki do modułów. Docelowo: wyszukiwanie zawodników po nazwie (fetch z Supabase), wyszukiwanie faktur, drilldown

### Feedback
- **Paginacja cursor-based zamiast `.limit(200)`** — plan Etap 8.1 mówi "odejść od prostego .limit(200)". Zrealizowano tymczasowe rozwiązanie: komunikat informacyjny na dole listy gdy wyświetlanych jest 200 feedbacków. Pełna paginacja wymaga server-side cursor logic, infinite scroll i przebudowy filtrowania. Obecny limit 200 jest wystarczający dla aktualnej skali.

### Ustawienia
- **Auto-dismiss success messages (S2)** — plan zakładał auto-dismiss komunikatów sukcesu po 4s. Lint rule `react-hooks/set-state-in-effect` blokuje setState w useEffect. Komunikaty znikają naturalnie po kolejnej akcji. Drobnostka UX, nie wpływa na funkcjonalność.
- **Dane firmy i rozliczeń (Etap 6)** — wymaga nowej tabeli w Supabase (company_info), migracji i server action. Brak modelu danych w bazie. Odłożone do momentu gdy trener będzie potrzebował generować faktury z danymi firmy.
- **Powiadomienia i preferencje (Etap 7)** — wymaga nowej tabeli notification_preferences + UI toggleów. Obecne push subscription działa bez konfiguracji per typ. Odłożone.

### Dashboard
- **Preferencje dashboardu w backendzie (Etap 8.1)** — plan zakładał wyniesienie preferencji (kolejność KPI, widoczność sekcji, dismiss hint) z localStorage do Supabase. Wymaga nowej tabeli, migracji i server action. W praktyce trener korzysta z jednej przeglądarki — localStorage jest wystarczający. Warto wrócić jeśli pojawi się tryb multi-device.

### Error states
- **Custom error types** — rzucanie typed errors (np. `SessionExpiredError`, `AccessDeniedError`) zamiast generic `Error` — pozwoliłoby na dokładniejsze rozróżnienie w error boundaries
- **Wskaźnik siły hasła** — real-time feedback przy wpisywaniu hasła (entropia, common passwords)

---

## Notatki ogólne

- Elementy oznaczone "rozważyć" w planach traktowane jako nice-to-have, nie blokujące
- Inline walidacja preferowana nad Zod dla prostych formularzy (3-4 pola)
- Overengineering unikany — jeśli prostsze rozwiązanie spełnia kryteria ukończenia, jest wybierane
