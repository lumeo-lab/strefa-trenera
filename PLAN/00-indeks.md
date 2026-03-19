# Plan Poprawek — Indeks

Status: **W trakcie wdrażania**
Ostatnia aktualizacja: 2026-03-19

Kolejność wdrażania ustalona na podstawie analizy zależności między modułami.

---

## Kolejność wdrażania

| # | Plik | Sekcja | Status |
|---|------|--------|--------|
| 0 | `plan2.md` → SEC1-SEC7 | Bezpieczeństwo i infrastruktura | ✅ Ukończony |
| 1 | `01-login-register.md` | Login / Register | ✅ Ukończony |
| 2 | `02-error-states.md` | Error states (cross-cutting) | ✅ Ukończony |
| 3 | `03-sidebar-topbar.md` | Sidebar + Topbar | ✅ Ukończony |
| 4 | `04-feedback.md` | Feedback | ✅ Ukończony |
| 5 | `05-czat.md` | Czat | ✅ Ukończony |
| 6 | `06-faktury.md` | Faktury | ✅ Ukończony |
| 7 | `07-analityka.md` | Analityka | ✅ Ukończony |
| 8 | `08-dashboard.md` | Dashboard (plan w plan2.md) | ✅ Ukończony |
| 9 | `09-zawodnicy.md` | Lista zawodników | Do wdrożenia |
| 10 | `10-profil-zawodnika.md` | Profil zawodnika (coach view) | Do wdrożenia |
| 11 | `11-ustawienia.md` | Ustawienia | ✅ Ukończony |
| 12 | `12-pomoc.md` | Pomoc | ✅ Ukończony |
| 13 | `13-panel-zawodnika-mobile.md` | Panel zawodnika mobile | Do wdrożenia |
| 14 | `14-landing-page.md` | Landing page | Do wdrożenia |

---

## Dlaczego taka kolejność

1. **Bezpieczeństwo** — blokujące dla produkcji
2. **Login/Register** — pierwszy ekran użytkownika, izolowany
3. **Error states** — cross-cutting, poprawia każdą stronę
4. **Sidebar + Topbar** — nawigacja wspólna dla wszystkich stron
5. **Feedback → Czat** — FeedbackCard upstream (7 plików), wspólne wzorce polling
6. **Faktury → Analityka** — semantyka statusów ustalana w Fakturach, Analityka z nich korzysta
7. **Dashboard** — hub, zależy od wszystkich powyższych
8. **Zawodnicy + Profil** — korzystają z naprawionych modułów
9. **Ustawienia, Pomoc** — izolowane, niski priorytet
10. **Panel zawodnika, Landing** — osobne aplikacje, mogą iść równolegle

---

## Pliki pomocnicze

- `plan2.md` — techniczne uzupełnienie (bezpieczeństwo SEC1-7, dashboard etapy 1-8, drobne poprawki per sekcja)
- `plan3.md` — oryginalny pełny plan (zachowany jako referencja)
