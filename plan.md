# Plan poprawek podstron coach — finalna runda

Status: **W trakcie**
Ostatnia aktualizacja: 2026-03-18

---

## Etap 1: KPI faktur reagujące na filtry
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/invoices/_components/InvoicesClient.tsx`

Problem: Karty KPI (Opłacone, Oczekujące, Przeterminowane, Łącznie) liczą z `localInvoices` zamiast z `filtered`. Gdy trener filtruje po zawodniku lub szuka — KPI nie zmieniają się.

Zmiana: `totals` useMemo ma używać `filtered` zamiast `localInvoices`.

---

## Etap 2: Chat — visibility check + dłuższy interwał pollingu
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/chat/_components/ChatClient.tsx`

Problem: `router.refresh()` co 5s nawet gdy zakładka w tle — drenaż baterii, obciążenie serwera.

Zmiany:
- Sprawdzać `document.visibilityState === 'visible'` przed pollem
- Wydłużyć interwał z 5s do 15s
- Dodać `visibilitychange` listener żeby wznowić/wstrzymać polling

---

## Etap 3: Obsługa brakującego załącznika faktury
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/invoices/_components/InvoicesClient.tsx`

Problem: `handleDownloadAttachment` otwiera `window.open(url)` bez sprawdzenia czy URL jest prawidłowy. Gdy plik usunięty ze storage — pusta strona.

Zmiana: Sprawdzić `result.url` i wyświetlić `showStatus('error', ...)` zamiast otwierać puste okno.

---

## Etap 4: Planner — disabled select podczas ładowania
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/planner/_components/PlannerShell.tsx`

Problem: Dropdown wyboru zawodnika nie jest disabled gdy PlanTab ładuje dane — szybkie przełączanie może powodować race conditions.

Zmiana: Przekazać stan `loadingRange` z PlanTab do PlannerShell lub dodać lokalny loading state przy zmianie zawodnika.

Uwaga: PlanTab sam zarządza loadingRange — prostsze rozwiązanie to dodać krótki `disabled` na select przez 500ms po zmianie zawodnika (debounce).

---

## Etap 5: Feedback mark-as-read — optymistyczny update UI
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/feedback/_components/FeedbackClient.tsx`

Problem: Po kliknięciu "Oznacz jako przeczytany" karta nie zmienia wyglądu do pełnego `router.refresh()`. Użytkownik widzi spinner ale nie wie czy się udało.

Zmiana: Po udanym `markFeedbackRead` — optimistic update: lokalnie oznaczyć feedback jako `read: true` w stanu komponentu.

---

## Etap 6: Settings — disabled upload + progress
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/settings/_components/SettingsClient.tsx`

Problem: Podczas uploadu avatara formularz pozostaje aktywny, brak wizualnego feedbacku.

Zmiany:
- Disable file input + emoji grid gdy `avatarPending` jest true
- Dodać opacity/overlay na podglądzie avatara podczas zapisu

---

## Etap 7: Dashboard KPI — cursor-pointer + affordance
**Ryzyko: NISKIE** | 1 plik | Status: **Do zrobienia**

Plik: `app/coach/dashboard/_components/DashboardClient.tsx`

Problem: Karty KPI są opakowane w `<Link>` ale nie mają `cursor-pointer` ani wizualnej wskazówki że są klikalne.

Zmiana: Dodać `cursor-pointer` i delikatny hover effect na kartach KPI.

---

## Etap 8: Cleanup — nieużywany import + date utils
**Ryzyko: NISKIE** | 2 pliki | Status: **Do zrobienia**

Zmiany:
1. `ChatClient.tsx` — usunąć nieużywany import `formatDateTime`
2. `analytics/page.tsx` — przenieść inline date math do `lib/calendar.ts` lub `lib/date.ts`

---

## Podsumowanie

| Etap | Opis | Ryzyko |
|------|------|--------|
| 1 | KPI faktur reagujące na filtry | Niskie |
| 2 | Chat visibility check + 15s polling | Niskie |
| 3 | Obsługa brakującego załącznika | Niskie |
| 4 | Planner disabled select | Niskie |
| 5 | Feedback optimistic mark-as-read | Niskie |
| 6 | Settings disabled upload | Niskie |
| 7 | Dashboard KPI cursor-pointer | Niskie |
| 8 | Cleanup imports + date utils | Niskie |
