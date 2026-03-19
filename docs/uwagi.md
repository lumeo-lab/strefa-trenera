# Uwagi do zakładki Planner

## Ocena wizualna

Zakładka `planner` jest spójna z resztą produktu i już wygląda jak realne narzędzie robocze, ale wizualnie nie jest jeszcze ekranem klasy "główne centrum pracy trenera". Największy problem polega na tym, że bardziej przypomina bardzo dobrą zakładkę `Plan` wyjętą z profilu zawodnika niż osobny, mocny moduł planowania.

Najmocniejsze strony obecnego widoku:
- czytelna siatka tygodnia i miesiąca,
- sensowne wyróżnienie bieżącego dnia,
- szybkie skanowanie kart sesji,
- osobny język wizualny dla feedbacku,
- ogólna spójność z resztą aplikacji.

Największe braki:
- zbyt słaby header jak na tak ważny ekran,
- zbyt płaska hierarchia toolbaru,
- zbyt roboczy charakter części elementów,
- za mało wyrazista prezentacja najważniejszych sygnałów,
- widok miesiąca jest poprawny, ale wizualnie najsłabszy.

## Co poprawić wizualnie

### 1. Header planera

Obecny header jest zbyt skromny. Ma tytuł i wybór zawodnika, ale nie buduje poczucia, że to główny ekran operacyjny.

Do dodania w headerze:
- liczba sesji w aktualnym tygodniu,
- liczba wykonanych sesji,
- liczba dni lub sesji bez feedbacku,
- ewentualnie status zawodnika.

Cel:
- zmienić ekran z "zakładki z kalendarzem" w "centrum pracy".

### 2. Hierarchia toolbaru

Toolbar jest funkcjonalny, ale wizualnie zbyt równy. Za dużo elementów wygląda podobnie, przez co ekran traci hierarchię.

Lepszy podział:
- najważniejsze: `Tydzień / Miesiąc`,
- drugorzędne: zakres dat i nawigacja,
- pomocnicze: gęstość widoku, feedback, szablony.

Cel:
- lepiej prowadzić wzrok użytkownika,
- szybciej pokazać, co jest kluczową akcją, a co opcją pomocniczą.

### 3. Zamiana emoji na spójniejsze ikony

Obecne emoji:
- `📅`, `📆`, `🙈`, `💬`,
- `📏`, `⏱`, `⚡`, `🔗`

Są użyteczne, ale wizualnie obniżają poziom profesjonalizmu. Ekran wygląda przez to bardziej roboczo niż produktowo.

Do poprawy:
- zastąpić emoji spójnymi ikonami,
- albo uprościć część etykiet do samego tekstu.

Cel:
- podnieść jakość wizualną bez zmiany funkcji.

### 4. Mocniejsza karta dnia

Kolumny dni są poprawne, ale trochę zbyt neutralne.

Do poprawy:
- mocniejszy nagłówek dnia,
- lepszy kontrast między headerem dnia a treścią,
- bardziej wyraziste oznaczenie `dziś`,
- delikatnie lepsze odcięcie poszczególnych dni od siebie.

Cel:
- poprawić czytelność tygodnia przy szybkiej pracy wzrokiem.

### 5. Lepsze odróżnienie kart sesji

Karty sesji są praktyczne, ale przy większej liczbie treningów robią się zbyt podobne do siebie.

Do poprawy:
- mocniejsze odróżnienie typu treningu,
- czytelniejszy status wykonania,
- lepsza kolejność priorytetów informacji:
  - tytuł,
  - typ,
  - metryki,
  - link.

Cel:
- poprawić skanowanie planu przy dużej liczbie jednostek.

### 6. Feedback jako mocniejszy sygnał

Feedback jest pokazany poprawnie, ale nadal zbyt "na dole" struktury wizualnej dnia. Przy problemowym feedbacku trener powinien szybciej widzieć, że coś wymaga uwagi.

Do poprawy:
- większy kontrast dla czerwonych i żółtych sygnałów,
- krótsze etykiety,
- bardziej alertowy charakter dla problemowych dni,
- mocniejsze pierwsze wrażenie dla dni bez feedbacku po wykonanym treningu.

