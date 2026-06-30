---
stepsCompleted: ['step-01-document-discovery', 'step-02-prd-analysis', 'step-03-epic-coverage-validation', 'step-04-ux-alignment', 'step-05-epic-quality-review', 'step-06-final-assessment']
status: complete
documentsIncluded:
  prd: '_bmad-output/planning-artifacts/PRD.md'
  architecture: '_bmad-output/planning-artifacts/architecture.md'
  epics: '_bmad-output/planning-artifacts/epics.md'
  productBrief: '_bmad-output/planning-artifacts/product-brief.md'
  ux: '_bmad-output/ux/ (index.md + 7 docs)'
---

# Implementation Readiness Assessment Report

**Date:** 2026-06-30
**Project:** od-sasiada.pl

## Document Inventory

| Typ dokumentu | Format | Ścieżka | Status |
|---------------|--------|---------|--------|
| PRD | Whole (10K) | `_bmad-output/planning-artifacts/PRD.md` | ✅ |
| Architecture | Whole (11K) | `_bmad-output/planning-artifacts/architecture.md` | ✅ |
| Epics & Stories | Whole (11K) | `_bmad-output/planning-artifacts/epics.md` | ✅ |
| UX Design | Sharded (8 plików) | `_bmad-output/ux/index.md` + 7 | ✅ |
| Product Brief | Whole (6.5K) | `_bmad-output/planning-artifacts/product-brief.md` | ✅ (kontekst) |

**Duplikaty:** brak (każdy dokument w jednym formacie).
**Brakujące dokumenty:** brak wymaganych.

## PRD Analysis

### Functional Requirements (32)

**EPIC-1 — Fundament workflow dostawcy (FR1–FR18):**

- **FR1**: Platforma wielotenantska — izolacja w panelu, Local API i froncie; dostawca widzi tylko własne dane. (SPIKE-A, S1.4)
- **FR2**: Katalog model Produkt + Wariant „porcja"; cena w groszach. (S1.1)
- **FR3**: Katalog/witryna per-tenant pod `/[tenant]`; publicznie tylko **opublikowane** produkty. (bazowy)
- **FR4**: Klienci rejestracja/logowanie/wylogowanie (`customers`); klient u dostawcy A anonimowy u B. (S1.0)
- **FR5**: Reset hasła e-mailem. (S1.7)
- **FR6**: Koszyk serwerowy (`carts`), jeden otwarty per klient+tenant, trwały między sesjami. (S1.2)
- **FR7**: Checkout wymaga logowania (gość poza zakresem). (S1.2)
- **FR8**: Ceny pozycji i tenant walidowane serwerowo przy add-to-cart i checkoucie; cena z klienta nigdy niezaufana. (S1.2)
- **FR9**: Checkout = płatność przy odbiorze; zamówienie przez Local API. (S1.2)
- **FR10**: Numer zamówienia `ZAM-RRRR-NNNNN` generowany przy tworzeniu. (nadpisanie)
- **FR11**: Snapshot pozycji (nazwa, etykieta wariantu, cena jednostkowa) odporny na zmiany. (nadpisanie)
- **FR12**: Adres dostawy wybrany/wprowadzony i zapisany w zamówieniu. (S1.3)
- **FR13**: CRUD adresów dostawy (pola PL; kod `^\d{2}-\d{3}$`). (S1.3)
- **FR14**: Automat stanów `new→confirmed→preparing→out_for_delivery→delivered`, `cancelled` z każdego niedostarczonego, reaktywacja `cancelled→new`; niedozwolone odrzucane. (S1.5)
- **FR15**: Dostawca widzi tylko własne zamówienia, filtr po statusie, sort wg daty; `update` tenant-scoped. (S1.4, SPIKE-A)
- **FR16**: Pełne szczegóły zamówienia w panelu (edytowalny status) i read-only na froncie `/[tenant]/moje-zamowienia/[id]`, izolacja tenant+klient. (S1.6)
- **FR17**: E-mail potwierdzający zamówienie; hook `sendStatusChange` istnieje na przyszłość; błędy logowane, nie blokują. (S1.7, S1.5)
- **FR18**: „Moje zamówienia" + zamów ponownie (zapis pozycji do koszyka serwerowego). (S1.2)

