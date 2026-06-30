# PRD — od-sasiada.pl

> Status: zaktualizowany 2026-06-30 (po Sprintach 1–3; EPIC-1/2/3 ukończone). Poziom: Product Manager. Linki krzyżowe: [product-brief.md](./product-brief.md), [epics.md](./epics.md), [architecture.md](./architecture.md). Źródło prawdy statusu historyjek: `implementation-artifacts/stories/*`.

## 1. Cel produktu

Umożliwić dostawcy świeżych produktów z Kaszub prowadzenie pełnego cyklu życia zamówień na wielotenantskiej platformie: **wystawienie towarów → zalogowany klient zamawia (płatność przy odbiorze) → dostawca realizuje zamówienie przez automat stanów dostawy → potwierdzenie e-mail** — ze ścisłą izolacją per-tenant i zapisami zamówień, które przetrwają późniejsze zmiany katalogu.

## 2. Persony

- **Operator** — admin platformy (rola `platform-admin`), widoczność między-tenantska, onboarding dostawców.
- **Dostawca** — tenant; użytkownik panelu admina przypisany do własnego tenanta; zarządza katalogiem i realizuje zamówienia.
- **Klient** — rekord `customers` z autentykacją, powiązany z jednym dostawcą (tenantem); zamawia, zapisuje adresy, przegląda historię zamówień.

## 3. Wymagania funkcjonalne

Wywiedzione z dostarczonych możliwości Sprintu 1 (patrz epics.md dla pierwotnych ID historyjek).

| ID | Wymaganie | Historyjka |
|----|-----------|------------|
| **FR1** | Platforma jest wielotenantska: każdy dostawca jest tenantem. Izolacja utrzymywana w panelu admina, Local API i froncie, tak że dostawca widzi tylko własne dane. | SPIKE-A, S1.4 |
| **FR2** | Katalog używa modelu Produkt + Wariant **"porcja"** (np. produkt z wariantami per porcja); każdy produkt/wariant ma cenę w groszach. | bazowy / S1.1 |
| **FR3** | Każdy tenant ma katalog i witrynę per-tenant pod `/[tenant]`; publiczny katalog wyświetla tylko **opublikowane** produkty dla tego tenanta. | bazowy |
| **FR4** | Klienci mogą się rejestrować, logować i wylogowywać (kolekcja `customers`, z autentykacją); klient zalogowany u dostawcy A jest traktowany jako anonimowy u dostawcy B. | S1.0 |
| **FR5** | Klienci mogą żądać **resetu hasła** e-mailem. | S1.7 |
| **FR6** | Koszyk jest **serwerowy** (kolekcja ecommerce `carts`), jeden otwarty koszyk per klient+tenant, utrzymywany między sesjami. | S1.2 |
| **FR7** | Checkout **wymaga logowania** (checkout gościa poza zakresem). | S1.2 |
| **FR8** | Ceny pozycji i przynależność tenanta są **walidowane serwerowo** przy dodawaniu do koszyka i ponownie przy ckeckoucie; cena przesłana z klienta nigdy nie jest zaufana (cena odczytywana z bazy). | S1.2 |
| **FR9** | Checkout to **płatność przy odbiorze**: zamówienie tworzone bezpośrednio przez Local API (bez płatności online). | bazowy / S1.2 |
| **FR10** | Każde zamówienie otrzymuje czytelny **numer zamówienia** `ZAM-RRRR-NNNNN`, generowany przy tworzeniu. | nadpisanie bazowe |
| **FR11** | Każda pozycja zamówienia **robi snapshot** nazwy produktu, etykiety wariantu i ceny jednostkowej przy składaniu, odporny na późniejsze zmiany cen/produktów. | nadpisanie bazowe |
| **FR12** | Adres dostawy jest wybierany z zapisanych adresów lub wprowadzany nowy i jest **zapisywany** w zamówieniu. | S1.3 |
| **FR13** | Klienci mogą **zapisywać/edytować/usuwać** adresy dostawy (pola PL; kod pocztowy `NN-NNN`, regex `^\d{2}-\d{3}$`). | S1.3 |
| **FR14** | Status zamówienia podąża za **automatem stanów liniowy z cofaniem**: `new → confirmed → preparing → out_for_delivery → delivered`, z `cancelled` dostępnym z każdego stanu niedostarczonego i reaktywacją `cancelled → new`. Niedozwolone przejścia są odrzucane. | S1.5 |
| **FR15** | Dostawcy widzą w panelu **tylko własne** zamówienia, filtrowalne po statusie i sortowalne wg daty; `update` zamówienia jest scopedowany na tenanta. | S1.4, SPIKE-A |
| **FR16** | Pełne szczegóły zamówienia są dostępne dla dostawcy w panelu (snapshot, adres, kontakt, edytowalny status) i dla klienta na froncie tylko do odczytu pod `/[tenant]/moje-zamowienia/[id]`, izolowane przez tenanta + klienta. | S1.6 |
| **FR17** | Przy składaniu zamówienia wysyłany jest **e-mail potwierdzający zamówienie** do klienta; hook e-mail o zmianie statusu istnieje (`sendStatusChange`) do przyszłego wykorzystania. Błędy e-maili są logowane, nigdy nie blokują zamówienia. | S1.7, S1.5 |
| **FR18** | Klienci mogą przeglądać "moje zamówienia" (`/[tenant]/moje-zamowienia`) i **zamawiać ponownie** (zapisuje pozycje do serwerowego koszyka). | bazowy / S1.2 |

