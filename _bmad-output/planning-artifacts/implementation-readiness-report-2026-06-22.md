---
stepsCompleted: ['step-01-document-discovery', 'step-02-prd-analysis', 'step-03-epic-coverage-validation', 'step-04-ux-alignment', 'step-05-epic-quality-review']
documentsIncluded:
  prd: 'planning-artifacts/PRD.md'
  architecture: 'planning-artifacts/architecture.md'
  epics: 'planning-artifacts/epics.md'
  ux: null
  stories: 'implementation-artifacts/stories/ (26 plików)'
  sprintStatus: 'implementation-artifacts/sprint-status.yaml'
  productBrief: 'planning-artifacts/product-brief.md'
  projectContext: 'project-context.md'
---

# Implementation Readiness Assessment Report

**Date:** 2026-06-22
**Project:** od-sasiada.pl

---

## Step 1 — Document Discovery

### Dokumenty znalezione

**PRD:**
- `planning-artifacts/PRD.md` (10.6 KB, 2026-06-21) — wersja całościowa, brak shardingu

**Architektura:**
- `planning-artifacts/architecture.md` (11.4 KB, 2026-06-21) — wersja całościowa, brak shardingu

**Epiki & Stories:**
- `planning-artifacts/epics.md` (11.6 KB, 2026-06-21) — lista epików
- `implementation-artifacts/stories/` — 26 plików story:
  - Sprint 1: S1.0–S1.7 (8)
  - Sprint 2: S2.1–S2.9 (9)
  - Sprint 3: S3.1–S3.6 (6)
  - SPIKE-A, SPIKE-S2, SPIKE-S3 (3)
- `implementation-artifacts/sprint-status.yaml` — status sprintów

**UX:**
- ⚠️ BRAK dokumentu UX

**Kontekst dodatkowy:**
- `planning-artifacts/product-brief.md` (6.7 KB)
- `project-context.md` (reguły dla agentów AI — kompletny)

### Duplikaty
- Brak duplikatów (każdy dokument istnieje tylko w jednej formie — całościowej).

### Braki
- ⚠️ Brak dokumentu UX — wpłynie na kompletność oceny warstwy UX/UI.
- ℹ️ Istnieje wcześniejszy raport `implementation-readiness-report-2026-06-21.md` (poprzedni przebieg).

---

## Step 2 — PRD Analysis

### Wymagania funkcjonalne (FR) — 32

**EPIC-1 — Fundament workflow dostawcy (Sprint 1):**
- **FR1** Platforma wielotenantska; izolacja w adminie, Local API i froncie (SPIKE-A, S1.4)
- **FR2** Katalog Produkt + Wariant "porcja"; cena w groszach (S1.1)
- **FR3** Katalog/witryna per-tenant pod `/[tenant]`; publicznie tylko opublikowane (bazowy)
- **FR4** Rejestracja/logowanie/wylogowanie klientów; klient A anonimowy u B (S1.0)
- **FR5** Reset hasła e-mailem (S1.7)
- **FR6** Koszyk serwerowy (`carts`), jeden otwarty per klient+tenant (S1.2)
- **FR7** Checkout wymaga logowania (S1.2)
- **FR8** Walidacja cen i tenanta serwerowo przy add-to-cart i checkout (S1.2)
- **FR9** Płatność przy odbiorze; zamówienie przez Local API (S1.2)
- **FR10** Numer zamówienia `ZAM-RRRR-NNNNN` przy tworzeniu (nadpisanie)
- **FR11** Snapshot nazwy/wariantu/ceny pozycji przy składaniu (nadpisanie)
- **FR12** Adres dostawy z zapisanych lub nowy, zapisywany w zamówieniu (S1.3)
- **FR13** CRUD adresów dostawy; kod pocztowy `^\d{2}-\d{3}$` (S1.3)
- **FR14** Automat stanów `new→confirmed→preparing→out_for_delivery→delivered` + `cancelled` + reaktywacja (S1.5)
- **FR15** Dostawca widzi tylko własne zamówienia, filtr/sort; update tenant-scoped (S1.4, SPIKE-A)
- **FR16** Szczegóły zamówienia: panel (edycja statusu) + front read-only `/[tenant]/moje-zamowienia/[id]`, izolacja tenant+customer (S1.6)
- **FR17** E-mail potwierdzenia zamówienia; hook `sendStatusChange`; błędy logowane, nie blokują (S1.7, S1.5)
- **FR18** "Moje zamówienia" + zamów ponownie do koszyka (S1.2)