**EPIC-2 — Okna dostawy i powiadomienia (FR19–FR26):**

- **FR19**: Predefiniowane stałe okna dostawy per tenant; klient wybiera z listy. (S2.1, S2.2)
- **FR20**: Cutoff jako stała godzina (`cutoffTime`), walidacja serwerowa; slot po cutoffie/przeszły odrzucany. (S2.3)
- **FR21**: Okna w dedykowanej kolekcji multi-tenant `DeliverySlots` (nie w `tenant.settings`). (S2.1)
- **FR22**: Limit miejsc (capacity) per slot; walidacja odporna na wyścig; pełny slot znika. (S2.7)
- **FR23**: Wyjątki dni (daty niedostępne) wykluczane. (S2.8)
- **FR24**: Wybrany slot snapshotowany do zamówienia; widoczny w panelu/froncie/mailu. (S2.4)
- **FR25**: Maile statusowe tylko na milestone'ach wprzód, bez spamu przy cofnięciu; PL. (S2.5, S2.6)
- **FR26**: Slot wymagany gdy tenant ma okna; brak okien → feature off, checkout jak dziś. (S2.2, S2.3)

**EPIC-3 — Media i kategorie (FR27–FR32):**

- **FR27**: Kolekcja `Media` (Upload) per-tenant; Vercel Blob; `sharp`; `alt` wymagane. (S3.1)
- **FR28**: Hero na produkcie i wariancie; fallback wariant→produkt→placeholder; opcjonalne. (S3.2, S3.3)
- **FR29**: Render zdjęcia na katalogu i w szczegółach zamówienia, `next/image`. (S3.3)
- **FR30**: Kolekcja `Categories` per-tenant; relacja produkt↔kategoria `hasMany`; opcjonalna. (S3.4)
- **FR31**: CRUD kategorii w panelu, tenant-scoped. (S3.5)
- **FR32**: Filtr po kategorii na katalogu, server-side (`?kategoria=`), `tenant` zawsze w `where`. (S3.6)

**Total FRs: 32**

### Non-Functional Requirements (8)

- **NFR1** (Bezpieczeństwo): Izolacja tenantów — brak cross-tenant read/write zamówień/katalogu/koszyków/klientów/adresów; odczyty front `overrideAccess: true` + ręczny `where { customer, tenant }`; cross-tenant → puste/403/404; regresja `orders-tenant-isolation`.
- **NFR2** (Integralność cen): wartości w groszach (int); jedno źródło prawdy `cart-validation.ts` współdzielone przez koszyk i `placeOrder`; cena klienta niezaufana.
- **NFR3** (Trwałość danych): snapshoty pozycji i numer zamówienia trwają niezależnie od edycji/usunięć katalogu.
- **NFR4** (Odporność): e-maile transakcyjne best-effort — błędy SMTP łapane i logowane, nie psują operacji zamówienia.
- **NFR5** (Lokalizacja): witryna i admin PL (`i18n` fallback `pl`); waluta PLN `zł`.
- **NFR6** (Hydratacja Next 16 + Turbopack): pliki `'use server'` importowane przez klienta muszą importować `next/headers` bezpośrednio i nie być podwójnie importowane — unik cichej awarii hydratacji.
- **NFR7** (Dev env): Postgres w jednorazowym Docker (`postgres:17`, `od-sasiada-pg`), nie Homebrew.
- **NFR8** (Wydajność katalogu EPIC-3): `next/image` + warianty `sharp` + lazy-load; LCP listy produktów mierzony i kontrolowany.

**Total NFRs: 8**

### Additional Requirements / Constraints

- **Poza zakresem (backlog):** koszyk/checkout gościa; e-mail klienta per-tenant (obecnie globalnie unikalny); korekta wagi przy dostawie; łączenie gość→konto; SMS; fakturowanie operatora/subskrypcja; pełne RODO/GDPR.
- **Ryzyka (R1–R3):** brak e-maili (mitygacja S1.7); izolacja tenantów przy `update` (SPIKE-A regresja); migracja koszyka serwerowego (rdzeń `cart-validation.ts`).
- **Persony:** Operator (`platform-admin`), Dostawca (tenant/admin), Klient (`customers` z auth, 1 tenant).