### EPIC-2 — Okna dostawy i powiadomienia (decyzje O1–O8; AC: `stories/S2.*`; historia: [archiwum](../../docs/archive/sprint-2.md))

| ID | Wymaganie | Historyjka |
|----|-----------|------------|
| **FR19** | Dostawca konfiguruje predefiniowane **stałe okna dostawy** per tenant; klient wybiera z listy (O1). | S2.1, S2.2 |
| **FR20** | **Cutoff** jako stała godzina dzienna (`cutoffTime`), walidowany serwerowo; slot po cutoffie/przeszły odrzucany (O2). | S2.3 |
| **FR21** | Okna żyją w dedykowanej kolekcji multi-tenant **`DeliverySlots`** (nie w `tenant.settings`) (O3). | S2.1 |
| **FR22** | Każdy slot ma **limit miejsc (capacity)**; walidacja dostępności serwerowa i **odporna na wyścig**; pełny slot znika z listy (O4). | S2.7 |
| **FR23** | Dostawca oznacza **wyjątki dni** (daty niedostępne) wykluczane z dostępnych slotów (O7). | S2.8 |
| **FR24** | Wybrany slot **snapshotowany** do zamówienia; widoczny w panelu, na froncie i w mailu (B1-style). | S2.4 |
| **FR25** | **Maile statusowe** tylko na milestone'ach wprzód (`confirmed/out_for_delivery/delivered/cancelled`), bez spamu przy cofnięciu; treść PL (O5/O6). | S2.5, S2.6 |
| **FR26** | Slot **wymagany**, gdy tenant ma okna; brak okien → feature wyłączony, checkout jak dziś (O8). | S2.2, S2.3 |

### EPIC-3 — Media i kategorie (decyzje D1–D7; AC: `stories/S3.*`; historia: [archiwum](../../docs/archive/sprint-3.md))

| ID | Wymaganie | Historyjka |
|----|-----------|------------|
| **FR27** | Kolekcja **`Media`** (Upload) per-tenant; storage **Vercel Blob**; `sharp` rozmiary; `alt` wymagane (D1, D2). | S3.1 |
| **FR28** | Pojedyncze **hero** na produkcie **oraz** wariancie; fallback **wariant→produkt→placeholder**; zdjęcie opcjonalne (D3, D6). | S3.2, S3.3 |
| **FR29** | Render zdjęcia na katalogu `/[tenant]` i w szczegółach zamówienia (panel + front), `next/image`. | S3.3 |
| **FR30** | Kolekcja **`Categories`** per-tenant; relacja produkt↔kategoria **`hasMany`**; kategoria opcjonalna (D4, D5, D7). | S3.4 |
| **FR31** | CRUD kategorii w panelu, **tenant-scoped**. | S3.5 |
| **FR32** | **Filtr po kategorii** na katalogu, server-side (`?kategoria=`), `tenant` zawsze w `where`. | S3.6 |

## 4. Wymagania niefunkcjonalne

