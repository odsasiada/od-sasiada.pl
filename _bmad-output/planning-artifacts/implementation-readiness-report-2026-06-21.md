---
stepsCompleted: ['step-01-document-discovery', 'step-02-prd-analysis', 'step-03-epic-coverage-validation', 'step-04-ux-alignment', 'step-05-epic-quality-review', 'step-06-final-assessment']
assessmentScope: 'EPIC-2 (Sprint 2) + EPIC-3 (Sprint 3) — praca przyszła (TODO). EPIC-1 = ukończony fundament (oceniony i zremediowany w przebiegu wcześniejszym).'
documentsIncluded:
  prd: '_bmad-output/planning-artifacts/PRD.md'
  architecture: '_bmad-output/planning-artifacts/architecture.md'
  epics: '_bmad-output/planning-artifacts/epics.md'
  ux: null
  supporting:
    - '_bmad-output/planning-artifacts/product-brief.md'
    - '_bmad-output/planning-artifacts/sprint-2.md'
    - '_bmad-output/planning-artifacts/sprint-3.md'
uxAssessment: skipped-by-user
overallReadiness: 'READY — M1–M3 RESOLVED (remediacja 2026-06-21); pozostają Minory + OQ2–OQ4 do potwierdzenia w spike'
remediation: 'M1 (FR19–FR32 + NFR8 w PRD), M2 (architektura §8 storage/deploy), M3 (reguła capacity przy cancelled w AC SPIKE-S2/S2.7) — wykonane'
---

# Implementation Readiness Assessment Report

**Date:** 2026-06-21
**Project:** od-sasiada.pl
**Zakres tej oceny:** EPIC-2 (Sprint 2 — okna dostawy + powiadomienia) i EPIC-3 (Sprint 3 — media + kategorie), oba `☐ TODO`. EPIC-1 jest GOTOWE i był oceniony/zremediowany w przebiegu wcześniejszym — tu traktowany jako stabilny fundament.

> Uwaga: ten plik nadpisał wcześniejszy raport (ocena EPIC-1). Wnioski EPIC-1 (READY, M1–M3 RESOLVED) pozostają w mocy i są tu streszczone w sekcji „Fundament".

## Step 1: Document Inventory

| Typ | Plik | Format | Status |
|-----|------|--------|--------|
| PRD | `planning-artifacts/PRD.md` | whole | ✅ Included |
| Architecture | `planning-artifacts/architecture.md` | whole | ✅ Included |
| Epics & Stories | `planning-artifacts/epics.md` | whole | ✅ Included |
| Sprint 2 (EPIC-2) | `planning-artifacts/sprint-2.md` | whole | ✅ Included (główny przedmiot oceny) |
| Sprint 3 (EPIC-3) | `planning-artifacts/sprint-3.md` | whole | ✅ Included (główny przedmiot oceny) |
| Product Brief | `planning-artifacts/product-brief.md` | whole | ℹ️ Context |
| UX Design | — | — | ⚠️ Missing — pominięte decyzją użytkownika |

**Duplikaty:** brak. **Wersje shardowane:** brak.

### Fundament (EPIC-1 — kontekst, nie przedmiot oceny)

