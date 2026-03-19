## Landing page

### Cel sekcji

`Landing page` ma być nie tylko estetyczną stroną marketingową, ale skuteczną stroną sprzedażową produktu, która:

- jasno tłumaczy wartość,
- buduje zaufanie,
- prowadzi do rejestracji albo kontaktu,
- i jest spójna z realnym stanem systemu.

Po pełnym wdrożeniu ta sekcja ma odpowiadać na trzy pytania:

- czym jest produkt i dla kogo,
- dlaczego warto zacząć teraz,
- dlaczego mogę zaufać tej platformie.

---

### Aktualna ocena

Landing jest ambitny i ma pełną strukturę sprzedażową:

- hero,
- problem,
- dwie perspektywy,
- moduły,
- onboarding,
- porównanie,
- pricing,
- testimonials,
- końcowe CTA,
- footer.

Największe braki:

- część claimów jest zbyt ambitna względem aktualnego produktu,
- strona jest za długa i zbyt ciężka informacyjnie,
- social proof nie jest jeszcze maksymalnie wiarygodny,
- footer zawiera martwe linki,
- cały landing siedzi w jednym dużym komponencie z dużą ilością inline styles,
- mobile navigation nie jest domknięte.

---

### Definicja ukończenia

Sekcję `Landing page` uznajemy za domkniętą, gdy:

- wszystkie obietnice są zgodne z realnym stanem produktu,
- użytkownik szybko rozumie produkt i wartość wejścia,
- strona prowadzi jasną ścieżką do rejestracji lub kontaktu,
- pricing i CTA są klarowne,
- social proof i footer budują wiarygodność,
- kod strony jest rozbity i łatwy do utrzymania.

---

### Etap 1: Audyt obietnic i zgodności z produktem

Priorytet: **Krytyczny**
Ryzyko: **Średnie**

#### Zakres

1. Przejrzeć wszystkie obietnice na stronie:
- funkcje,
- automatyzacje,
- oszczędność czasu,
- enterprise,
- offline,
- API,
- white label,
- retencja,
- alerty.

2. Podzielić claimy na:
- w pełni gotowe,
- częściowo gotowe,
- planowane / roadmapa,
- do usunięcia.

3. Przepisać sekcje tak, żeby:
- nie obiecywały za dużo,
- były dalej mocne, ale prawdziwe,
- nie rozjeżdżały się z panelem.

4. Ujednolicić język z rzeczywistym produktem:
- dashboard,
- feedback,
- czat,
- finanse,
- zawodnicy.

#### Pliki

- `app/page.tsx`
- ewentualne współdzielone pliki copy jeśli powstaną

#### Kryteria ukończenia

- każda ważna obietnica na stronie jest zgodna z realnym systemem,
- landing nie sprzedaje funkcji, których użytkownik później nie znajdzie.

---

### Etap 2: Uproszczenie narracji i skrócenie strony

Priorytet: **Bardzo wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Ocenić, które sekcje są naprawdę niezbędne:
- hero,
- problem,
- dla kogo,
- funkcje,
- pricing,
- social proof,
- końcowe CTA.

2. Skrócić lub uprościć sekcje o niższym wpływie:
- część porównań,
- część claimów modułowych,
- część list i opisów.

3. Zmniejszyć liczbę długich bloków tekstu.

4. Wzmocnić flow konwersyjny:
- wartość,
- dowód,
- oferta,
- CTA.

#### Pliki

- `app/page.tsx`

#### Kryteria ukończenia

- strona jest krótsza i łatwiejsza do przeskanowania,
- użytkownik szybciej rozumie, dlaczego ma przejść dalej.

---

### Etap 3: Wzmocnienie hero i pozycjonowania produktu

Priorytet: **Bardzo wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Doprecyzować dla kogo jest produkt:
- trener solo,
- trener z rosnącą bazą,
- mały zespół,
- itp.

2. Wzmocnić główną obietnicę
- mniej ogólna,
- bardziej konkretna,
- łatwiejsza do zapamiętania.

3. Dopracować supporting copy
- co dokładnie jest w systemie,
- co użytkownik zyskuje od razu.

4. Rozważyć mocniejszy element zaufania przy hero:
- bez karty,
- za darmo do 2 zawodników,
- konkretny use case,
- liczby jeśli są realne.

5. Dopracować CTA:
- główne,
- drugorzędne,
- ewentualnie kontakt/demo jeśli potrzebne.

#### Pliki

- `app/page.tsx`

#### Kryteria ukończenia

- hero po wejściu od razu tłumaczy produkt, grupę docelową i następną akcję,
- pierwsze 10 sekund kontaktu ze stroną jest dużo mocniejsze.

---

### Etap 4: Wiarygodność i social proof

Priorytet: **Wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Dopracować opinie:
- jeśli są prawdziwe, pokazać je bardziej wiarygodnie,
- jeśli nie ma jeszcze mocnych case studies, uprościć lub osłabić ton.

2. Rozważyć lepsze formy social proof:
- liczba trenerów,
- liczba zawodników,
- liczba feedbacków,
- realne case studies,
- screeny produktu,
- logotypy jeśli istnieją.

3. Ograniczyć marketingowe „przestrzelenie”
- mniej claimów bez wsparcia,
- więcej konkretu.

4. Przejrzeć sekcję `Porównanie`
- czy ma zostać,
- czy jest aktualna,
- czy nie jest zbyt ryzykowna marketingowo.

