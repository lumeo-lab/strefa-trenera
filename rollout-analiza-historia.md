# Techniczny Rollout: `Analiza` + `Historia`

## Cel dokumentu

To jest krótki dokument wdrożeniowy pod implementację przebudowy:

- zakładki `Wykonanie / Insights` w nową `Analizę`,
- zakładki `Historia` w czystą warstwę operacyjną.

Ten dokument nie zastępuje:

- [master-plan-treningi-analityka.md](/Users/tomek/Desktop/PROJEKTY/trener/master-plan-treningi-analityka.md)
- [plan-analiza-trenera.md](/Users/tomek/Desktop/PROJEKTY/trener/plan-analiza-trenera.md)

Służy tylko do spokojnego, etapowego wejścia w kod.

---

## Zasada rolloutu

Nie wdrażamy wszystkiego naraz.

Najlepsza kolejność:

1. najpierw rozdział informacji między zakładkami,
2. potem dane pod strefy i load,
3. potem nowa `Analiza` MVP,
4. potem `Historia` 2.0,
5. na końcu polish.

---

## Etap T1: Rozdział warstw bez nowych danych

### Cel
Rozdzielić log od analizy jeszcze przed rozbudową backendu.

### Zakres

- zmiana nazwy `Wykonanie` -> `Analiza`
- usunięcie z `Analizy` sekcji stricte logowych
- przeniesienie do `Historii`:
  - `Ostatnie sesje`
  - `Aktywności poza planem`
  - surowych statusów, jeśli mają charakter operacyjny

### Efekt

Już na tym etapie:
- `Analiza` przestaje być pół-logiem,
- `Historia` staje się pełniejsza operacyjnie.

### Ryzyko

- chwilowe poczucie „w `Analizie` jest mniej”

### Jak temu zapobiec

W tym samym etapie trzeba dodać:
- krótką hero sekcję `Werdykt (beta / coming in next step)` albo placeholder struktury,
- żeby zakładka nie sprawiała wrażenia zubożonej.

---

## Etap T2: Dane pod strefy i load

### Cel
Dołożyć fundament danych do realnej analizy planistycznej.

### Zakres backendowy

- dodać `session_priority`
- dodać `session_goal`
- dodać konfigurację HR zones per athlete
- dodać `training_load`
- dodać `training_load_source`
- dodać pola / agregaty `time_in_hr_z1...z5`

### Zakres integracyjny

- zdecydować, czy pierwsze źródło stref to:
  - Strava activity zones
  - czy streams + własne liczenie
- dodać cache / agregację pod tygodniowe podsumowania

### Efekt

System ma już dane potrzebne do:
- wykresów stref,
- load trend,
- recommendation layer.

### Ryzyko

- rate limits Stravy
- brak kompletnych danych dla części zawodników

### Jak temu zapobiec

- oznaczać jakość danych
- zrobić graceful fallback
- nie blokować zakładki, jeśli stref brakuje

---

## Etap T3: Agregaty i silnik recommendation

### Cel
Przygotować warstwę obliczeniową przed budową nowego UI.

### Zakres

- nowy builder / rozszerzenie `athlete-insights`
- agregaty:
  - weekly load
  - weekly time in zones
  - load delta
  - reaction trend
  - type quality
  - key session completion
- recommendation engine MVP:
  - `progresuj`
  - `utrzymaj`
  - `monitoruj`
  - `deload`

### Efekt

UI dostaje gotowe, spójne dane zamiast składania logiki w komponentach.

### Zasada

Cała interpretacja ma siedzieć głównie w warstwie domenowej, nie w JSX.

---

## Etap T4: `Analiza` MVP

### Cel
Zbudować pierwszą realną wersję decision-support.

### Sekcje

1. `Werdykt`
2. `Obciążenie i trend`
3. `Intensywność i strefy`
4. `Reakcja zawodnika`
5. `Jakość realizacji bodźców`
6. `Rekomendacja`

### Zasada UX

- najpierw decyzja,
- potem trend,
- potem uzasadnienie,
- na końcu detail.

### Efekt

To ma być pierwszy prawdziwy moment `wow`.

---

## Etap T5: `Historia` 2.0

### Cel
Domknąć nowy podział ról.

### Zakres

- rozbudowana tabela
- źródła danych
- pairing visibility
- sekcja `Do weryfikacji`
- wygodniejsze filtry
- lepszy details row

### Efekt

`Historia` staje się wygodnym narzędziem operacyjnym, a nie zubożoną wersją poprzedniej zakładki.

---

## Etap T6: Polish

### Cel
Dowieźć poziom premium.

### Zakres

- spójne wykresy
- kolory i legendy
- tooltips
- empty states
- data quality states
- mikrocopy
- lepsza hierarchia sekcji

### Efekt

Zakładka wygląda jak narzędzie, które prowadzi trenera, a nie zbiór wskaźników.

---

## Minimalna rekomendacja wdrożeniowa

Jeśli chcesz wejść rozsądnie i bez chaosu:

1. zacząć od `Etapu T1`
2. potem `Etap T2`
3. dopiero potem budować UI `Analizy`

Najgorszy możliwy wariant:
- zacząć od wykresów i recommendation przed danymi pod strefy i load.

To trzeba zrobić od fundamentu do decyzji, nie odwrotnie.
