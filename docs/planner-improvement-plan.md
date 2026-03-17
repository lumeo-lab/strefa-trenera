# Plan Rozwoju Planera

Ten dokument zbiera dalszy plan rozwoju zakładki `Planer`, tak aby dojść do poziomu profesjonalnego narzędzia trenerskiego.

## Cel

Planer ma być:
- szybki w codziennej pracy,
- spójny między urządzeniami,
- czytelny przy większej liczbie sesji,
- mocno powiązany z wykonaniem planu i feedbackiem zawodnika.

## Etap 1: Trwałość i spójność systemu

1. Przenieść własne typy treningów z `localStorage` do bazy.
   Typy powinny być zapisane na koncie trenera i działać wszędzie tak samo.

2. Ujednolicić użycie typów treningów w całym produkcie.
   Te same typy powinny być spójne w:
   - planerze,
   - historii,
   - profilu zawodnika,
   - innych miejscach, gdzie pojawiają się sesje.

3. Dodać zarządzanie kolejnością typów.
   Trener powinien móc ustawić własną kolejność typów w selektorze.

## Etap 2: Szybkość pracy trenera

1. Dodać szybkie przesuwanie sesji.
   Minimum:
   - `+1 dzień`
   - `-1 dzień`
   - `+7 dni`
   - `-7 dni`

2. Dodać szybkie kopiowanie sesji.
   Minimum:
   - `Kopiuj na jutro`
   - `Kopiuj za tydzień`
   - `Kopiuj na wybraną datę`

3. Dodać kopiowanie całego tygodnia.
   Minimum:
   - kopiowanie tygodnia na kolejny tydzień dla tego samego zawodnika.

4. Dodać szablony tygodni.
   Trener powinien móc:
   - zapisać tydzień jako szablon,
   - nazwać go,
   - użyć go ponownie.

## Etap 3: Lepsza kontrola realizacji planu

1. Dodać porównanie `plan vs wykonanie`.
   Pokazywać:
   - planowany dystans vs rzeczywisty,
   - planowany czas vs rzeczywisty,
   - planowane tempo vs rzeczywiste.

2. Dodać prosty sygnał odchylenia.
   Np.:
   - `zgodnie z planem`
   - `krócej niż plan`
   - `mocniej niż plan`

3. Dodać wyraźniejsze oznaczenia dni problemowych.
   Np. dni z:
   - problemowym feedbackiem,
   - brakiem feedbacku po wykonaniu,
   - dużym odchyleniem od planu.

## Etap 4: Mocniejsze powiązanie z feedbackiem

1. Lepiej oznaczyć feedback w kalendarzu.
   Nie tylko sam przycisk `feedback`, ale też poziom ważności.

2. Powiązać feedback z konkretną sesją.
   To ważne szczególnie wtedy, gdy w jednym dniu jest więcej niż jedna sesja.

3. Dodać szybki podgląd feedbacku bez pełnego modala.

4. Dodać filtr po feedbacku.
   Np.:
   - z feedbackiem,
   - bez feedbacku,
   - z problemowym feedbackiem.

## Etap 5: UX i ergonomia profesjonalnego narzędzia

1. Dopracować planner na mniejszych ekranach.
   Tydzień i miesiąc powinny mieć lepsze zachowanie na małych laptopach i mobile.

2. Uporządkować hierarchię informacji w komórkach kalendarza.
   Najważniejsze powinno być od razu widoczne:
   - typ,
   - tytuł,
   - status wykonania,
   - feedback.

3. Dodać lepsze puste stany.

4. Dodać lekki widok operacyjny dla grupy.
   Nie pełny kalendarz wszystkich zawodników naraz, tylko prosty przegląd typu:
   - kto dziś ma trening,
   - kto nie ma nic zaplanowane,
   - kto ma jednostkę jakościową.

## Kolejność wdrożenia

1. Typy treningów do bazy.
2. Szybkie kopiowanie i przesuwanie sesji.
3. Kopiowanie tygodnia i szablony.
4. Plan vs wykonanie.
5. Lepszy feedback w kalendarzu.
6. Responsywność i dopracowanie UX.
7. Lekki widok zbiorczy dla grupy.

## Najbliższy sensowny pakiet

Jeśli kontynuujemy prace dalej, kolejny pakiet powinien zawierać:
- typy treningów w bazie,
- szybkie przesuwanie sesji,
- szybkie kopiowanie sesji,
- lepsze oznaczanie feedbacku w kalendarzu.
