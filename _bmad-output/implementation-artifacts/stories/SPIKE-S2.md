# SPIKE-S2 — Kształt kolekcji `DeliverySlots` + matematyka cutoffu (strefa PL)

Status: zweryfikowane · ✅ DONE · EPIC-2 · utworzono 2026-06-21 · domknięte 2026-06-21

## Historyjka

Jako **operator** chcę **potwierdzić kształt kolekcji `DeliverySlots` (O3) i matematykę cutoffu (jak liczyć dostępne sloty w strefie Europe/Warsaw), w tym podejście do wyjątków dni (O7) i do współbieżności przy capacity (O4 — atomic check / transakcja)**, aby **reszta S2 budowała się na pewnym fundamencie i nie trzeba było przerabiać schematu w trakcie sprintu**.

## Kryteria akceptacji (z sprint-2.md)

Spike domyka decyzje projektowe (notatka + szkic/testy czystej funkcji), bez kodu produkcyjnego poza ewentualnym szkicem funkcji. Konkretnie:

- **(a) Kształt kolekcji `DeliverySlots` (O3).** Udokumentowany schemat dedykowanej kolekcji multi-tenant (nie pole array w `tenant.settings`):
  - dzień tygodnia (cykliczny harmonogram tygodniowy),
  - okno dostawy „od–do" (godzina początku i końca okna),
  - `cutoffTime` — stała godzina graniczna per dzień (O2; np. zamówienia na jutro do 18:00 dnia poprzedniego),
  - limit miejsc / `capacity` (O4; liczba całkowita ≥ 0),
  - relacja `tenant` (wpięcie w `multiTenantPlugin.collections` → izolacja gratis).
  - Decyzja: typ pola dnia tygodnia (enum/number 0–6), reprezentacja godzin (string `HH:mm` vs minuty od północy), semantyka cutoffu względem dnia dostawy (ile dni wcześniej + o której).
- **(b) Model wyłączonych dat (O7).** Wybrany model override'u cyklicznego harmonogramu: osobne pole dat na `DeliverySlots` vs powiązana kolekcja wyjątków (`tenant`-scoped). Wyłączone daty muszą być wykluczane z dostępnych slotów. Decyzja zapada w spike, bo wchodzi do `computeAvailableSlots` (S2.8) zanim powstanie UI (S2.2).
- **(c) Czysta funkcja `computeAvailableSlots(slots, exceptions, now)`.** Udokumentowany kontrakt + szkic:
  - strefa **Europe/Warsaw** (nie UTC) — poprawne mapowanie „dzisiaj/jutro" i godziny cutoffu na lokalny czas,
  - poprawność przy zmianie czasu letni/zimowy (DST) — slot/cutoff nie „przeskakuje" o godzinę,
  - brak slotów ujemnych, przeszłych, po cutoffie, z wyłączonych dat (O7) ani pełnych (capacity wyczerpane, O4),
  - deterministyczna względem wstrzykniętego `now` (testowalność strefowa/DST bez `Date.now()`).