#### Pliki

- `app/page.tsx`
- ewentualne assety i dane social proof

#### Kryteria ukończenia

- landing buduje zaufanie realnymi dowodami,
- użytkownik nie ma wrażenia „marketingowej przesady”.

---

### Etap 5: Pricing i oferta jako mocniejszy moduł konwersyjny

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Dopracować billing toggle:
- wyraźniej pokazać różnicę,
- oszczędność kwotowo i procentowo,
- sposób rozliczania rocznego.

2. Uporządkować plany:
- czy wszystkie są rzeczywiście gotowe,
- czy enterprise nie jest zbyt „z roadmapy”.

3. Dodać lepsze odpowiedzi na pytania cenowe:
- co oznacza limit zawodników,
- co dzieje się po przekroczeniu limitu,
- czy plan można zmienić później.

4. Rozważyć mini-FAQ przy pricingu.

#### Pliki

- `app/page.tsx`

#### Kryteria ukończenia

- cennik jest jasny i wspiera decyzję,
- użytkownik łatwo rozumie różnice między planami.

---

### Etap 6: Mobile UX i nawigacja

Priorytet: **Wysoki**
Ryzyko: **Średnie**

#### Zakres

1. Dodać prawdziwe mobile menu:
- funkcje,
- porównanie,
- cennik,
- jak zacząć.

2. Sprawdzić czytelność sekcji na mobile:
- spacing,
- długość tekstów,
- szerokość boxów,
- tabele.

3. Dopracować sekcję porównania i pricing na małych ekranach.

4. Dopracować sticky navbar na mobile.

#### Pliki

- `app/page.tsx`
- nowe komponenty mobilnej nawigacji jeśli powstaną

#### Kryteria ukończenia

- landing działa świadomie także na telefonie,
- mobile nie wygląda jak niepełna wersja strony.

---

### Etap 7: Footer i prawdziwe ścieżki informacyjne

Priorytet: **Wysoki**
Ryzyko: **Niskie**

#### Zakres

1. Usunąć lub zastąpić wszystkie martwe linki.

2. Zdecydować, które linki naprawdę istnieją:
- kontakt,
- pomoc,
- polityka prywatności,
- regulamin,
- status systemu,
- blog,
- o nas.

3. Jeśli dane strony jeszcze nie istnieją:
- ukryć linki,
- albo stworzyć minimalne wersje.

4. Dopracować końcowy CTA i footer jako ostatni etap konwersji.

#### Pliki

- `app/page.tsx`
- ewentualne nowe strony marketingowe/informacyjne

#### Kryteria ukończenia

- footer jest realny i wiarygodny,
- koniec strony nie psuje odbioru całego produktu.

---

### Etap 8: Refaktor architektury landing page

Priorytet: **Średni**
Ryzyko: **Średnie**

#### Zakres

1. Rozbić landing na sekcje:
- `LandingNavbar`
- `HeroSection`
- `ProblemSection`
- `FeaturesSection`
- `PricingSection`
- `TestimonialsSection`
- `FooterSection`

2. Ograniczyć `use client` do minimum
- zachować client-side tylko tam, gdzie naprawdę potrzeba:
  - `isYearly`
  - `navScrolled`
  - mobile menu.

3. Uporządkować style:
- CSS variables,
- bardziej spójne utility classes,
- mniej inline styles.

4. Ułatwić przyszłe zmiany copy i układu.

#### Pliki

- `app/page.tsx`
- nowe komponenty landingu

#### Kryteria ukończenia

- landing nie jest już jednym dużym komponentem,
- kod jest łatwiejszy do utrzymania i rozwijania.

---

### Etap 9: Final polish UX/UI

Priorytet: **Średni**
Ryzyko: **Niskie**

#### Zakres

1. Dopracować hierarchię wizualną sekcji
- co jest najważniejsze,
- co wspierające,
- co można osłabić.

2. Dopracować mikrocopy
- hero,
- CTA,
- pricing,
- testimonials,
- footer.

3. Dopracować rytm strony
- długość sekcji,
- tempo informacji,
- miejsca oddechu.

4. Dopracować motion
- navbar,
- pricing toggle,
- hover states,
- CTA.

5. Dopracować accessibility
- focus states,
- kontrasty,
- poprawne semantyczne nagłówki,
- tabele i linki.

#### Pliki

- `app/page.tsx`
- nowe komponenty landingu

#### Kryteria ukończenia

- landing wygląda jak dopracowana, wiarygodna strona produktu,
- nie jest już tylko rozbudowaną prezentacją funkcji.

---

### Rekomendowana kolejność wdrożenia

1. Etap 1: Audyt obietnic i zgodności z produktem
2. Etap 2: Uproszczenie narracji i skrócenie strony
3. Etap 3: Wzmocnienie hero i pozycjonowania produktu
4. Etap 4: Wiarygodność i social proof
5. Etap 5: Pricing i oferta jako mocniejszy moduł konwersyjny
6. Etap 6: Mobile UX i nawigacja
7. Etap 7: Footer i prawdziwe ścieżki informacyjne
8. Etap 8: Refaktor architektury landing page
9. Etap 9: Final polish UX/UI

---

### Minimalny zestaw o największym wpływie

Jeśli chcemy szybki, mocny upgrade `Landing page`, największy efekt dadzą:

- Etap 1
- Etap 2
- Etap 3
- Etap 4
- Etap 7

---