Cel:
- feedback ma być równie ważnym sygnałem jak sama sesja.

### 7. Widok miesiąca

To obecnie najsłabszy wizualnie fragment planera. Jest poprawny, ale bardziej tabelaryczny niż dopracowany.

Do poprawy:
- większy oddech w komórkach,
- lepszy stan zaznaczonego dnia,
- wyraźniejsze `+X więcej`,
- mocniejszy wizualnie panel szczegółów wybranego dnia pod kalendarzem.

Cel:
- sprawić, żeby widok miesiąca był nie tylko funkcjonalny, ale też przyjemny i szybki w użyciu.

## Priorytet wdrożenia

Kolejność sensowna wizualnie:
1. header planera,
2. toolbar i hierarchia sterowania,
3. karty sesji,
4. feedback,
5. widok miesiąca.

## Krótka ocena końcowa

Obecny `planner` jest dobry i spójny, ale jeszcze nie wygląda jak ekran premium ani jak kluczowe narzędzie w produkcie. Największy zysk wizualny da wzmocnienie hierarchii, ograniczenie roboczych elementów i lepsze pokazanie najważniejszych sygnałów dla trenera.

## Ocena funkcjonalna

Funkcjonalnie `planner` jest już sensownym narzędziem do codziennej pracy. Ma najważniejsze rzeczy potrzebne trenerowi:
- widok tygodnia,
- widok miesiąca,
- szybkie dodawanie sesji,
- edycję sesji,
- przesuwanie sesji między dniami,
- kopiowanie tygodnia,
- szablony tygodni,
- podgląd feedbacku,
- zachowanie ustawień widoku dla danego zawodnika.

To daje realną użyteczność i pozwala pracować na planie bez poczucia, że to tylko wersja testowa.

### Co działa funkcjonalnie dobrze

1. Tydzień jako główny tryb pracy

Widok tygodniowy jest naturalnym centrum pracy trenera. Pozwala szybko ocenić układ mikrocyklu, przesuwać jednostki i dodawać nowe bez zbędnych przejść.

2. Szybkie operacje na planie

Przesuwanie sesji oraz kopiowanie tygodnia to bardzo dobre funkcje operacyjne. To jest realna oszczędność czasu i dobry kierunek dla tego modułu.

3. Połączenie planu z feedbackiem

To jedna z mocniejszych stron. Plan nie jest oderwany od wykonania, tylko zaczyna być powiązany z tym, jak zawodnik zareagował na trening.

4. Szablony tygodni

To wartościowa funkcja, bo odpowiada na faktyczny sposób pracy trenerów. Pozwala nie układać podobnych układów od zera.

### Co funkcjonalnie warto poprawić

1. Brakuje szybkich akcji na pojedynczej sesji

Dziś można sesję przeciągać, ale nadal brakuje kilku bardzo praktycznych działań dostępnych jednym kliknięciem:
- `+1 dzień`,
- `-1 dzień`,
- `+7 dni`,
- `-7 dni`,
- `kopiuj na jutro`,
- `kopiuj za tydzień`,
- `kopiuj na wybraną datę`.

To byłby bardzo duży zysk operacyjny.

2. Brakuje lepszego przeglądu problemów w planie

Planner pokazuje feedback, ale nadal nie daje bardzo szybkiej odpowiedzi na pytania:
- które sesje nie mają feedbacku,
- które dni są problemowe,
- który tydzień ma przeciążenie,
- gdzie zawodnik nie wykonał planu.

Tu przydałyby się prostsze sygnały zbiorcze i filtry operacyjne.

3. Brakuje widoku grupowego

Na dziś `planner` działa głównie per zawodnik. To jest dobre jako podstawowy workflow, ale dla trenera prowadzącego kilka osób brakuje lekkiego widoku:
- kto dziś ma trening,
- kto dziś nie ma nic,
- kto ma jakościową jednostkę,
- kto ma zaległy feedback.

Nie chodzi o pełny kalendarz wszystkich naraz, tylko o szybki widok zbiorczy.

4. Miesiąc jest bardziej podglądowy niż roboczy