**EPIC-2 — Okna dostawy i powiadomienia (Sprint 2):**
- **FR19** Predefiniowane stałe okna dostawy per tenant; klient wybiera (O1; S2.1, S2.2)
- **FR20** Cutoff jako stała godzina dzienna; walidacja serwerowa (O2; S2.3)
- **FR21** Kolekcja multi-tenant `DeliverySlots` (O3; S2.1)
- **FR22** Limit miejsc (capacity) per slot; walidacja odporna na wyścig; pełny slot znika (O4; S2.7)
- **FR23** Wyjątki dni (daty niedostępne) (O7; S2.8)
- **FR24** Snapshot wybranego slotu do zamówienia; panel/front/mail (S2.4)
- **FR25** Maile statusowe na milestone'ach wprzód, bez spamu przy cofnięciu; PL (O5/O6; S2.5, S2.6)
- **FR26** Slot wymagany gdy tenant ma okna; brak okien → feature off (O8; S2.2, S2.3)

**EPIC-3 — Media i kategorie (Sprint 3):**
- **FR27** Kolekcja `Media` per-tenant; Vercel Blob; `sharp`; `alt` wymagane (D1, D2; S3.1)
- **FR28** Hero na produkcie i wariancie; fallback wariant→produkt→placeholder (D3, D6; S3.2, S3.3)
- **FR29** Render zdjęcia na katalogu i w szczegółach zamówienia, `next/image` (S3.3)
- **FR30** Kolekcja `Categories` per-tenant; relacja produkt↔kategoria `hasMany`, opcjonalna (D4, D5, D7; S3.4)
- **FR31** CRUD kategorii w panelu, tenant-scoped (S3.5)
- **FR32** Filtr po kategorii server-side (`?kategoria=`), `tenant` zawsze w `where` (S3.6)

### Wymagania niefunkcjonalne (NFR) — 8
- **NFR1** Izolacja/bezpieczeństwo tenantów; `overrideAccess: true` + ręczny `where { customer, tenant }`; cross-tenant → puste/403/404; test `orders-tenant-isolation`
- **NFR2** Integralność cen w groszach; jedno źródło prawdy `cart-validation.ts`; cena klienta niezaufana
- **NFR3** Trwałość danych: snapshoty + numer zamówienia przeżywają zmiany katalogu
- **NFR4** Odporność: e-maile best-effort, błędy SMTP łapane, nie blokują zamówienia
- **NFR5** Lokalizacja PL (`i18n` fallback `pl`); PLN `zł`
- **NFR6** Poprawność hydratacji (Next 16 + Turbopack): reguła `'use server'` + `next/headers`
- **NFR7** Lokalny Postgres w Dockerze (`postgres:17`, `od-sasiada-pg`), nie Homebrew
- **NFR8** Wydajność katalogu ze zdjęciami: `next/image` + `sharp` + lazy-load; LCP mierzony (EPIC-3)

### Wymagania dodatkowe / ograniczenia
- **Poza zakresem:** checkout gościa, e-mail per-tenant (TODO), korekta wagi, łączenie gość→konto, SMS, fakturowanie operatora, pełne RODO
- **Ryzyka:** R1 (brak e-maili), R2 (izolacja przy update — mityg. SPIKE-A), R3 (migracja koszyka serwerowego — mityg. cart-validation.ts)
- **Persony:** Operator (`platform-admin`), Dostawca (tenant), Klient (`customers`)

