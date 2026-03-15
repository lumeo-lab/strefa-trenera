# Audyt jakości inżynierskiej — Strefa Trenera
> Data: 2026-03-15
> Status: Po refaktorze strukturalnym (8 commitów, fazy 0-6 + polish)
> Cel: Podniesienie jakości z poziomu "działa" na poziom "profesjonalny produkcyjny"

---

## Podsumowanie

| Priorytet | Kategoria | Liczba problemów |
|-----------|-----------|-----------------|
| **P0** | Bezpieczeństwo | 2 |
| **P1** | Walidacja, paginacja, error handling, monitoring | 4 |
| **P2** | A11y, SEO, CI/CD, Prettier, obrazy, testy | 7 |
| **P3** | TypeScript strict, dynamic imports, React.memo, fonty | 6 |

---

## P0 — Krytyczne (bezpieczeństwo)

### 1. Brak nagłówków bezpieczeństwa HTTP
- **Plik**: `next.config.ts`
- **Problem**: Plik jest pusty — brak X-Frame-Options, Content-Security-Policy, HSTS, X-Content-Type-Options
- **Ryzyko**: Clickjacking, MIME sniffing, brak wymuszenia HTTPS
- **Rozwiązanie**: Dodać `headers()` w next.config.ts:
  ```ts
  headers: async () => [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
    ]
  }]
  ```

### 2. Wyciek szczegółów błędów DB w URL
- **Plik**: `app/api/strava/callback/route.ts`
- **Problem**: Error message z Supabase trafia do URL jako query param (`athlete_not_found: <db error>`)
- **Ryzyko**: Information disclosure — atakujący widzi strukturę błędów bazy
- **Rozwiązanie**: Zwracać generyczny komunikat w URL, logować szczegóły po stronie serwera

---

## P1 — Wysokie

### 3. Brak walidacji schematu (Zod)
- **Pliki**: Wszystkie `lib/actions/*.ts`
- **Problem**: Ręczna walidacja (`if (!field) return error`) jest fragile i niespójna
  - `parseFloat()` bez `isNaN()` check w `invoices.ts`
  - Brak walidacji formatu email, telefonu, dat po stronie serwera
- **Rozwiązanie**:
  - Zainstalować `zod`
  - Stworzyć schematy w `lib/schemas.ts`
  - Użyć `schema.safeParse(data)` w Server Actions
- **Wpływ**: Solidna walidacja, lepsze error messages, type inference z Zod

### 4. Brak paginacji — listy ładują 100% danych
- **Pliki**:
  - `app/coach/athletes/page.tsx` — bez limitu na athletes
  - `app/coach/feedback/page.tsx` — bez limitu na feedbacks
  - `app/coach/chat/page.tsx` — `select('*')` na messages bez limitu
  - `app/coach/athletes/[id]/page.tsx` — `select('*')` na sessions, feedbacks, invoices
- **Ryzyko**: Przy 100+ zawodnikach/sesjach — wolne ładowanie, duży payload, złe UX
- **Rozwiązanie**: Cursor-based pagination z Supabase `.range(from, to)`, client-side "load more"

### 5. Brak Error Boundaries
- **Problem**: Zero `error.tsx` plików w `app/` — błąd w jednym komponencie crashuje całą stronę
- **Rozwiązanie**:
  - `app/coach/error.tsx` — error boundary dla coach app
  - `app/u/[slug]/error.tsx` — error boundary dla athlete app
  - `app/error.tsx` — globalny fallback

### 6. Brak Error Monitoring (Sentry)
- **Problem**: Błędy produkcyjne niewidoczne — tylko `console.error` w 4 miejscach
- **Rozwiązanie**:
  - `npm install @sentry/nextjs`
  - `sentry.client.config.ts` + `sentry.server.config.ts`
  - Instrumentacja w `next.config.ts`

---

## P2 — Średnie

