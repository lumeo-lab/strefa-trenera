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

Coach creates athlete → invite token generated with expiry → URL `/u/[slug]?t=[token]` → `/api/athlete/verify` validates token, rotates it, revokes old athlete sessions, sets httpOnly cookie → athlete accesses `/u/[slug]/*`.

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
- Session type styling via CSS classes: `.session-easy`, `.session-interval`, etc.
- Error messages use constants from `lib/constants.ts` (`AUTH_ERROR`, `FIELDS_ERROR`)
- Prefer specific row/DTO types from `lib/supabase/database.types.ts` or local feature `types.ts` files; do not reintroduce generic `DbRow`
- localStorage hooks use `useState` lazy initializers (not `useEffect`) to satisfy React 19 compiler rules
- Components defined inside render are not allowed (React compiler rule) — extract to module level
- `app/layout.tsx` is network-independent; do not reintroduce `next/font/google` unless external font fetching is explicitly acceptable
- For business dates, prefer helpers from `lib/date.ts`; avoid new uses of raw UTC date slicing for application logic