### PRD Completeness Assessment

- ✅ FR/NFR jasno ponumerowane i zmapowane do historyjek (kolumna „Historyjka").
- ✅ Struktura epików (EPIC-1/2/3) spójna z sekcją 5 i tabelami FR.
- ✅ Backlog/poza-zakresem oraz ryzyka udokumentowane.
- ⚠️ Drobny błąd formatowania: `NFR5` ma niezamknięty bold (`**NFR5 |` zamiast `**NFR5** |`) — kosmetyka, nie wpływa na treść.
- ⚠️ PRD „odtworzony po Sprint 1" — EPIC-1 oznaczony GOTOWE; ocena gotowości dotyczy głównie EPIC-2/EPIC-3 (do potwierdzenia w krokach pokrycia epików).

## Epic Coverage Validation

### Coverage Matrix

| FR | Wymaganie (skrót) | Pokrycie w epikach | Status |
|----|-------------------|--------------------|--------|
| FR1 | Multi-tenant izolacja | EPIC-1 / SPIKE-A, S1.4 | ✅ |
| FR2 | Produkt + Wariant „porcja", grosze | EPIC-1 / bazowy + S1.1 | ✅ |
| FR3 | Katalog per-tenant, tylko opublikowane | EPIC-1 / bazowy | ✅ |
| FR4 | Rejestracja/login/logout klienta | EPIC-1 / S1.0 | ✅ |
| FR5 | Reset hasła e-mail | EPIC-1 / S1.7 | ✅ |
| FR6 | Koszyk serwerowy `carts` | EPIC-1 / S1.2 | ✅ |
| FR7 | Checkout wymaga logowania | EPIC-1 / S1.2 | ✅ |
| FR8 | Walidacja ceny/tenanta serwerowo | EPIC-1 / S1.2 | ✅ |
| FR9 | Płatność przy odbiorze (Local API) | EPIC-1 / S1.2 | ✅ |
| FR10 | Numer zamówienia `ZAM-RRRR-NNNNN` | EPIC-1 / nadpisanie bazowe | ✅ |
| FR11 | Snapshot pozycji zamówienia | EPIC-1 / nadpisanie bazowe | ✅ |
| FR12 | Adres dostawy zapisany w zamówieniu | EPIC-1 / S1.3 | ✅ |
| FR13 | CRUD adresów (pola PL, kod NN-NNN) | EPIC-1 / S1.3 | ✅ |
| FR14 | Automat stanów zamówienia | EPIC-1 / S1.5 | ✅ |
| FR15 | Lista zamówień dostawcy tenant-scoped | EPIC-1 / S1.4, SPIKE-A | ✅ |
| FR16 | Szczegóły zamówienia panel + front | EPIC-1 / S1.6 | ✅ |
| FR17 | E-mail potwierdzenia + hook statusu | EPIC-1 / S1.7, S1.5 | ✅ |
| FR18 | Moje zamówienia + zamów ponownie | EPIC-1 / S1.2 | ✅ |
| FR19 | Stałe okna dostawy per tenant | EPIC-2 / S2.1, S2.2 | ✅ |
| FR20 | Cutoff jako godzina, walidacja serwer | EPIC-2 / S2.3 | ✅ |
| FR21 | Kolekcja `DeliverySlots` | EPIC-2 / S2.1 | ✅ |
| FR22 | Capacity per slot, odporne na wyścig | EPIC-2 / S2.7 | ✅ |
| FR23 | Wyjątki dni | EPIC-2 / S2.8 | ✅ |
| FR24 | Snapshot slotu do zamówienia | EPIC-2 / S2.4 | ✅ |
| FR25 | Maile statusowe na milestone'ach | EPIC-2 / S2.5, S2.6 | ✅ |
| FR26 | Slot wymagany gdy tenant ma okna | EPIC-2 / S2.2, S2.3 | ✅ |
| FR27 | Kolekcja `Media` per-tenant, Vercel Blob | EPIC-3 / S3.1 | ✅ |
| FR28 | Hero produkt+wariant, fallback | EPIC-3 / S3.2, S3.3 | ✅ |
| FR29 | Render zdjęcia katalog + zamówienie | EPIC-3 / S3.3 | ✅ |
| FR30 | Kolekcja `Categories`, relacja `hasMany` | EPIC-3 / S3.4 | ✅ |
| FR31 | CRUD kategorii tenant-scoped | EPIC-3 / S3.5 | ✅ |
| FR32 | Filtr po kategorii server-side | EPIC-3 / S3.6 | ✅ |

### Missing Requirements

**Brak.** Wszystkie 32 FR mają jednoznaczną ścieżkę implementacji (historyjkę lub nadpisanie bazowe).

### Reverse-check (historyjki bez FR w PRD)

- **S2.9** (widok dziennego obłożenia slotów) — oznaczony **PARK**, ulepszenie operacyjne, nie wynika z żadnego FR. ⚠️ Świadomie poza zakresem — OK.
- **SPIKE-A / SPIKE-S2 / SPIKE-S3** — spike'y techniczne (de-ryzykowanie), nie mapują 1:1 na FR — OK.
- FR2/FR3/FR10/FR11 pokryte przez „bazowy"/„nadpisanie" (nie dyskretne S1.x), ale EPIC-1 = ukończony, więc zaimplementowane.

### Coverage Statistics

- **Total PRD FRs:** 32
- **FRs pokryte w epikach:** 32
- **Coverage:** 100%
- **Status epików:** EPIC-1 ✅ ukończony (9/9); EPIC-2 📋 zaplanowany (TODO); EPIC-3 📋 zaplanowany (TODO)

## UX Alignment Assessment

### UX Document Status

**Found** — sharded, 8 plików w `_bmad-output/ux/` (index, design-system, design-tokens, tenant-theming, components, patterns, voice-and-tone, accessibility). Pochodna lustra `design-source/` (źródło prawdy, read-only).

### UX ↔ PRD Alignment

| Obszar UX | FR PRD | Zgodność |
|-----------|--------|----------|
| Catalog / ShopPage / filtr kategorii | FR3, FR32 | ✅ |
| ProductCard, Price (grosze, „zł", sezonowa) | FR2, NFR2, NFR5 | ✅ |
| Koszyk + checkout gotówkowy + Reorder | FR6–FR9, FR18 | ✅ |
| AccountForm / AddressBook (pola PL) | FR12, FR13 | ✅ |
| Orders + StatusBadge (`ORDER_STATUS` ↔ `order-status.ts`) | FR14, FR16, FR18 | ✅ |
| Zdjęcia produktu / fallback tint | FR28, FR29 | ✅ |
| Branding per-tenant / chip sprzedawcy | FR1, FR3 | ✅ |
| Voice & tone PL, WCAG 2.1 AA | NFR5 | ✅ |

### UX ↔ Architecture Alignment

- ✅ Tokeny pieniędzy/`Price` ↔ `formatPLN` (`src/lib/money.ts`) — spójne z architekturą cen (grosze).
- ✅ `[data-tenant]` override akcentu ↔ model wielotenantski; szkielet niezmienny (NFR1 izolacja wizualna).
- ✅ StatusBadge mapuje na centralny automat `order-status.ts` (B3/FR14).

### Alignment Issues / Warnings

⚠️ **W1 — Brak wzorca UI dla wyboru okna dostawy (EPIC-2).** Patterns/components opisują checkout, ale **nie ma** komponentu/wzorca selektora slotu dostawy (FR19/FR22/FR26) — kluczowy nowy element checkoutu w następnym epiku. UX dla EPIC-2 nieudokumentowany. **Rekomendacja:** dodać wzorzec „wybór terminu dostawy" (lista dostępnych slotów, stan „pełny/po cutoffie") przed startem S2.2.

⚠️ **W2 — Badge „Zostało N" / low-stock w UX, a `inventory: false` w architekturze (B2/NFR).** `ProductCard.lowStock` i Alert „mało sztuk" nie mają źródła danych — śledzenie stanu jest wyłączone. **Rekomendacja:** oznaczyć low-stock jako element wyłączony/backlog albo zasilić innym sygnałem; nie implementować bez źródła.

⚠️ **W3 — „Galeria zdjęć" na stronie produktu vs decyzja D2 (jedno hero, galeria → backlog).** Patterns mówią „galeria", architektura/epiki: pojedyncze hero. **Rekomendacja:** ujednolicić — w EPIC-3 jedno hero; galeria poza zakresem.

ℹ️ **W4 (info, nie blokuje) — Design system nie wdrożony do `src/`.** shadcn/ui + Tailwind + tokeny „do wprowadzenia"; `globals.css` ma legacy CSS vars. Migracja = osobne zadanie (`glistening-singing-dove.md`). Funkcjonalnie nie blokuje EPIC-2/3, ale UI tych epików powstanie na legacy tokenach, jeśli migracja nie wyprzedzi.

ℹ️ **W5 (info) — Pole akcentu w kolekcji Tenants to TODO.** Architektura gotowa, dane brak → domyślna terakota. Zgodne między dokumentami (świadomy TODO).

## Epic Quality Review

> Oceniane wg standardów create-epics-and-stories: wartość dla użytkownika, niezależność epików, brak zależności wprzód, rozmiar i kompletność historyjek, jakość AC.

### 🔴 Krytyczne — rozjazd stanu planowania vs implementacji

**C1 — Artefakty planowania są nieaktualne względem rzeczywistego kodu.**
- `epics.md` i `PRD.md §5` opisują **EPIC-2 i EPIC-3 jako „📋 zaplanowany — wszystkie historie ☐ TODO"**.
- Faktycznie **wszystkie historyjki S2.1–S2.8 i S3.1–S3.6 mają `Status: done`**, są zaimplementowane w `src/` (`DeliverySlots.ts`, `DeliveryDateExceptions.ts`, `Categories.ts`, `Media.ts`, `slot-reservation.ts`, `CategoryFilter.tsx`) i **zacommitowane** (m.in. `4859367 S2.7`, `4c3d472 S2.4`, `90fae13 mark Epic 2 done`, `132ee63 category filter + media isolation`, `c5544c8 design-system`). SPIKE-S2/S3 zamknięte.
- **Wpływ:** pytanie „gotowość do startu Fazy 4" jest częściowo bezprzedmiotowe — EPIC-1/2/3 **już zbudowane**. Czytelnik planning-artifacts dostaje mylny obraz statusu.
- **Rekomendacja:** zsynchronizować `epics.md` + `PRD.md §5` ze stanem `implementation-artifacts/stories/*` (oznaczyć EPIC-2/3 jako ukończone) **albo** jednoznacznie wskazać, że źródłem prawdy statusu są pliki historyjek. To defekt traceability, nie kodu.

### 🟠 Istotne

**M1 — UX nie nadążył za zaimplementowanym zakresem (z kroku 4).**
- W1 (selektor okna dostawy), W2 (low-stock vs `inventory:false`), W3 (galeria vs jedno hero) — funkcje zostały zbudowane (S2.2/S2.4, S3.2/S3.3), ale dokumentacja UX ich nie odzwierciedla / lokalnie się z nimi rozjeżdża. Część jest teraz „po fakcie".
- **Rekomendacja:** zaktualizować `ux/patterns.md` o zrealizowany picker slotu; usunąć/oznaczyć low-stock i galerię jako poza zakresem MVP.

### 🟡 Drobne

- **m1** — `PRD.md` NFR5 niezamknięty bold (`**NFR5 |`).
- **m2** — Tytuły epików są feature-/tech-orientowane („Fundament workflow dostawcy", „Media i kategorie"), ale **Cel** każdego epiku jest jednoznacznie user-outcome → akceptowalne.
- **m3** — S2.9 (widok obłożenia) `backlog (PARK)` — spójne między epics.md a plikiem historyjki. OK.

### Zgodność z best-practices (ocena pozytywna)

| Kryterium | Werdykt | Dowód |
|-----------|---------|-------|
| Epiki dostarczają wartość użytkownika | ✅ | Każdy ma „Cel = Cel Sprintu" w kategoriach outcome'u klienta/dostawcy |
| Niezależność epików (N nie wymaga N+1) | ✅ | EPIC-2 i 3 budują na EPIC-1; brak odwołań wprzód |
| Brak zależności wprzód między historyjkami | ✅ | „Zależy od" zawsze wstecz; jawna kolejność budowania per epik |
| Tabele/kolekcje tworzone gdy potrzebne | ✅ | `DeliverySlots` w S2.1, `Categories` w S3.4, `Media` w S3.1 — nie wszystko z góry |
| De-ryzykowanie spike'ami przed budową | ✅ | SPIKE-A/S2/S3 pierwsze w kolejności, zamknięte przed historiami |
| Jakość AC (testowalne, konkretne, błędy) | ✅ | AC numerowane, z PL-komunikatami błędów i **gate'ami testów** (np. R-S2.7 anti-overbooking `Promise.all`) |
| Traceability AC ↔ FR ↔ decyzje | ✅ | Historyjki linkują O1–O8 / D1–D7 / FR i `References:` do źródeł |
| Pokrycie testami / regresje bezpieczeństwa | ✅ | `orders-isolation`, `order-detail-idor`, `delivery-capacity` — zielone w notatkach |

**Wniosek jakościowy:** struktura epików i jakość historyjek są **wysokie** (wzorcowe AC, jawne zależności wstecz, spike'i, gate'y testowe). Jedyny realny problem to **rozjazd statusu w dokumentach planowania (C1)** i wtórny **dług dokumentacji UX (M1)**.

## Summary and Recommendations

### Overall Readiness Status

**READY (z zastrzeżeniem dokumentacyjnym)** — planowanie jest kompletne i spójne *funkcjonalnie*: 32/32 FR pokryte, architektura i UX dopasowane, jakość historyjek wzorcowa. **Ale ocena „gotowości do startu Fazy 4" jest częściowo bezprzedmiotowa: EPIC-1/2/3 są już zaimplementowane i zacommitowane.** Realna praca do zrobienia to **synchronizacja artefaktów planowania ze stanem kodu** + domknięcie długu dokumentacji UX. Brak blokerów kodu.

### Critical Issues Requiring Immediate Action

1. **C1 — Rozjazd statusu (planning vs implementation).** `epics.md` / `PRD.md §5` pokazują EPIC-2/3 jako TODO; faktycznie wszystkie S2.*/S3.* = `done`, w `src/` i w commitach. Mylący obraz statusu dla każdego, kto czyta planning-artifacts.

### Recommended Next Steps

1. **Zsynchronizuj `epics.md` + `PRD.md §5`** ze stanem `implementation-artifacts/stories/*`: oznacz EPIC-2 i EPIC-3 jako ✅ ukończone (status, daty, „X/Y GOTOWE"), tak jak zrobiono dla EPIC-1. Alternatywa: dodaj na górze obu plików notkę „źródłem prawdy statusu są pliki historyjek".
2. **Domknij dług UX (M1 / W1–W3):** dodaj do `ux/patterns.md` zrealizowany picker okna dostawy; oznacz low-stock „Zostało N" jako wyłączone (bo `inventory:false`); ujednolić „galeria → jedno hero (D2)”.
3. **Decyzja o migracji design-system (W4):** potwierdź, czy plan `glistening-singing-dove.md` (tokeny → `globals.css`, shadcn/Tailwind) jest następnym zadaniem — to jedyny istotny niezrealizowany element UI względem dokumentacji UX.
4. **Kosmetyka (m1):** popraw niezamknięty bold `**NFR5` w `PRD.md`.
5. **Opcjonalnie:** zaktualizuj nagłówki „Status: odtworzony 2026-06-20 (po Sprint 1)” w PRD/architecture/epics, bo nie obejmują Sprintów 2–3.

### Final Note

Ocena zidentyfikowała **6 problemów w 3 kategoriach** (1 🔴 krytyczny dokumentacyjny, 2 🟠 istotne UX/sync, 3 🟡 drobne). **Żaden nie jest blokerem kodu** — wszystkie FR pokryte, architektura/UX dopasowane, jakość historyjek i pokrycie testami (z regresjami bezpieczeństwa) wzorcowe. Główne zalecenie: **uspójnić dokumenty planowania ze stanem faktycznym przed kolejną fazą/retrospektywą**, by traceability pozostała wiarygodna.

---

**Data oceny:** 2026-06-30
**Oceniający:** Implementation Readiness workflow (BMAD) — Product Manager
**Artefakty:** PRD.md, architecture.md, epics.md, ux/ (8), implementation-artifacts/stories/ (25)