### 7. Accessibility — Modal bez ARIA
- **Plik**: `components/ui/Modal.tsx`
- **Problemy**:
  - Brak `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
  - Brak focus trap — focus ucieka z modala
  - Brak `aria-describedby` na polach formularza
  - Brak `aria-live` regions dla dynamicznych zmian (chat, notyfikacje)
- **Rozwiązanie**: Dodać ARIA atrybuty + focus trap logic

### 8. Brak metadanych SEO na podstronach
- **Problem**: Tylko `app/layout.tsx` ma metadata — strony coach nie mają tytułów
- **Rozwiązanie**: Dodać `generateMetadata()` w page.tsx dla dynamicznych stron

### 9. Brak `next/image`
- **Pliki**: 3 miejsca używają `<img>` zamiast `next/image`
  - `app/u/[slug]/_components/AthleteHistoryPage.tsx` — Strava logo
  - `app/coach/settings/_components/SettingsClient.tsx` — avatar preview
  - `components/coach/CoachSidebar.tsx` — coach avatar
- **Rozwiązanie**: Zamienić na `<Image>` z next/image

### 10. Brak CI/CD
- **Problem**: Zero GitHub Actions — build, testy, lint nie uruchamiają się automatycznie
- **Rozwiązanie**:
  ```yaml
  # .github/workflows/ci.yml
  - lint (eslint)
  - type-check (tsc --noEmit)
  - test (vitest run)
  - build (next build)
  ```

### 11. Brak Prettier
- **Problem**: Brak `.prettierrc` — formatowanie niespójne
- **Rozwiązanie**: `.prettierrc` + `lint-staged` + `husky` pre-commit hook

### 12. Niepełne testy
- **Stan**: 34 testy pokrywają tylko `lib/utils.ts`
- **Brak**: Testy Server Actions, komponentów, hooków, e2e
- **Rozwiązanie**: Stopniowo dodawać testy do Server Actions (mock Supabase client)

### 13. Zapytania `select('*')` w kilku miejscach
- **Pliki**:
  - `app/coach/athletes/[id]/page.tsx` — sessions, feedbacks, invoices
  - `app/coach/chat/page.tsx` — messages
- **Rozwiązanie**: Zamienić na `select('id, field1, field2, ...')` — tylko potrzebne kolumny

---

## P3 — Niskie

### 14. Brak `noUnusedLocals` w tsconfig
- Dodać `"noUnusedLocals": true, "noImplicitReturns": true` do `tsconfig.json`

### 15. Brak dynamic imports dla dużych modali
- `SessionModal` (404L), `AddAthleteModal` (106L) — mogą być lazy-loaded

### 16. Brak `React.memo` na elementach list
- Tabela zawodników, lista sesji — re-renderują się przy każdej zmianie parent state

### 17. Brak font optimization (`next/font`)
- Layout nie importuje fontów przez `next/font` — brak preloading i swap

### 18. Brak skip links w nawigacji
- Brak "Skip to main content" link dla keyboard/screen reader users

### 19. File upload bez limitu rozmiaru i walidacji MIME type
- `lib/actions/invoices.ts` — upload pliku bez sprawdzenia typu i rozmiaru

---

## Co jest dobrze (potwierdzone w audycie)

| Obszar | Status |
|--------|--------|
| RLS na wszystkich tabelach | ✅ |
| Auth check w każdej Server Action | ✅ |
| Sekrety nigdy w client code | ✅ |
| httpOnly cookies dla athlete sessions | ✅ |
| Promise.all w zapytaniach (parallelizacja) | ✅ |
| startTransition + router.refresh() | ✅ |
| Optimistic updates gdzie potrzebne | ✅ |
| Brak XSS, SQL injection, CSRF | ✅ |
| Loading states z pending flag | ✅ |
| TypeScript strict mode | ✅ |
| Spójna organizacja importów | ✅ |
| DRY — shared styles i constants | ✅ |
| 34 testów passing (vitest) | ✅ |

---

## Proponowana kolejność implementacji

```
Faza A (P0) → Security headers + error message sanitization
Faza B (P1) → Zod validation + pagination + error boundaries + Sentry
Faza C (P2) → Modal a11y + metadata + CI/CD + Prettier + next/image
Faza D (P3) → tsconfig strict + dynamic imports + React.memo + fonts
```

Każda faza to osobny commit. Build + testy po każdym kroku.

---

*Dokument wygenerowany 2026-03-15 na podstawie audytu 3 agentów analizujących 200+ plików.*