### Ocena kompletności PRD
- **Mocne strony:** każdy FR ma mapowanie na historyjkę; NFR konkretne i testowalne (zwł. NFR1 z nazwanym testem regresyjnym); jasny zakres poza-scope.
- **Do weryfikacji w kolejnych krokach:** pokrycie FR↔epiki/stories (Step 3), kompletność stories (Step 4), brak dokumentu UX (FR16/FR29/FR32 mają komponent UI bez osobnej specyfikacji UX).
- **Numeracja NFR5** ma drobny błąd formatowania w źródle (`**NFR5 |` zamiast `**NFR5**`) — kosmetyka, nie wpływa na treść.

**Razem: 32 FR + 8 NFR.**

---

## Step 3 — Epic Coverage Validation

### Macierz pokrycia FR

| FR | Wymaganie (skrót) | Pokrycie w epikach/stories | Status |
|----|-------------------|----------------------------|--------|
| FR1 | Wielotenantskość + izolacja | EPIC-1: SPIKE-A, S1.4 | ✓ Pokryte |
| FR2 | Produkt + Wariant "porcja", grosze | EPIC-1: S1.1 | ✓ Pokryte |
| FR3 | Katalog per-tenant, tylko opublikowane | EPIC-1: bazowy (brak dedyk. story) | ⚠️ Bazowy |
| FR4 | Rejestracja/login/logout klienta | EPIC-1: S1.0 | ✓ Pokryte |
| FR5 | Reset hasła e-mailem | EPIC-1: S1.7 | ✓ Pokryte |
| FR6 | Koszyk serwerowy | EPIC-1: S1.2 | ✓ Pokryte |
| FR7 | Checkout wymaga logowania | EPIC-1: S1.2 | ✓ Pokryte |
| FR8 | Walidacja cen/tenanta serwerowo | EPIC-1: S1.2 | ✓ Pokryte |
| FR9 | Płatność przy odbiorze via Local API | EPIC-1: S1.2 (bazowy) | ✓ Pokryte |
| FR10 | Numer zamówienia `ZAM-RRRR-NNNNN` | EPIC-1: nadpisanie bazowe (brak dedyk. story) | ⚠️ Bazowy |
| FR11 | Snapshot pozycji zamówienia | EPIC-1: nadpisanie bazowe (brak dedyk. story) | ⚠️ Bazowy |
| FR12 | Adres dostawy zapisywany w zamówieniu | EPIC-1: S1.3 | ✓ Pokryte |
| FR13 | CRUD adresów, kod `^\d{2}-\d{3}$` | EPIC-1: S1.3 | ✓ Pokryte |
| FR14 | Automat stanów zamówienia | EPIC-1: S1.5 | ✓ Pokryte |
| FR15 | Dostawca: własne zamówienia, update scoped | EPIC-1: S1.4, SPIKE-A | ✓ Pokryte |
| FR16 | Szczegóły zamówienia panel+front | EPIC-1: S1.6 | ✓ Pokryte |
| FR17 | E-mail potwierdzenia + hook status | EPIC-1: S1.7, S1.5 | ✓ Pokryte |
| FR18 | Moje zamówienia + zamów ponownie | EPIC-1: S1.2 (bazowy) | ✓ Pokryte |
| FR19 | Stałe okna dostawy per tenant | EPIC-2: S2.1, S2.2 | ✓ Pokryte |
| FR20 | Cutoff godzina dzienna, walidacja | EPIC-2: S2.3 | ✓ Pokryte |
| FR21 | Kolekcja `DeliverySlots` | EPIC-2: S2.1 (+SPIKE-S2) | ✓ Pokryte |
| FR22 | Capacity + odporność na wyścig | EPIC-2: S2.7 | ✓ Pokryte |
| FR23 | Wyjątki dni | EPIC-2: S2.8 | ✓ Pokryte |
| FR24 | Snapshot slotu do zamówienia | EPIC-2: S2.4 | ✓ Pokryte |
| FR25 | Maile statusowe na milestone'ach | EPIC-2: S2.5, S2.6 | ✓ Pokryte |
| FR26 | Slot wymagany gdy tenant ma okna | EPIC-2: S2.2, S2.3 | ✓ Pokryte |
| FR27 | Kolekcja `Media`, Vercel Blob, `alt` | EPIC-3: S3.1 (+SPIKE-S3) | ✓ Pokryte |
| FR28 | Hero produkt+wariant, fallback | EPIC-3: S3.2, S3.3 | ✓ Pokryte |
| FR29 | Render zdjęć katalog+zamówienie | EPIC-3: S3.3 | ✓ Pokryte |
| FR30 | Kolekcja `Categories`, `hasMany` | EPIC-3: S3.4 | ✓ Pokryte |
| FR31 | CRUD kategorii tenant-scoped | EPIC-3: S3.5 | ✓ Pokryte |
| FR32 | Filtr kategorii server-side | EPIC-3: S3.6 | ✓ Pokryte |