EPIC-1 GOTOWE (9/9: S1.0–S1.7 + SPIKE-A). Zbudowane i wykorzystywane przez S2/S3: izolacja multi-tenant (panel/API/front), Products+Variants (model „porcji"), katalog `/[tenant]`, serwerowy koszyk `Carts`, checkout gotówkowy + `orderNumber` + snapshot pozycji/adresu, auth klientów, maszyna stanów `order-status.ts`, hooki `orders.ts`, `order-emails.ts` z **`sendStatusChange` już podpiętym** w `afterChange`, `cart-validation.ts` jako jedyne źródło prawdy walidacji.

---

## Step 2: PRD Analysis (zakres EPIC-2 / EPIC-3)

> ⚠️ Ustalenie kluczowe: **PRD nie zawiera wymagań na poziomie FR dla EPIC-2/EPIC-3.** §5 opisuje je jednym zdaniem każdy, a §6 wymienia część jako „poza zakresem MVP". Faktyczne, zablokowane wymagania żyją w `sprint-2.md` (decyzje O1–O8) i `sprint-3.md` (decyzje D1–D7), powiązane z PRD wyłącznie przez `epics.md`. Poniższe FR-y zostały **wyprowadzone** z decyzji + historii sprintów (nie zacytowane z PRD).

### Wymagania funkcjonalne — EPIC-2 (wyprowadzone)

- **FR-S2.1** — Predefiniowane stałe okna dostawy per tenant; klient wybiera z listy (O1). [S2.1, S2.2]
- **FR-S2.2** — Cutoff jako stała godzina dzienna (`cutoffTime`), walidowany serwerowo (O2). [S2.3]
- **FR-S2.3** — Dedykowana kolekcja multi-tenant `DeliverySlots` (nie pole w `settings`) (O3). [S2.1]
- **FR-S2.4** — Limit miejsc (capacity) per slot, walidowany serwerowo i **odporny na wyścig** (O4). [S2.7]
- **FR-S2.5** — Wyjątki dni: dostawca oznacza daty niedostępne, wykluczane ze slotów (O7). [S2.8]
- **FR-S2.6** — Wybrany slot zrzucony jako snapshot do zamówienia; widoczny panel + front + mail (B1-style). [S2.4]
- **FR-S2.7** — Maile statusowe: tylko milestone'y wprzód (`confirmed/out_for_delivery/delivered/cancelled`), bez spamu przy cofnięciu; treść PL; best-effort (O5/O6, NFR4). [S2.5, S2.6]
- **FR-S2.8** — Slot wymagany, gdy tenant ma skonfigurowane okna; brak okien → feature wyłączony, checkout jak dziś (O8). [S2.2, S2.3]

### Wymagania funkcjonalne — EPIC-3 (wyprowadzone)

- **FR-S3.1** — Kolekcja `Media` (Upload) per-tenant; storage **Vercel Blob**; `sharp` rozmiary; `alt` (D1). [S3.1]
- **FR-S3.2** — Pojedyncze hero na produkcie **oraz** na wariancie; fallback wariant→produkt→placeholder (D2, D3, D6). [S3.2, S3.3]
- **FR-S3.3** — Render zdjęcia na katalogu `/[tenant]` + szczegół zamówienia (panel + front); `next/image`. [S3.3]
- **FR-S3.4** — Kolekcja `Categories` per-tenant; relacja produkt↔kategoria **`hasMany`** (D4, D5, D7). [S3.4]
- **FR-S3.5** — CRUD kategorii w panelu, tenant-scoped (out-of-the-box + weryfikacja izolacji). [S3.5]
- **FR-S3.6** — Filtr po kategorii na katalogu, server-side (`?kategoria=`), z `tenant` zawsze w `where`. [S3.6]

### Wymagania niefunkcjonalne istotne dla S2/S3

- **NFR1 (izolacja)** — `DeliverySlots`, `Media`, `Categories` muszą być tenant-scoped; URL bloba **nie może przeciekać** cross-tenant (R-S3.2).
- **NFR2 (integralność)** — capacity/cutoff walidowane serwerowo, klientowi się nie ufa (reuse zasady z `cart-validation.ts`).
- **NFR3 (trwałość)** — slot snapshotowany do zamówienia (odporny na zmianę configu).
- **NFR4 (odporność)** — maile best-effort (dotyczy S2.5/S2.6).
- **NFR5 (lokalizacja)** — treści maili i etykiety statusów do PL (dziś po ang.).
- **NFR6 (hydratacja Turbopack)** — sloty liczone serwerowo i podane do `CartView` (client) — ryzyko granicy `'use server'` (R-S2.5).
- **⚠️ Luka NFR** — brak NFR wydajności frontu, mimo że S3.3 jawnie podnosi ryzyko LCP/transferu przy zdjęciach katalogu (R-S3.3). Brak też NFR usability/a11y/responsywności (sklep konsumencki).

### Ocena kompletności PRD (dla S2/S3)

- ✅ Decyzje O1–O8 / D1–D7 są jawne, zablokowane i uzasadnione — solidna podstawa do implementacji.
- ✅ AC w sprintach konkretne i testowalne; ryzyka nazwane z mitygacją.
- ⚠️ **PRD nie odzwierciedla poszerzenia zakresu**: capacity (O4), wyjątki dni (O7), zdjęcia na wariancie (D3), multi-kategoria (D4), Vercel Blob/deploy=Vercel (D1) **nie istnieją w PRD ani w architekturze** — żyją tylko w sprintach. (→ M1)
- ⚠️ Brak dokumentu UX dla nietrywialnego UI (wybór slotu z dostępnością/cutoffem, upload/galeria, filtr kategorii).

---

## Step 3: Epic Coverage Validation

> `epics.md` linkuje EPIC-2/3 do sprintów i wylicza historie — traceability epik→sprint jest zachowana. Poniżej mapowanie wyprowadzonych FR → historia.

### Coverage Matrix — EPIC-2

| FR | Skrót | Pokrycie | Status |
|----|-------|----------|--------|
| FR-S2.1 | Stałe okna, wybór z listy | S2.1, S2.2 | ✅ Covered |
| FR-S2.2 | Cutoff dzienny, walidacja serwerowa | S2.3 | ✅ Covered |
| FR-S2.3 | Kolekcja `DeliverySlots` multi-tenant | S2.1 (+ SPIKE-S2 kształt) | ✅ Covered |
| FR-S2.4 | Capacity per slot, race-safe | S2.7 (+ SPIKE-S2 podejście) | ✅ Covered |
| FR-S2.5 | Wyjątki dni | S2.8 | ✅ Covered |
| FR-S2.6 | Snapshot slotu, panel+front+mail | S2.4 | ✅ Covered |
| FR-S2.7 | Maile milestone, anty-spam, PL | S2.5, S2.6 | ✅ Covered |
| FR-S2.8 | Slot wymagany/feature-off | S2.2, S2.3 | ✅ Covered |

### Coverage Matrix — EPIC-3

| FR | Skrót | Pokrycie | Status |
|----|-------|----------|--------|
| FR-S3.1 | `Media` per-tenant, Vercel Blob | S3.1 (+ SPIKE-S3) | ✅ Covered |
| FR-S3.2 | Hero produkt+wariant, fallback | S3.2, S3.3 | ✅ Covered |
| FR-S3.3 | Render katalog + zamówienie | S3.3 | ✅ Covered |
| FR-S3.4 | `Categories` per-tenant, hasMany | S3.4 | ✅ Covered |
| FR-S3.5 | CRUD kategorii tenant-scoped | S3.5 | ✅ Covered |
| FR-S3.6 | Filtr po kategorii server-side | S3.6 | ✅ Covered |

### Missing Requirements

- **Brak FR bez ścieżki implementacji** — każda wyprowadzona możliwość ma historię.
- **FR „odwrotne" (w sprintach, brak w PRD/architekturze):** capacity (S2.7), wyjątki dni (S2.8), zdjęcia wariantu (S3.2), multi-kategoria (S3.4), storage Vercel Blob (S3.1) — istnieją w sprintach, **brak w PRD i architekturze**. To nie scope creep niekontrolowany (decyzje są zablokowane), ale **dryf dokumentacji** osłabiający traceability na poziomie PRD/architektury. (→ M1, M2)

### Coverage Statistics

- Wyprowadzone FR (S2+S3): **14** · Pokryte historią: **14** → **100%** pokrycia na poziomie sprintu.
- Pokrycie na poziomie **PRD**: ✅ **po remediacji M1** — FR enumerowane w PRD jako **FR19–FR26 (EPIC-2)** i **FR27–FR32 (EPIC-3)** z mapowaniem na historie + linki do sprintów; dodano **NFR8** (wydajność frontu).

---

## Step 4: UX Alignment Assessment

### UX Document Status

**❌ Not Found** — ocena UX **pominięta decyzją użytkownika** (potwierdzone na starcie).

### Warnings (mimo pominięcia — istotne dla tych dwóch sprintów)

- ⚠️ **S2/S3 są UI-cięższe niż EPIC-1.** Nietrywialny UI bez specyfikacji:
  - **Wybór slotu (S2.2):** lista dostępnych slotów liczona serwerowo (cutoff + wyjątki + capacity), stany: brak slotów (feature off), slot pełny/zamknięty znika, błąd „slot właśnie się zapełnił" (wyścig S2.7). To logika prezentacji z wieloma stanami brzegowymi — bez makiety ryzyko niespójnego UX.
  - **Upload/galeria (S3.1/S3.3):** admin Payload daje upload out-of-the-box (OK), ale render na froncie (placeholder, fallback wariant→produkt, LCP) nie ma specyfikacji wizualnej.
  - **Filtr kategorii (S3.6):** UX listy kategorii, stan „wszystkie/nieprzypisane", nieznana kategoria.
- ⚠️ **Brak NFR usability/a11y/responsywność** — sklep konsumencki, klienci mobilni; brak jakiegokolwiek wymagania.
- ✅ **Architektura wspiera** implikowane potrzeby UI (App Router per-tenant, akcje serwerowe, izolacja odczytu) — luka jest po stronie specyfikacji UX, nie wykonalności.
- ℹ️ Rekomendacja: lekki dokument UX dla wyboru slotu (najwięcej stanów) przed S2.2; minimalne wireframe katalogu ze zdjęciami/filtrem przed S3.3/S3.6.

---

## Step 5: Epic Quality Review (S2 + S3 wg best practices)

> Standard: create-epics-and-stories (wartość użytkownika, niezależność epików, brak zależności do przodu, sizing, jakość AC, traceability). Oba epiki `☐ TODO` — to przegląd PRZED implementacją (w przeciwieństwie do EPIC-1).

### Best Practices Compliance Checklist

| Kryterium | EPIC-2 | EPIC-3 |
|---|---|---|
| Epic dostarcza wartość użytkownika | ✅ „wiem kiedy dojedzie + co się dzieje" | ✅ „widzę zdjęcia + filtruję po kategoriach" |
| Epic niezależny (nie wymaga przyszłego) | ✅ zależy tylko od EPIC-1 | ✅ zależy tylko od EPIC-1 |
| Historie zwymiarowane | ✅ S/M/L sensownie (S2.1 L uzasadnione O3) | ✅ S/M sensownie |
| Brak zależności do przodu | ✅ (analiza niżej) | ✅ (analiza niżej) |
| Tabele/kolekcje gdy potrzebne | ✅ SPIKE→kolekcja→UI→walidacja | ✅ SPIKE→kolekcja→relacja→render |
| Jasne AC | ✅ konkretne/testowalne (nie G/W/T) 🟡 | ✅ konkretne/testowalne (nie G/W/T) 🟡 |
| Traceability do FR | 🟡 do sprintu OK, do PRD brak (M1) | 🟡 do sprintu OK, do PRD/architektury brak (M1/M2) |

### Dependency Analysis

**EPIC-2** — kolejność `SPIKE-S2 → S2.1 → S2.8 → S2.2 → S2.3 → S2.7 → S2.4 → S2.5 → S2.6` (S2.9 PARK):

| Historia | Zależność | Kierunek | Werdykt |
|---|---|---|---|
| SPIKE-S2 | — | — | ✅ |
| S2.1 | SPIKE-S2 | wstecz | ✅ |
| S2.8 | S2.1 | wstecz | ✅ |
| S2.2 | S2.1, S2.8 | wstecz | ✅ |
| S2.3 | S2.2 | wstecz | ✅ |
| S2.7 | S2.3 | wstecz | ✅ |
| S2.4 | S2.7 | wstecz | ✅ |
| S2.5 | S1.5 (istnieje) | wstecz | ✅ |
| S2.6 | S2.4, S2.5 | wstecz | ✅ |

**EPIC-3** — kolejność `SPIKE-S3 → S3.1 → S3.2 → S3.3 → S3.4 → S3.5 → S3.6`:

| Historia | Zależność | Kierunek | Werdykt |
|---|---|---|---|
| SPIKE-S3 | — | — | ✅ |
| S3.1 | SPIKE-S3 | wstecz | ✅ |
| S3.2 | S3.1 | wstecz | ✅ |
| S3.3 | S3.2 | wstecz | ✅ |
| S3.4 | — (równolegle do S3.1) | — | ✅ |
| S3.5 | S3.4 | wstecz | ✅ |
| S3.6 | S3.4, S3.3 | wstecz | ✅ |

**Brak zależności do przodu i brak cykli w obu epikach.** ✅ Oba epiki są niezależne (zależą tylko od ukończonego EPIC-1).

### 🔴 Critical Violations

- **Brak.** Żadnego epiku technicznego bez wartości, żadnej zależności do przodu, żadnej historii rozmiaru epiku. Oba spike'i poprawnie oznaczone i wiążą realne ryzyka.

### 🟠 Major Issues — wszystkie ✅ RESOLVED (remediacja 2026-06-21)

- **M1 — Dryf PRD: poszerzony zakres S2/S3 nie istnieje w PRD.** Capacity (O4/S2.7), wyjątki dni (O7/S2.8), zdjęcia wariantu (D3/S3.2), multi-kategoria (D4/S3.4) to istotne wymagania funkcjonalne podjęte w sprintach, ale PRD §5 opisuje EPIC-2/3 jednozdaniowo, a §6 nie wspomina o capacity/wyjątkach/wariancie/multi-kat. → Implementacja będzie sterowana wyłącznie sprintami; PRD przestaje być źródłem prawdy o zakresie. **Działanie:** dopisać do PRD §3/§5 wyprowadzone FR-S2.*/FR-S3.* (lub jawnie zaznaczyć, że dla EPIC-2/3 źródłem FR są sprinty + linki). → **✅ RESOLVED:** PRD §3 ma tabele **FR19–FR26 (EPIC-2)** i **FR27–FR32 (EPIC-3)** z mapowaniem na historie + linki do sprintów; §5 rozszerzone o capacity/wyjątki/wariant/multi-kategoria; dodano **NFR8**.
- **M2 — Architektura nie pokrywa storage/deployu wymaganego przez EPIC-3.** D1 wprowadza **Vercel Blob** (`@payloadcms/storage-vercel-blob`, `BLOB_READ_WRITE_TOKEN` via Vercel Marketplace) i **cel deploy = Vercel** — `architecture.md` nie ma sekcji storage ani deploymentu, a §1 (stack) i §7 (pułapki) o tym milczą. To decyzja architektoniczna + zależność infra/koszt żyjąca tylko w sprincie. **Działanie:** dodać do `architecture.md` sekcję „Storage/Media + deployment" (adapter, ENV, izolacja serwowania blobów) — choćby po SPIKE-S3. → **✅ RESOLVED:** dodano **§8 „Storage mediów i deployment"** (Vercel Blob, `BLOB_READ_WRITE_TOKEN`, izolacja serwowania, deploy=Vercel, NFR8) + wiersze w §1 (stack) i §7 (pułapka efemeryczny FS); oznaczone „do potwierdzenia w SPIKE-S3".
- **M3 — Spójność licznika capacity przy `cancelled` nierozstrzygnięta.** `sprint-2.md` (S2.7 + R-S2.7) mówi „zwolnienie miejsca [przy cancelled] **rozważyć w SPIKE-S2**" — czyli reguła, czy anulowane zamówienie oddaje miejsce w slocie, jest otwarta. Bez decyzji: albo sloty „zatkają się" anulacjami (utracona pojemność), albo podwójna rezerwacja po reaktywacji `cancelled→new`. To dotyka poprawności rdzeniowej funkcji S2. **Działanie:** podnieść z „rozważyć" do **jawnego AC SPIKE-S2 + S2.7** (decyzja: czy/kiedy licznik jest dekrementowany przy `cancelled` i ponownie inkrementowany przy reaktywacji). → **✅ RESOLVED (reguła ZATWIERDZONA, OQ1):** licznik = liczba aktywnych (niezanulowanych) zamówień; `cancelled` **zwalnia** miejsce; `cancelled→new` **re-waliduje** capacity i odrzuca, gdy pełny. Wpisane do AC SPIKE-S2 i S2.7; R-S2.7 zaktualizowane (już nie „rozważyć").