| ID | Wymaganie |
|----|-----------|
| **NFR1** | **Izolacja/bezpieczeństwo tenantów:** brak odczytu/zapisu zamówień, katalogu, koszyków, klientów lub adresów między-tenantami. Odczyty frontendoowe używają `overrideAccess: true` z ręcznym filtrem `where { customer, tenant }`; dostęp między-tenantski musi zwracać puste/403/404. Zweryfikowane przez test regresyjny `orders-tenant-isolation`. |
| **NFR2** | **Integralność cen:** wszystkie wartości pieniężne przechowywane i obliczane w groszach (liczby całkowite); pojedyncze źródło prawdy dla walidacji pozycji (`cart-validation.ts`) współdzielone przez akcje koszyka i `placeOrder`; cena klienta nigdy nie jest zaufana. |
| **NFR3** | **Trwałość danych:** snapshoty pozycji zamówień i numer zamówienia utrzymują się niezależnie od późniejszych edycji/usunięć katalogu/cen. |
| **NFR4** | **Odporność:** e-maile transakcyjne są best-effort — błędy SMTP są łapane i logowane, nigdy nie powodują niepowodzenia operacji zamówienia. |
| **NFR5** | **Lokalizacja:** witryna i admin w języku polskim (`i18n` fallback `pl`); waluta PLN z symbolem `zł`. |
| **NFR6** | **Poprawność hydratacji (Next 16 + Turbopack):** pliki akcji z `'use server'` importowane przez komponenty klienckie muszą importować `next/headers` bezpośrednio i nie być podwójnie importowane przez komponenty serwerowe + klienckie, aby uniknąć cichej awarii hydratacji client-island. |
| **NFR7** | **Środowisko dev lokalne:** Postgres działa w jednorazowym kontenerze Docker (`postgres:17`, `od-sasiada-pg`), nie Homebrew. |
| **NFR8** | **Wydajność frontu katalogu ze zdjęciami (EPIC-3):** `next/image` + warianty `sharp` + lazy-load; LCP listy produktów mierzony i utrzymany pod kontrolą. |

## 5. Epiki

- **EPIC-1 — Fundament workflow dostawcy** ✅ ukończone (Sprint 1, wszystkie 8 ticketów GOTOWE). Historyjki S1.1–S1.7 + SPIKE-A. Patrz [epics.md](./epics.md).
- **EPIC-2 — Okna dostawy i powiadomienia o statusie** ✅ ukończone (S2, FR19–FR26; SPIKE-S2 + S2.1–S2.8 GOTOWE, S2.9 PARK): wybór okna czasowego dostawy z cutoff; **limit miejsc na slot (capacity, odporny na wyścig)**; **wyjątki dni**; e-mail o zmianie statusu (milestone'y, PL). Szczegóły: [epics.md](./epics.md) + `stories/S2.*`.
- **EPIC-3 — Media i kategorie** ✅ ukończone (S3, FR27–FR32; SPIKE-S3 + S3.1–S3.6 GOTOWE): zdjęcia produktów (Media per-tenant, **Vercel Blob**); **zdjęcie na produkcie i wariancie z fallbackiem**; **wiele kategorii na produkt (`hasMany`)**. Szczegóły: [epics.md](./epics.md) + `stories/S3.*`.

## 6. Poza zakresem / backlog

- **Koszyk gościa / checkout gościa** — logowanie wymuszone (B4); koszyk gościa odłożony.
- **E-mail klienta per-tenant** — oddzielne konto per dostawca; obecnie e-mail jest globalnie unikalny, niedopasowanie tenantów odrzucane przy logowaniu (TODO).
- **Okna czasowe dostawy** (EPIC-2 / S2).
- **E-mail o zmianie statusu** podłączony do przepływu klienta (hook istnieje, EPIC-2).
- **Zdjęcia i kategorie produktów** (EPIC-3 / S3).
- **Korekta wagi przy dostawie** (faza 2), **łączenie gość → konto**, **SMS** — backlog.
- **Fakturowanie operatora / subskrypcja per-tenant** — odłożone do 3+ tenantów.
- **Pełne RODO/GDPR** (anonimizacja + UODO) — odłożone do publicznego uruchomienia.

## 7. Ryzyka

| ID | Typ | Ryzyko | Mitygacja |
|----|-----|--------|-----------|
| **R1** | Operacyjne | Brak e-maili → klienci dzwonią, dostawca przytłoczony. | S1.7 — adapter e-mail + potwierdzenie zamówienia dostarczone w tym sprincie. |
| **R2** | Bezpieczeństwa | Izolacja tenantów przy `update` zamówienia nieprzetestowana. | SPIKE-A — test regresyjny przed S1.5; potwierdzone, że plugin pilnuje `update`, własny `access.update` niepotrzebny. |
| **R3** | Refaktor | Migracja koszyka serwerowego psuje koszyk-store / placeOrder / reorder. | S1.2 zaplanowany ostatni; wielokrotnie używalny rdzeń walidacji (`cart-validation.ts`). |