- **(d) Podejście do współbieżności capacity (O4).** Wybrana strategia odporna na wyścig przy `placeOrder`: transakcja / atomiczny check-and-reserve przez Payload Local API tak, by dwoje klientów biorących ostatnie miejsce naraz nie przekroczyło limitu. Notatka rozstrzyga: gdzie żyje rezerwacja (przy tworzeniu zamówienia w `placeOrder`), jak wykryć przegranego (błąd PL „slot właśnie się zapełnił", zamówienie nie powstaje), oraz **ścieżkę spójności licznika: przeliczanie z zamówień (`payload.count` aktywnych zamówień na slot) vs licznik inkrementalny na slocie** — spike wybiera jedną i uzasadnia (preferencja: przeliczanie z zamówień = jedno źródło prawdy, brak driftu).
- **(e) Reguła licznika względem cyklu życia zamówienia (ZATWIERDZONE).** Doprecyzowane i zgodne z O4/O6:
  - licznik = liczba **aktywnych (niezanulowanych)** zamówień przypisanych do slotu,
  - `cancelled` **zwalnia** miejsce (slot znów może być oferowany / dobity do limitu),
  - reaktywacja `cancelled→new` **re-waliduje** capacity i **odrzuca**, gdy slot jest pełny (błąd PL, brak nadrezerwacji),
  - spike domyka **tylko ścieżkę spójności** (przeliczanie z zamówień vs licznik inkrementalny) — egzekwowanie żyje w S2.7, snapshot slotu w S2.4.

## Zależności

- **Brak zależności wstecz** — SPIKE-S2 jest pierwszą historią EPIC-2.
- Korzysta z istniejącego fundamentu EPIC-1: `placeOrder` (serwerowa walidacja koszyka/cen, snapshot pozycji + adresu), kolekcja `orders` (`ordersCollectionOverride`), maszyna stanów `new→confirmed→preparing→out_for_delivery→delivered` + `cancelled`/reaktywacja w `order-status.ts`. Spike nie zmienia tego fundamentu — tylko projektuje, jak capacity i slot się na nim oprą.
- Odblokowuje: S2.1 (kolekcja), S2.8 (wyjątki dni), S2.7 (współbieżność capacity).

## Uwagi implementacyjne

- **Gdzie żyje walidacja serwerowa (wzorzec do naśladowania).** `src/lib/cart-validation.ts` jest pojedynczym źródłem prawdy dla legalności pozycji/ceny — **czysty moduł** (BEZ `'use server'`, bez `next/headers`, bez `@/lib/auth`, bez Reacta), importowalny zarówno z komponentów serwerowych, jak i z plików akcji. `computeAvailableSlots` ma żyć analogicznie: czysty, deterministyczny moduł (np. `src/lib/delivery-slots.ts`), bez `'use server'` i bez `next/headers`, przyjmujący `now` jako argument, współdzielony przez ścieżkę odczytu (UI w S2.2) i ścieżkę walidacji (`placeOrder` w S2.3/S2.7).
- **Multi-tenant „gratis".** `DeliverySlots` dopisana do `multiTenantPlugin.collections` → plugin dodaje `tenant_id` i wymusza izolację w panelu i na ścieżkach zapisu (analogicznie do potwierdzenia ze SPIKE-A, gdzie własny `access.update` na zamówieniu okazał się zbędny — plugin pilnuje). Ścieżki odczytu na froncie i tak idą przez `overrideAccess: true` + ręczny filtr `where { tenant }`. Brak slotów u tenanta = feature wyłączony (O8) — checkout jak dziś.
- **Pułapka hydratacji Turbopack (NFR6, R-S2.5).** Sloty są wyliczane serwerowo i podawane do klienckiego `CartView` propsami. Trzymać wyliczanie w czystym module (jak `cart-validation.ts`) — NIE wewnątrz pliku `'use server'`. Akcje (`actions.ts`/`cart-actions.ts`) importują `next/headers` bezpośrednio, nie przez `@/lib/auth`; nie importować tego samego pliku `'use server'` jednocześnie z komponentu serwerowego i klienckiego; typy wejściowe akcji trzymać inline. Naruszenie → cicha awaria hydratacji client-island (bez błędu w konsoli).
- **`carts.status` niezapytywalne — przeniesienie ostrożności.** Przy projektowaniu zapytań capacity pamiętać, że `status` na `carts` nie jest zapytywalną ścieżką (`QueryError`). Na `orders` status automatu stanów jest polem select przez override; **zweryfikować w spike, że status zamówienia JEST zapytywalny** (potrzebne do liczenia aktywnych zamówień na slot via `payload.count` z `where { deliverySlot, status not_in cancelled }`). To jest realne ryzyko techniczne do potwierdzenia testem.
- **Postgres w Dockerze (testy).** Testy jednostkowe `computeAvailableSlots` są czyste (bez DB), ale weryfikacja współbieżności/licznika idzie przez Payload Local API na **live Docker Postgres** (`od-sasiada-pg`, `postgres:17`, port 5432, baza `od_sasiada`). Jeśli daemon padł: `open -a Docker`, poczekać aż `docker info` przejdzie, potem `docker start od-sasiada-pg`. NIE używać Homebrew Postgres.
- **Transakcje przez Payload Local API.** Atomic check-and-reserve dla capacity (O4) realizować transakcją Local API (przekazanie `req`/transaction przez warstwę `placeOrder`), nie naiwnym „odczytaj licznik → sprawdź → zapisz". Spike rozstrzyga kształt transakcji i przygotowuje grunt pod implementację w S2.7.
- **Zamówienia to referencje (kontekst).** Plugin ecommerce trzyma pozycje jako referencje + `amount` + `currency`; projekt dodaje snapshoty/numer/status przez `ordersCollectionOverride`. Slot dostawy będzie analogicznym snapshotem (S2.4, filozofia B1 — odporny na późniejsze zmiany configu w `DeliverySlots`). Spike przewiduje, gdzie ten blok `deliverySlot` wejdzie, ale go nie buduje.

### Adresowane ryzyka

- **R-S2.1 (poprawność / strefa czasowa, DST).** Błędna matematyka cutoffu (UTC vs Europe/Warsaw, zmiana czasu) → klient wybiera slot, który już minął, albo nie widzi dostępnego. Spike adresuje: czysta, deterministyczna `computeAvailableSlots(slots, exceptions, now)` z testami strefowymi/DST przed jakimkolwiek kodem produkcyjnym.
- **R-S2.7 (współbieżność / overbooking — nowe, z O4).** Dwoje klientów bierze ostatnie miejsce naraz; naiwny „read-check-write" przepuści oba i przekroczy `capacity`. Spike adresuje: wybór strategii atomic check-and-reserve / transakcji (Local API) + zatwierdzona reguła licznika względem cyklu życia (zwalnianie przy `cancelled`, re-walidacja przy `cancelled→new`) + decyzja o ścieżce spójności (przeliczanie z zamówień vs inkrementalny licznik). Egzekwowanie kodowe ląduje w S2.7.

## Plan weryfikacji

Jak udowodnić wynik spike'a (zamiast „Dowodów testów" — to historia do zrobienia):

1. **Notatka decyzyjna** (w tym pliku lub osobnym artefakcie) domykająca: (a) finalny kształt pól `DeliverySlots`, (b) model wyjątków dni (O7 — pole vs kolekcja, z uzasadnieniem), (c) wybór strategii współbieżności capacity (O4 — transakcja/atomic check-and-reserve) i ścieżki spójności licznika (przeliczanie z zamówień vs inkrementalny), wraz z potwierdzeniem reguły cyklu życia (e).
2. **Szkic + testy jednostkowe `computeAvailableSlots`** (czysty moduł, `now` wstrzykiwany) pokrywające:
   - strefę Europe/Warsaw (poprawne „dzisiaj/jutro" i godzina cutoffu),
   - przejście DST wiosna/jesień (cutoff/okno bez przeskoku o godzinę),
   - cutoff: slot przed cutoffem widoczny, po cutoffie ukryty, slot przeszły ukryty,
   - wyłączone daty (O7) — sloty z tych dni wykluczone,
   - capacity (O4) — slot pełny (licznik = `capacity`) wykluczony, slot z wolnym miejscem widoczny.
3. **Weryfikacja zapytywalności i licznika na live DB.** `pnpm test` na live Docker Postgres (`od-sasiada-pg`): potwierdzić, że status zamówienia jest zapytywalny dla `payload.count` aktywnych zamówień na slot, oraz że reguła licznika trzyma się przy `cancelled` (zwolnienie) i `cancelled→new` (re-walidacja / odrzucenie przy pełnym slocie). Jeśli pełny dowód współbieżności wykracza poza spike — udokumentować wybraną strategię i pozostawić enforcement do S2.7, ale potwierdzić wykonalność (transakcja Local API działa, status zapytywalny).

## Wynik spike'a (notatka decyzyjna)

> Domknięte 2026-06-21. Dowód: `src/lib/delivery-slots.ts` (czysta `computeAvailableSlots`) + `tests/unit/delivery-slots.test.ts` (15 testów: zwykły dzień, granica cutoffu przed/na/po, DST wiosna/jesień, zima, data wyłączona O7, capacity pełny/wolny/zero O4, feature-off O8, slot zdegenerowany). `pnpm test` na live Docker Postgres (`od-sasiada-pg`): **54 passed, 1 skipped (55), 10 plików** — zero regresji. Zapytywalność `orders.status` potwierdzona osobnym, usuniętym po teście probe'em na live DB.

### (a) Kształt kolekcji `DeliverySlots` (O3)

Dedykowana kolekcja multi-tenant (NIE pole array w `tenant.settings`), wpięta w `multiTenantPlugin.collections` → izolacja tenant gratis (`tenant_id` + wymuszenie na zapisie w panelu; odczyt na froncie i tak przez `overrideAccess: true` + ręczny `where { tenant }`, analogicznie do `carts`/`orders`).

Pola (slug `delivery-slots`):

| Pole | Typ Payload | Semantyka |
|------|-------------|-----------|
| `tenant` | relationship → `tenants` (przez plugin) | właściciel slotu; izolacja |
| `weekday` | `number` (select 0–6, etykiety PL) | cykliczny dzień tygodnia, **0 = niedziela … 6 = sobota** (zgodne z JS `getDay()` i kolejnością `Intl`) |
| `windowStart` | `text`, walidacja `^\d{2}:\d{2}$` | początek okna, wall-clock `HH:mm` **Europe/Warsaw** |
| `windowEnd` | `text`, walidacja `^\d{2}:\d{2}$` | koniec okna `HH:mm`; walidacja `windowEnd > windowStart` (S2.1) |
| `cutoffDaysBefore` | `number` (int ≥ 0) | ile dni KALENDARZOWYCH przed dniem dostawy; O2 „na jutro" = `1`, same-day = `0` |
| `cutoffTime` | `text`, `^\d{2}:\d{2}$` | godzina graniczna `HH:mm` Europe/Warsaw na dniu `dzień_dostawy − cutoffDaysBefore` |
| `capacity` | `number` (int ≥ 0) | limit aktywnych zamówień na JEDNO wystąpienie slotu (O4) |

**Decyzje reprezentacji (zablokowane):**
- **Dzień tygodnia = `number` 0–6** (nie string), bo `computeAvailableSlots` porównuje go bezpośrednio z `getUTCDay()`/`Intl` — zero mapowania w hot-path.
- **Godziny = string `HH:mm`**, nie „minuty od północy". Czytelne w panelu/DB, trywialnie walidowalne regexem, a funkcja i tak parsuje raz do minut. „Minuty od północy" niczego nie kupują, a utrudniają edycję ręczną.
- **Cutoff = `(cutoffDaysBefore, cutoffTime)`**, nie pojedynczy timestamp ani lead-time godzinowy. Bezpośrednio modeluje O2 („na jutro do 18:00 dnia poprzedniego" = `(1, "18:00")`), jest cykliczny (działa dla każdego wystąpienia), a lead-time godzinowy świadomie zaparkowany (sprint-2 „Poza sprintem").
- **`reservedCount` NIE jest polem kolekcji** — to argument wejściowy czystej funkcji (DB-derived), patrz (d)/ścieżka spójności. `DeliverySlots` trzyma tylko config; obłożenie liczone z `orders`.

### (b) Model wyłączonych dat (O7) — REKOMENDACJA: osobna kolekcja wyjątków

**Wybór: osobna kolekcja `DeliveryDateExceptions`** (`tenant`-scoped, multi-tenant gratis), pole `date` jako kalendarzowy dzień `YYYY-MM-DD` (Europe/Warsaw, bez czasu). NIE pole-array dat na `DeliverySlots`.

Uzasadnienie:
- **Wyjątek dotyczy CAŁEGO dnia u dostawcy, nie pojedynczego slotu.** „24 grudnia nie dowozimy" wyłącza wszystkie okna tego dnia. Pole-array na slocie wymuszałoby duplikowanie tej samej daty na każdym oknie weekendowego harmonogramu i ryzyko rozjazdu.
- **Czysta funkcja już to konsumuje tak właśnie:** `exceptions: DateException[]` = płaska lista dni, budowana w `Set<string>` i sprawdzana raz na dzień kandydujący (O(1) per dzień). Mapuje 1:1 na osobną kolekcję.
- **UI/UX (S2.8):** dostawca dodaje datę raz; nie grzebie w każdym slocie. Łatwy widok „nadchodzące wyłączone dni".
- Kompromis: jedna relacja więcej do odczytu w ścieżce checkoutu — pomijalne (jedno `find` per tenant, mały zbiór dat).

Kontrakt funkcji: wystąpienie slotu wypadające na datę z `exceptions` jest pomijane PRZED sprawdzaniem cutoffu/capacity. Potwierdzone testem „excluded dates (O7)".

### (c) Czysta funkcja `computeAvailableSlots(slots, exceptions, now, horizonDays?)`

Zrealizowana w `src/lib/delivery-slots.ts` jako czysty moduł wg wzorca `cart-validation.ts`: **bez `'use server'`, bez `next/headers`, bez `@/lib/auth`, bez Reacta, bez I/O.** Importowalna z komponentu serwerowego (ścieżka odczytu, S2.2) i z pliku akcji `'use server'` (re-walidacja w `placeOrder`, S2.3) — chroni granicę hydratacji Turbopack (R-S2.5).

**Mechanizm DST (kluczowy):** funkcja NIE robi arytmetyki na milisekundach offsetu. Czyta **pola kalendarzowe** instantu `now` w strefie Europe/Warsaw przez `Intl.DateTimeFormat` (`year/month/day/weekday/hour/minute`, `hourCycle: 'h23'`) i porównuje je z wall-clock harmonogramu slotu (dzień tygodnia + `HH:mm`). Baza tz systemu rozstrzyga przeskok wiosna/jesień, więc „cutoff 18:00 Warsaw" pozostaje 18:00 Warsaw po OBU stronach zmiany czasu. Udowodnione testami DST: ten sam wall-clock cutoff (`Sun 29.03 18:00` wiosna, `Sat 24.10 18:00` jesień) zamyka slot dokładnie na granicy — minuta przed = widoczny, minuta po = ukryty. Naiwna arytmetyka offsetu przesunęłaby tę granicę o godzinę — tu się nie przesuwa.

Wyklucza wystąpienia: na dacie wyłączonej (O7); przeszłe / których okno już się zaczęło (`windowStart <= now` w Warsaw); po cutoffie (`now >= cutoff`, gdzie cutoff = `cutoffTime` na dniu `dzień − cutoffDaysBefore`); pełne lub `capacity <= 0` (O4); zdegenerowane (`windowEnd <= windowStart`, malformed `HH:mm`). Deterministyczna względem wstrzykniętego `now`. Projekcja na horyzont (domyślnie 14 dni) → konkretne wystąpienia `{ id, date, weekday, windowStart, windowEnd, remaining }`, sortowane po dacie i godzinie. `slots = []` → `[]` (feature off, O8).

**Granica cutoffu = `>=` (zamknięty).** Slot o godzinie cutoffu jest już ZAMKNIĘTY (minuta przed widoczny, dokładnie na cutoffie ukryty) — bezpieczniejsze dla operatora niż wpuszczanie zamówień „o równej 18:00".

### (d) Współbieżność capacity (O4) — strategia

**Wybór: atomic check-and-reserve w transakcji Payload Local API**, osadzony w `placeOrder` (tam, gdzie powstaje zamówienie i już żyje serwerowa walidacja koszyka/cen). NIE naiwny „odczytaj licznik → sprawdź → zapisz".

Kształt (do implementacji w S2.7, spike potwierdza wykonalność):
1. `placeOrder` otwiera transakcję Local API; `req`/transaction przepychany przez wszystkie wywołania (`count`, `create`) — jedna izolowana jednostka.
2. W transakcji: `payload.count({ collection: 'orders', where: { and: [{ deliverySlot: <id> }, { status: { not_in: ['cancelled'] } }] }, req })` → liczba aktywnych zamówień na slot.
3. Jeśli `count >= capacity` → rollback + błąd PL „slot właśnie się zapełnił", zamówienie NIE powstaje (przegrany wyścigu).
4. W przeciwnym razie `create` zamówienia (ze snapshotem slotu, S2.4) w tej samej transakcji.
5. Atomowość wyścigu domyka **transakcja na poziomie izolacji DB** + (rekomendacja) `SELECT ... FOR UPDATE` na wierszu slotu LUB unikalny licznik — patrz „otwarte ryzyko" niżej; pełne wymuszenie i wybór mechanizmu blokady to S2.7.

**Snapshot slotu** żyje w zamówieniu (blok `deliverySlot`, B1, S2.4) — odporny na późniejsze zmiany configu w `DeliverySlots`. Rezerwacja = sam fakt istnienia aktywnego zamówienia wskazującego na slot (relacja `deliverySlot` na `orders`), nie osobny rekord rezerwacji.

### (d/e) Ścieżka spójności licznika — WYBÓR: przeliczanie z zamówień (jedno źródło prawdy)

**Wybór: recount z `orders`**, NIE licznik inkrementalny na `DeliverySlots`. Licznik = `payload.count` aktywnych (niezanulowanych) zamówień przypisanych do slotu.

Uzasadnienie:
- **Jedno źródło prawdy, brak driftu.** Licznik inkrementalny na slocie wymagałby utrzymania spójności przy `create` zamówienia, `cancelled` (dekrement), `cancelled→new` (inkrement) — każda pominięta ścieżka = trwały rozjazd. Recount nie ma stanu do zepsucia.
- **Reguła cyklu życia (e) trywialna:** `cancelled` automatycznie znika z `count` (filtr `status not_in ['cancelled']`) → miejsce zwolnione. `cancelled→new` to po prostu znów aktywne zamówienie → ponowny `count` w transakcji re-waliduje capacity i odrzuca, gdy pełny (egzekwowanie w S2.7). Zero osobnej logiki licznika.
- **`reservedCount` jako wejście czystej funkcji** = liczba z tego recountu, podawana propsem do `computeAvailableSlots` na ścieżce odczytu (S2.2). Funkcja pozostaje czysta.

**Potwierdzone ryzyko techniczne (przeniesienie ostrożności z `carts.status`):** w przeciwieństwie do `carts.status` (NIEzapytywalne, `QueryError`), **`orders.status` JEST zapytywalną ścieżką** — bo override `ordersCollectionOverride` redefiniuje je jako realne pole `select` automatu stanów (`order-status.ts`). Potwierdzone na live DB: `payload.count({ collection: 'orders', where: { status: { not_in: ['cancelled'] } } })` zwraca liczbę bez błędu. Recount aktywnych zamówień na slot jest więc wykonalny. Gotcha `carts.status` NIE przenosi się na `orders`.

### Strefa czasowa — uwaga do narzędzi

Zrealizowane **bez biblioteki tz** — wyłącznie wbudowany `Intl.DateTimeFormat` z `timeZone: 'Europe/Warsaw'`, zgodnie z ograniczeniem spike'a. To wystarcza dla bieżącego zakresu (porównania pól kalendarzowych, brak generowania lokalnych timestampów). **Rekomendacja na przyszłość (nie blokująca):** jeśli kolejne historie będą potrzebować konstruowania konkretnych instantów UTC z wall-clock Warsaw (np. timestamp początku okna do `cron`/SLA) lub formatowania złożonych zakresów, rozważyć `@date-fns/tz` lub `Temporal` (gdy stabilne) — wtedy decyzję o zależności podejmuje właściciel `package.json`.

### Otwarte ryzyka / scope do S2.7

- **Mechanizm blokady wiersza w transakcji.** Sam `count` w transakcji nie gwarantuje atomowości przy najniższych poziomach izolacji Postgresa, jeśli dwa równoległe `placeOrder` policzą tę samą wartość przed jakimkolwiek `insert`. S2.7 musi dobrać: (i) `SERIALIZABLE` z retry przy konflikcie, ALBO (ii) jawny `SELECT ... FOR UPDATE` na wierszu slotu jako „muteksie" przed recountem. Spike potwierdza wykonalność transakcji Local API i zapytywalność statusu; **wybór mechanizmu blokady + dowód anty-overbooking (dwa równoległe zamówienia na ostatnie miejsce) zostaje do S2.7.**
- **Pełny dowód reguły `cancelled` / `cancelled→new` na żywej współbieżności** — egzekwowanie i test integracyjny w S2.7 (spike potwierdził: status zapytywalny, automat stanów dopuszcza `cancelled→new`, recount poprawnie pomija `cancelled`).