### 🟡 Minor Concerns

- **m1 — AC nie w formacie Given/When/Then** (spójne z całym projektem — styl listy kontrolnej; testowalne).
- **m2 — Framing S2.5 zaniża pracę.** Historia brzmi „klient chce dostawać maila", ale `sendStatusChange` **już wysyła na każdej zmianie** (ang. stub) — realna praca to *zawężenie* (milestone'y, idempotencja, anty-spam) + PL-izacja, nie „dodanie maili". Warto przeformułować, by dev nie zaczął od zera.
- **m3 — Brak historii setupu integracji Vercel/ENV.** D1 zakłada integrację Vercel Marketplace + `BLOB_READ_WRITE_TOKEN`; SPIKE-S3 to weryfikuje, ale konfiguracja środowiska/sekretów nie ma własnej pozycji (brownfield — akceptowalne, ale odnotować).
- **m4 — Brak NFR wydajności frontu** mimo jawnego R-S3.3 (LCP/transfer zdjęć). → **✅ RESOLVED:** dodano **NFR8** (PRD §4 + architektura §8).
- **m5 — `cancelled` a zwolnienie pojemności** (powiązane z M3) — → **✅ rozstrzygnięte przy M3:** decyzja „**zwalniamy**" (licznik = aktywne zamówienia); nie jest to kompromis typu B2. Zostaje tylko ewentualne odnotowanie reguły w architekturze jako Minor opcjonalny.
- **m2/m3 pozostają otwarte** (opcjonalne): przeformułować historię S2.5 (to *zawężenie* over-firing hooka, nie zielona łąka) oraz rozważyć osobną pozycję na setup ENV/Vercel.