Widok miesiąca pozwala się zorientować, ale nie jest jeszcze równie mocnym trybem pracy jak tydzień. Funkcjonalnie wciąż bardziej służy do oglądania niż do sprawnego zarządzania planem.

5. Brakuje mocniejszego powiązania z wykonaniem

Planner pokazuje wykonanie i feedback, ale nadal można go rozwinąć tak, żeby szybciej pokazywał:
- wykonane vs niewykonane,
- odchylenie od planu,
- problemowe tygodnie,
- dni wymagające reakcji trenera.

### Priorytet funkcjonalny

Najbardziej sensowna kolejność dalszych prac funkcjonalnych:
1. szybkie akcje na pojedynczej sesji,
2. lepsze sygnały i filtry związane z feedbackiem,
3. lepsze pokazanie wykonania planu,
4. lekki widok grupowy,
5. dopracowanie roboczego znaczenia widoku miesiąca.

## Ocena techniczna

Technicznie `planner` stoi na sensownym fundamencie i jest dobrze rozwijany, ale architektonicznie nadal widać, że to moduł przejściowy między "zakładką planu" a pełnoprawnym plannerem.

### Co technicznie jest dobre

1. Osobne API dla planera

Zakres danych dla planera jest pobierany przez osobny endpoint z walidacją parametrów i kontrolą dostępu. To jest dobra baza pod dalszy rozwój.

2. Sensowne rozbicie na komponenty

Są już osobne elementy odpowiedzialne za:
- toolbar,
- kartę sesji,
- sekcję feedbacku,
- modale szablonów.

To daje lepszą czytelność niż jeden duży komponent z całym UI w środku.

3. Trwałość lokalnego stanu

Zapisywanie widoku per zawodnik jest dobrym detalem technicznym i produktowym. Dzięki temu planner pamięta sposób pracy trenera.

4. Dobra obsługa asynchronicznego ładowania

Ładowanie zakresu, czyszczenie requestów i podstawowa obsługa błędów są zrobione rozsądnie.

### Co technicznie warto poprawić

1. Zbyt duża zależność od zakładki profilu zawodnika

Najważniejszy problem architektoniczny: `planner` nie jest naprawdę własnym modułem. Obecnie jest oparty na `PlanTab` z profilu zawodnika.

Skutek:
- dobra spójność,
- ale słabsza niezależność,
- trudniej budować planner jako osobny produktowy moduł.

2. Za dużo odpowiedzialności w `PlanTab`

Ten komponent obsługuje jednocześnie:
- widoki tygodnia i miesiąca,
- persistence,
- pobieranie zakresu,
- przeciąganie sesji,
- kopiowanie tygodnia,
- pracę na szablonach,
- modale sesji,
- modal feedbacku.

To jeszcze działa, ale z czasem będzie trudniejsze do utrzymania.

3. Stara implementacja nadal leży w repo

`PlannerClient.tsx` wygląda jak starsza wersja modułu. To nie musi szkodzić działaniu, ale zwiększa koszt poznawczy i zaciemnia strukturę kodu.

4. Mało stanu w URL

Część ustawień siedzi tylko w `localStorage`. To jest wygodne lokalnie, ale ogranicza:
- linkowanie do konkretnego widoku,
- odtwarzanie konkretnego stanu,
- przewidywalność po odświeżeniu z parametrami.

Najbardziej sensowne byłoby wyniesienie części stanu do query params, np.:
- zawodnik,
- widok `week/month`,
- tydzień lub miesiąc.

5. Słabszy start danych po stronie serwera

Shell ładuje się z serwera, ale właściwy zakres planera i tak dociąga klient. To jest akceptowalne, ale nie jest idealnym modelem docelowym.

### Priorytet techniczny

Najbardziej sensowna kolejność dalszych prac technicznych:
1. wydzielić planner jako własny moduł, zamiast opierać go bezpośrednio o `PlanTab`,
2. uprościć i rozbić `PlanTab`,
3. uporządkować stare komponenty i usunąć lub oznaczyć legacy,
4. przenieść część stanu do URL,
5. przemyśleć lepszy model startowego ładowania danych.