### Brakujące pokrycie
- **Brak FR bez pokrycia.** Wszystkie 32 FR mają ścieżkę implementacji.
- ⚠️ **FR3, FR10, FR11** oznaczone jako "bazowy / nadpisanie bazowe" — nie mają dedykowanej historyjki w `epics.md`. EPIC-1 jest ✅ ukończony (9/9), więc funkcjonalność istnieje jako baseline/override pluginu ecommerce, ale **traceability jest słabsza** (brak osobnego AC w epics.md). Do potwierdzenia w Step 4, czy AC są ujęte w stories S1.2/S1.6 lub w kodzie nadpisań (`ordersCollectionOverride`).

### Pozycje w epikach spoza PRD (reverse-check)
- **S2.9** — "widok dziennego obłożenia slotów" — oznaczone **PARK**, brak odpowiadającego FR. To świadomy nadmiar (nice-to-have), nie luka. OK.
- **S2.6/S3.5** drobne historyjki wspierające (PL-izacja maili, CRUD kategorii) — mapują się na FR25/FR31.

### Statystyki pokrycia
- **FR w PRD:** 32
- **FR pokryte w epikach/stories:** 32 (z czego 3 jako "bazowy" bez dedyk. historyjki)
- **Pokrycie:** 100% (29/32 z dedykowaną historyjką = 90,6%; 3 jako baseline)
- **NFR:** 8 — walidowane w kolejnych krokach (jakość stories / architektura)

---

## Step 4 — UX Alignment Assessment

### Status dokumentu UX
- **NIE ZNALEZIONO** dedykowanego dokumentu UX (`*ux*.md` / `*ux*/index.md`) w `planning-artifacts/`.

### Czy UX/UI jest implikowane?
**TAK — silnie.** To aplikacja user-facing z wieloma powierzchniami UI:
- Frontend klienta (`src/app/(frontend)/[tenant]/...`): katalog, koszyk (`koszyk`), checkout, konto (`konto`), moje zamówienia (`moje-zamowienia`), reset hasła (`reset-hasla`), filtr kategorii.
- Panel admina dostawcy (Payload): zarządzanie zamówieniami, slotami, mediami, kategoriami.
- FR z bezpośrednim komponentem UI: FR3, FR12/FR13 (formularze adresów), FR16 (szczegóły zamówienia), FR19/FR22/FR26 (wybór slotu, znikanie pełnego), FR28/FR29 (render zdjęć + fallback), FR32 (filtr kategorii).

### UX ↔ PRD / Architektura — ocena dopasowania (przy braku dokumentu UX)
Architektura **technicznie wspiera** implikowane potrzeby UI:
- Routing per-tenant `(frontend)/[tenant]/` + polskie ścieżki (NFR5) — ✓
- i18n PL (fallback `pl`), waluta PLN `zł`, `formatPLN` — ✓
- Wydajność katalogu ze zdjęciami: `next/image` + warianty `sharp` + lazy-load (NFR8) — ✓
- Granica hydratacji `'use server'` (NFR6) — krytyczny szczegół UI/serwer dobrze udokumentowany — ✓
- Stany puste/błędy walidacji: kod pocztowy, niedostępny slot, pełny slot, niedopasowanie tenanta — zdefiniowane na poziomie reguł, **nie na poziomie UX flow**.