### Mocne strony (warte odnotowania)

- ✅ **Silne de-ryzykowanie spike'ami:** SPIKE-S2 wiąże strefę czasową/cutoff + współbieżność capacity; SPIKE-S3 wiąże izolację bloba + adapter. Trudne rzeczy są z przodu kolejności.
- ✅ **Reuse zasad z EPIC-1:** serwerowa walidacja (`cart-validation.ts`), snapshot (B1), best-effort maile (NFR4), czysty moduł dla granicy hydratacji (NFR6) — konsekwentnie przeniesione.
- ✅ **Jawne „Poza sprintem/PARK"** w obu sprintach — kontrola zakresu (S2.9, galeria, hierarchia kategorii) świadomie odłożona.

---

## Summary and Recommendations

### Overall Readiness Status

**✅ READY** — po remediacji 2026-06-21 wszystkie 3 issues Major zamknięte (dryf PRD → FR19–FR32 + NFR8; storage/deploy → architektura §8; pojemność przy `cancelled` → reguła w AC SPIKE-S2/S2.7). Brak blokerów krytycznych; struktura epików/historii zdrowa (100% pokrycia, brak zależności do przodu, dobre de-ryzykowanie spike'ami). Pozostają wyłącznie Minory + OQ2–OQ4 do potwierdzenia w fazie spike. Można startować SPIKE-S2 / SPIKE-S3.

### Critical Issues Requiring Immediate Action

- **Brak issue krytycznych (🔴).** Nic nie blokuje rozpoczęcia SPIKE-S2/SPIKE-S3.

### Major Issues (🟠) — status po remediacji (✅ wszystkie RESOLVED)

1. **M1 — FR EPIC-2/3 w PRD.** → **✅ RESOLVED:** PRD §3 ma FR19–FR26 (EPIC-2) + FR27–FR32 (EPIC-3) z mapowaniem na historie + linki; §5 rozszerzone; dodano NFR8.
2. **M2 — Storage/deploy w architekturze.** → **✅ RESOLVED:** architektura §8 (Vercel Blob, ENV, izolacja serwowania, deploy=Vercel) + §1/§7; oznaczone „do potwierdzenia w SPIKE-S3".
3. **M3 — Pojemność przy `cancelled`/reaktywacji.** → **✅ RESOLVED:** reguła „zwalniamy + re-walidacja przy reaktywacji" w AC SPIKE-S2 i S2.7; R-S2.7 zaktualizowane.

### Recommended Next Steps

1. **SPIKE-S2 najpierw** — AC: matematyka cutoffu (Europe/Warsaw + DST), kształt `DeliverySlots`, model wyjątków dni, strategia współbieżności capacity + **ścieżka spójności licznika** (reguła `cancelled` już zatwierdzona — spike domyka implementację).
2. **SPIKE-S3 najpierw** — potwierdzić Vercel Blob + brak przecieku URL cross-tenant; **wynik wlać do architektury §8** (zdjąć „do potwierdzenia").
3. **(opcjonalnie) Przeformułować S2.5** (m2) — zaznaczyć, że to zawężenie over-firing hooka.
4. **(opcjonalnie) Osobna pozycja na setup ENV/Vercel Marketplace** (m3).
5. **(opcjonalnie) Minimalny UX wyboru slotu** przed S2.2 (najwięcej stanów brzegowych) — OQ4.

### Open Questions (pozostałe)

- ✅ ~~**OQ1 (M3):** reguła capacity przy `cancelled`/reaktywacji~~ — **ROZSTRZYGNIĘTE:** zwalniamy miejsce; `cancelled→new` re-waliduje.
- **OQ2 (M1):** *(zaadresowane)* — PRD zaktualizowany o FR19–FR32; pozostaje preferencja, czy w przyszłości trzymać FR przyszłych epików w PRD, czy tylko linkować sprinty.
- **OQ3 (M2):** Architektura §8 wpisana jako założenie D1 z „do potwierdzenia w SPIKE-S3" — potwierdzić/zaktualizować po spike'u.
- **OQ4 (UX):** Czy przed S2.2 powstanie szkic UX wyboru slotu, czy implementujemy z samych AC?

### Final Note

Ocena S2/S3 wykryła pierwotnie **8 problemów** (0 krytycznych, **3 Major**, **5 Minor**) + pominięty z wyboru dokument UX. **Wszystkie 3 Major + m4/m5 zostały zamknięte w remediacji 2026-06-21.** Status: **READY** — można startować SPIKE-S2 / SPIKE-S3. Pozostają opcjonalne Minory (m2/m3) i decyzje OQ3/OQ4 do potwierdzenia w fazie spike. Struktura epików jest mocna (100% pokrycia, brak zależności do przodu).

---

## Remediation Log (2026-06-21)

| Issue | Decyzja | Działanie | Artefakty |
|---|---|---|---|
| **Reorg** | Konsolidacja artefaktów | `sprint-1/2/3.md` przeniesione `docs/ → planning-artifacts/`; linki w `epics.md` i raporcie zaktualizowane | `planning-artifacts/sprint-{1,2,3}.md`, `epics.md` |
| **M1** | Dopisać FR do PRD | FR19–FR26 (EPIC-2) + FR27–FR32 (EPIC-3) z mapowaniem na historie + linki; §5 rozszerzone; dodano NFR8 | `PRD.md` |
| **M2** | Sekcja storage/deploy | Architektura §8 (Vercel Blob, `BLOB_READ_WRITE_TOKEN`, izolacja serwowania, deploy=Vercel) + §1/§7; „do potwierdzenia w SPIKE-S3" | `architecture.md` |
| **M3** | Reguła capacity (OQ1) | „zwalniamy przy `cancelled` + re-walidacja przy `cancelled→new`"; AC SPIKE-S2 i S2.7; R-S2.7 zaktualizowane | `sprint-2.md` |
| **m4** | Dodać NFR perf | NFR8 (next/image + sharp + lazy, LCP) | `PRD.md`, `architecture.md` |

**Stan po remediacji:** Major 3/3 ✅ RESOLVED · Critical 0 · m4/m5 zamknięte · pozostają opcjonalne m2/m3 + OQ3/OQ4. Zmiany w drzewie roboczym, niezacommitowane.

---

**Assessor:** Claude (rola: Product Manager — requirements traceability)
**Data:** 2026-06-21 (ocena) · 2026-06-21 (remediacja M1–M3 + reorg)
**Zakres:** EPIC-2 (Sprint 2) + EPIC-3 (Sprint 3) · EPIC-1 = fundament (READY, oceniony wcześniej)
**Język oceny:** Polski · **UX:** pominięte decyzją użytkownika
