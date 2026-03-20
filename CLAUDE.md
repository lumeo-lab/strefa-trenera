# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev server
npm run dev

# Build
npm run build

# Tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint

# Format
npm run format
```

## Architecture

Next.js 16 App Router (Turbopack) + Supabase + TypeScript strict + Tailwind CSS 4.

### Two separate apps in one codebase

- **Coach app** (`/coach/*`) — protected by Supabase Auth (email+password). Server Components fetch data, pass to Client Components in `_components/`.
- **Athlete app** (`/u/[slug]/*`) — custom token-based auth via invite links. Athletes do not have Supabase Auth accounts; access is based on invite verification plus `athlete_session` cookie validated by `lib/athlete-auth.ts`.

### Route protection

`proxy.ts` (Next.js 16 renamed from middleware.ts, export fn = `proxy`):
- `/coach/*` requires authenticated Supabase user
- `/u/[slug]/*` sub-pages require `athlete_session` httpOnly cookie
- Logged-in coaches redirected away from `/login`, `/register`

### Three Supabase clients

- `lib/supabase/client.ts` — browser client (Client Components)
- `lib/supabase/server.ts` — server client with cookies (Server Components, Server Actions)
- `lib/supabase/admin.ts` — service_role client, bypasses RLS (athlete auth, storage, cross-table operations). Keep usage narrow and explicit. **Never import in Client Components.**

### Data mutation pattern

Most mutations go through Server Actions in `lib/actions/*.ts`.

Typical coach-facing action flow:
1. Verifies auth via `supabase.auth.getUser()`
2. Validates input through `lib/schemas.ts` or small inline guards
3. Mutates via Supabase client
4. Calls `revalidatePath()` for cache invalidation
5. Returns `{ success: true }` or `{ error: string }`

Athlete-facing actions may authenticate through `getAthleteFromSession()` from `lib/athlete-auth.ts` instead of Supabase Auth.

Client Components call actions via `useActionState` or `startTransition(() => router.refresh())`.

### Key shared modules

- `lib/supabase/database.types.ts` — Row types for all tables (AthleteRow, SessionRow, etc.)
- `lib/schemas.ts` — Zod validation schemas for all entities
- `lib/constants.ts` — FEELING_LABELS, SESSION_TYPES, AUTH_ERROR, FIELDS_ERROR
- `lib/date.ts` — business date helpers (`Europe/Warsaw`), use for app logic instead of raw `toISOString().split('T')[0]`
- `lib/styles.ts` — INPUT_STYLE, LABEL_STYLE (shared across form components)
- `lib/utils.ts` — formatting, relative date labels, color maps, presentation helpers
- `lib/athlete-data.ts` — typed athlete-facing reads grouped in one module
- `lib/session-status.ts` — canonical session execution model (`planned/completed/skipped/detected`), labels, compliance helpers, source-of-truth logic
- `lib/athlete-insights.ts` — coach-side analysis aggregation (load, zones, reaction, recommendation, type stats)
- `lib/athlete-status-defs.ts` — canonical athlete status definitions (built-ins + defaults)

### Feature-backed Supabase migrations

The codebase now relies on a few feature-definition tables that must exist in Supabase for the full coach UI to work correctly:

- `supabase/migrations/010_session_type_defs.sql` — editable coach session types and colors
- `supabase/migrations/011_week_templates.sql` — coach week templates for planner
- `supabase/migrations/012_athlete_status_defs.sql` — editable coach athlete statuses
- `supabase/migrations/013_athlete_list_order_and_metrics.sql` — persistent athlete list order plus `coach_athlete_list_metrics()` RPC used by the athletes list
- `supabase/migrations/014_athlete_archive.sql` — athlete archiving via `archived_at`
- `supabase/migrations/015_athlete_injury_history.sql` — structured `injury_history` JSONB for active/closed injuries with dates
- `supabase/migrations/016_training_session_execution_status.sql` — session execution model (`status`, `completion_source`, `completed_at`, Strava linkage, skip reason)
- `supabase/migrations/017_feedback_structured_fields.sql` — structured athlete feedback (`feeling`, `rpe`, `pain_flag`, manual actuals, voice/text fields)
- `supabase/migrations/018_strava_actuals_and_pairing.sql` — Strava actual data extension, pairing fields, additional activity metrics
- `supabase/migrations/019_coach_analysis_foundation.sql` — coach analysis foundation: `session_priority`, `session_goal`, `training_load`, HR-zone fields on sessions and athletes

If these migrations are missing in an environment, the related UI may still render but save flows will fail or silently fall back.

### Component decomposition pattern

Large page components are split into:
```
page.tsx (Server Component — fetches data)
_components/
  *Client.tsx (coordinator — state, tab switching)
  tabs/*.tsx (individual tab content)
  modals/*.tsx (CRUD modals)
  sections/*.tsx (dashboard sections)
```

### Athlete invite flow

Coach creates athlete → stable invite token is generated → URL `/u/[slug]?t=[token]` is treated as the athlete's permanent access link → `/api/athlete/verify` validates token and sets/reuses `athlete_session` cookie → athlete accesses `/u/[slug]/*`.

Important:
- invite links are intentionally stable and reusable
- do not reintroduce invite expiry / rotation / “generate new link” UX unless explicitly requested
- coach-facing UI should frame this as “send athlete their private access link”

### Coach athlete profile

`/coach/athletes/[id]` is now treated as the primary athlete dossier for the coach:

- header shows core identity, access status, quick chat, permanent invite-link actions, and a modal-driven `Sygnały` summary
- `DataTab` is structured into `Dane osobowe`, `Współpraca`, `Sport i zdrowie`, and a full-width `Konto i administracja`
- `Sport i zdrowie` uses `injury_history` as the source of truth; active injuries are those without `ended_at`
- `RacesTab` and `FinanceTab` lazy-load their heavy data through `/api/coach/athletes/[id]/sections`
- `FeedbackTab`, `HistoryTab`, `RacesTab`, `FinanceTab`, and `NotesTab` share common empty/error UI via `ProfileStates.tsx`
- training execution is no longer modeled as a loose `completed` boolean alone; the canonical model is the execution `status` on `training_sessions`
- `HistoryTab` is the coach’s operational log of planned sessions and their realization
- `InsightsTab` is the coach’s analysis surface and should stay focused on planning support, not become a second raw history table

### Execution + feedback + Strava model

The current product model is intentionally split into four layers:

- `training_sessions` — planned unit and final execution status
- `feedbacks` — athlete’s subjective response and notes
- `strava_activities` — imported external activity data
- pairing (`linked_strava_activity_id`) — relation between planned session and imported activity

Important implementation rules:
- history, coach workflow, and compliance must rely on session execution status, not on feedback existence
- athlete feedback does not define completion by itself; athlete-side `Wykonałem / Nie zrobiłem` flow is the primary status input
- Strava is preferred as the source for objective actual metrics when paired, but it should not silently override explicit human status decisions
- keep manual athlete actuals as fallback when there is no paired device data

### Coach History vs Analysis

The coach profile intentionally separates two surfaces:

- `HistoryTab` — operational review:
  - planned sessions as the base rows
  - execution metrics (`distance`, `time`, `pace`, `HR`, `elevation`) in the row
  - plan details in the expandable session row
  - athlete feedback in a separate expandable row
  - unplanned Strava activities at the bottom as a verification queue
- `InsightsTab` / `Analiza` — planning support:
  - use tabs/sub-views instead of one long overloaded screen
  - prioritize weekly load, time in HR zones, athlete reaction, and session-type quality
  - keep recommendation/decision support concise and based on explainable signals
  - avoid turning `Analiza` back into a general-purpose stats dump

### Planning docs

The repo includes implementation/reference plans for this area:

- `master-plan-treningi-analityka.md` — main operating plan
- `plan-treningi.md` — execution model foundation
- `plan-analityka-zawodnika.md` — athlete insights layer
- `plan-analiza-trenera.md` — coach analysis + history redesign
- `rollout-analiza-historia.md` — technical rollout for `Analiza` + `Historia`

When changing this area, follow the master plan first; the other documents are reference/detail docs.

### Athlete list / archive behavior

- `/coach/athletes` shows active athletes only
- archive is managed from the athlete profile (`Dane`) and browsed in coach settings
- athlete ordering is persisted per coach in the database (`athlete_order`), not just in `localStorage`
- table preferences remain client-side, but must stay hydration-safe and account-aware when possible

### File upload rules

- Coach avatar uploads are validated server-side in `lib/actions/profile.ts`
  - allowed: `image/jpeg`, `image/png`, `image/webp`
  - max size: 2 MB
- Invoice attachments are validated server-side in `lib/actions/invoices.ts`
  - allowed: `application/pdf`, `image/jpeg`, `image/png`
  - max size: 10 MB

## Conventions

- Polish language for UI text, English for code/comments
- CSS variables (`var(--bg-card)`, `var(--text-muted)`) for theming — defined in `globals.css`
- Session type presentation is no longer purely static CSS-class based; coach-editable session type names/colors are loaded from Supabase and merged with built-ins
- Error messages use constants from `lib/constants.ts` (`AUTH_ERROR`, `FIELDS_ERROR`)
- Prefer specific row/DTO types from `lib/supabase/database.types.ts` or local feature `types.ts` files; do not reintroduce generic `DbRow`
- Client-side persisted preferences must be hydration-safe: prefer SSR-stable defaults on first render, then sync from `localStorage` in `useEffect`
- Components defined inside render are not allowed (React compiler rule) — extract to module level
- `app/layout.tsx` is network-independent; do not reintroduce `next/font/google` unless external font fetching is explicitly acceptable
- For business dates, prefer helpers from `lib/date.ts`; avoid new uses of raw UTC date slicing for application logic
- Planner state is intentionally persisted per browser (selected athlete/view/week-month/feedback visibility), but the first render must remain SSR-safe
- When changing links or derived URLs shown in Client Components, prefer passing a stable server-derived app URL into the component instead of building it from `window.location`
- For athlete injury editing, keep active injuries and historical injuries in one structured model; ending an injury must remove it from “active” logic without losing history
- When adding coach-only summary UI (signals, hints, filters), prefer compact presentation and modals/drawers over large persistent boxes if the information is secondary
- In coach `HistoryTab`, keep the main row compact and single-line where possible; push plan details and long descriptions into expandable rows
- In coach `InsightsTab`, prefer segmented decision-support views and charts over one long dashboard stuffed with summary cards