### Ostrzeżenia
- ⚠️ **OSTRZEŻENIE (średnie):** Brak formalnej specyfikacji UX. Brakuje: makiet/wireframe'ów, user journeys, stanów komponentów (loading/empty/error), zasad dostępności (a11y), wzorców responsywności. Dla MVP z jednym dostawcą-pilotem akceptowalne, ale ryzyko niespójności UI i przeoczonych stanów krawędziowych (np. komunikat po cutoffie, pusty katalog, brak slotów → feature off w FR26).
- ⚠️ **Luki UX do rozstrzygnięcia przez stories (Step 5):** czy AC historyjek z komponentem UI (S2.2 wybór slotu, S3.3 render+fallback, S3.6 filtr) zawierają jawne stany empty/error/loading. Jeśli tak — ryzyko zmitygowane na poziomie stories.
- ✅ **Brak sprzeczności** między implikowanym UI a architekturą/PRD. To luka kompletności, nie konflikt.

### Rekomendacja
Nie blokuje implementacji EPIC-2/EPIC-3 jeśli stories niosą AC dla stanów UI. Rozważyć lekki dokument UX (1-stronicowy: stany + a11y) przed rozbudową poza pilota.

---

## Step 5 — Epic Quality Review

### A. Wartość użytkownika epików (nie milestone'y techniczne)
| Epik | Tytuł / cel | Werdykt |
|------|-------------|---------|
| EPIC-1 | Fundament workflow dostawcy — dostawca wystawia → klient zamawia → realizacja → e-mail | ✅ User-centric (✅ DONE 9/9) |
| EPIC-2 | Okna dostawy i powiadomienia — klient wie kiedy dojedzie + status mailem | ✅ User-centric |
| EPIC-3 | Media i kategorie — klient przegląda katalog ze zdjęciami i filtruje | ✅ User-centric |

**Brak epików "technicznych"** (typu "Setup DB", "API Development"). Spike'i (SPIKE-A/S2/S3) to de-riskowanie wewnątrz epików, nie osobne epiki techniczne — poprawny wzorzec brownfield.

### B. Niezależność epików
- EPIC-1 stoi samodzielnie (✅ done).
- EPIC-2 opiera się **tylko** na EPIC-1 (`placeOrder`, `orders`, `order-status.ts`). Brak zależności od EPIC-3.
- EPIC-3 opiera się **tylko** na EPIC-1 (izolacja multi-tenant, katalog). Brak zależności od EPIC-2.
- ✅ **Brak forward-dependency** (Epik N nie wymaga Epiku N+1). EPIC-2 i EPIC-3 są względem siebie równoległe.

### C. Jakość historyjek (struktura BMad)
Skan 26 plików: wszystkie historyjki dev (S2.1–S2.8, S3.1–S3.6) mają komplet sekcji:
- **Story** w formacie "Jako… chcę… aby…" — ✅
- **Acceptance Criteria** numerowane, konkretne, testowalne (4–8 AC/historię) — ✅
- **Tasks/Subtasks** zmapowane na AC (`(AC: 1,2,…)`) — ✅
- **Dev Notes** z **rygorystycznym zakresem** ("Co to za historia" + "Poza zakresem") — ✅
- **References** z cytowaniem źródeł (`[Source: …#linia]`) — ✅
- **Anti-patterns** ("Czego NIE robić") — ✅
- **Open Questions** gdzie sensowne — ✅

AC pokrywają happy path **oraz** stany błędu/krawędziowe (np. S2.2 AC7: pusta lista → komunikat PL „Brak dostępnych terminów…"; S2.1 AC4: walidacje zapisu; izolacja NFR1 w testach). To częściowo **mityguje brak dokumentu UX** (Step 4) — stany UI są w AC.

### D. Zależności historyjek + timing tworzenia encji
- Kolejność budowania w `sprint-status.yaml` zgodna z `epics.md` (SPIKE-S2 → S2.1 → S2.8 → S2.2 → S2.3 → S2.7 → S2.4 → S2.5 → S2.6).
- ✅ **Brak forward-dependency blokującej ukończenie.** Gdzie historia UI poprzedza walidację (S2.2 przed S2.3/S2.7/S2.4), wybór slotu jest **tylko przenoszony** (parametr opcjonalny, `reservedCount: 0` placeholder), bez zapisu/walidacji — historia jest niezależnie ukończalna, a grunt pod kolejne przygotowany. Wzorcowe zarządzanie carry-forward.
- ✅ **Encje tworzone gdy potrzebne**, nie z góry: S2.1 tworzy `DeliverySlots`, S2.8 `DeliveryDateExceptions`, S2.4 dodaje relację `deliverySlot` do `orders`. Brak "utwórz wszystkie tabele naraz".

### E. Znaleziska wg wagi

#### 🔴 Krytyczne
- **Brak.**

#### 🟠 Istotne (Major)
- **SPIKE-S3 niezamknięty (🟡 częściowo zweryfikowany), a S3.1 już `in-progress`.** AC3 (realny upload Vercel Blob — runtime) i **AC4 (URL bloba nie przecieka cross-tenant — R-S3.2, część NFR1!)** są **zablokowane** brakiem `BLOB_READ_WRITE_TOKEN` (integracja Vercel Marketplace).
  - **Wpływ:** cała EPIC-3 buduje się na **niepotwierdzonej izolacji serwowania mediów**. Otwarte pytanie spike'a: czy plik serwowany jest przez access-control Payloada, czy z publicznej domeny blob (determinuje, czy `access.read` realnie chroni, czy izolacja opiera się tylko na nieprzewidywalności ścieżki). To bezpośrednie ryzyko bezpieczeństwa NFR1.
  - **Rekomendacja:** **Przed kontynuacją S3.1+ (poza baseline)** sprovisionować integrację Vercel Blob + ustawić token (`vercel env pull` lub `.env.local`), domknąć AC3/AC4, zaktualizować architekturę §8 i status SPIKE-S3 → ✅. Baseline (model `Media` + adapter wpięty warunkowo) jest OK i nie blokuje — blokuje realny upload i dowód izolacji URL.

#### 🟡 Drobne (Minor)
- **S3.5 ma 4 AC** (CRUD kategorii) — najmniejsza, ale adekwatna do wąskiego zakresu. OK.
- **Open Questions** w kilku historiach (S2.1 Q1 `useAsTitle`, Q2 lokalizacja testu integracyjnego) — nie blokujące, świadomie zostawione dla dev.
- **S2.9 (PARK / backlog)** — poprawnie wyłączona ze sprintu; plik istnieje jako placeholder. OK.
- **Brak dokumentu UX** (z Step 4) — zmitygowane przez AC niosące stany empty/error, ale brak makiet/a11y/responsywności jako spójnej specyfikacji.

### F. Checklist zgodności (per epik)
| Kryterium | EPIC-1 | EPIC-2 | EPIC-3 |
|-----------|:------:|:------:|:------:|
| Dostarcza wartość użytkownika | ✅ | ✅ | ✅ |
| Funkcjonuje niezależnie | ✅ | ✅ | ✅ |
| Historyjki właściwie zwymiarowane | ✅ | ✅ | ✅ |
| Brak forward-dependency | ✅ | ✅ | ✅ |
| Encje tworzone gdy potrzebne | ✅ | ✅ | ✅ |
| Jasne kryteria akceptacji | ✅ | ✅ | ✅ |
| Traceability do FR | ✅ | ✅ | ✅ |
| **Fundament (spike) zweryfikowany** | ✅ | ✅ (SPIKE-S2 done) | ⚠️ **SPIKE-S3 blokada** |

---

## Step 6 — Podsumowanie i rekomendacje

### Ogólny status gotowości
## 🟢 GOTOWE (z jednym warunkiem na EPIC-3)

EPIC-2 jest **w pełni gotowy do implementacji** — SPIKE-S2 domknięty, 8 historyjek `ready-for-dev` z wzorcowymi specyfikacjami. EPIC-3 jest gotowy **warunkowo**: baseline OK, ale realny upload i dowód izolacji URL (NFR1) czekają na token Vercel Blob.

### Liczby
- **Dokumenty:** PRD ✅, Architektura ✅, Epiki ✅, 26 historyjek ✅, sprint-status ✅; **UX ❌ (brak)**
- **Pokrycie wymagań:** 32/32 FR (100%; 3 jako baseline bez dedyk. story), 8 NFR
- **Jakość historyjek:** 14/14 historyjek dev z kompletem sekcji (AC + Tasks + Dev Notes + References + Scope + Anti-patterns)
- **Spike'i:** SPIKE-A ✅, SPIKE-S2 ✅, **SPIKE-S3 🟡 (1 blokada)**

### Problemy krytyczne wymagające natychmiastowego działania
- **Brak.** Żadnego problemu blokującego start sprintu (EPIC-2 można zaczynać od razu).

### Problemy istotne (do rozstrzygnięcia przed kontynuacją EPIC-3)
1. **🟠 SPIKE-S3 niezamknięty — izolacja serwowania mediów niepotwierdzona (NFR1/R-S3.2).** `BLOB_READ_WRITE_TOKEN` brakuje; AC3 (runtime upload) i AC4 (URL nie przecieka cross-tenant) zablokowane. Otwarte pytanie bezpieczeństwa: czy plik chroni `access.read` Payloada, czy tylko nieprzewidywalność ścieżki blob.

### Problemy drobne (nie blokują)
2. **🟡 Brak dokumentu UX** — zmitygowane przez stany UI w AC; rozważyć 1-stronicowy UX (stany empty/error/loading + a11y) przed skalowaniem poza pilota.
3. **🟡 FR3/FR10/FR11 bez dedykowanej historyjki** — "bazowy/nadpisanie bazowe"; EPIC-1 done, funkcjonalność istnieje, ale słabsza traceability w epics.md.
4. **🟡 Drobny błąd formatowania NFR5** w PRD (`**NFR5 |`).
5. **🟡 Open Questions** w S2.1 (Q1 `useAsTitle`, Q2 lokalizacja testu) — do potwierdzenia przy dev.

### Rekomendowane kolejne kroki
1. **Zacznij EPIC-2 od S2.1** (build order: S2.1 → S2.8 → S2.2 → S2.3 → S2.7 → S2.4 → S2.5 → S2.6). Fundament (SPIKE-S2 + `delivery-slots.ts`) gotowy — zero blokad. → `bmad-dev-story` na S2.1.
2. **Odblokuj EPIC-3:** sprovisionuj integrację Vercel Blob (Marketplace) i ustaw `BLOB_READ_WRITE_TOKEN` (`vercel env pull` lub `.env.local`). Następnie domknij SPIKE-S3 AC3/AC4, zaktualizuj architekturę §8 (zdejmij "do potwierdzenia"), zmień status SPIKE-S3 → ✅. **Nie kontynuuj S3.1 poza baseline, dopóki AC4 (izolacja URL) nie jest udowodnione.**
3. **(Opcjonalnie)** Dodaj dedykowane AC dla FR3/FR10/FR11 do epics.md lub potwierdź ich pokrycie w testach/kodzie nadpisań, by domknąć traceability.
4. **(Opcjonalnie)** Lekki dokument UX + poprawka formatowania NFR5.

### Nota końcowa
Ocena zidentyfikowała **5 problemów** w 4 kategoriach (0 krytycznych, 1 istotny, 4 drobne). Jakość planowania jest **wysoka** — pokrycie FR pełne, historyjki wyjątkowo dobrze przygotowane (zakres, references, anti-patterns, obsługa carry-forward), izolacja multi-tenant (NFR1) konsekwentnie pilnowana. Jedyny istotny warunek dotyczy EPIC-3 i wymaga działania zewnętrznego (token Vercel Blob), nie przeróbki planu. **Można startować implementację EPIC-2 natychmiast.**

---

*Oceniający: Claude (bmad-check-implementation-readiness) · Data: 2026-06-22 · Projekt: od-sasiada.pl*
