---
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
  - step-06-final-assessment
filesForAssessment:
  - PRD.md
  - architecture.md
  - epics.md
excluded:
  - product-brief.md (bonus doc, not part of core readiness)
missing:
  - UX design document
---

# Implementation Readiness Assessment Report

**Date:** 2026-06-24
**Project:** od-sasiada.pl

---

## Document Discovery

### PRD Documents

**Whole Documents:**
- `PRD.md`

**Sharded Documents:**
- None found

### Architecture Documents

**Whole Documents:**
- `architecture.md`

**Sharded Documents:**
- None found

### Epics & Stories Documents

**Whole Documents:**
- `epics.md`

**Sharded Documents:**
- None found

### UX Design Documents

**Status:** ❌ NOT FOUND

### Other Documents Found

- `product-brief.md`

---

## PRD Analysis

### Functional Requirements

| ID | Wymaganie | Historyjka |
|----|-----------|------------|
| **FR1** | Platforma jest wielotenantska: każdy dostawca jest tenantem. Izolacja utrzymywana w panelu admina, Local API i froncie, tak że dostawca widzi tylko własne dane. | SPIKE-A, S1.4 |
| **FR2** | Katalog używa modelu Produkt + Wariant "porcja"; każdy produkt/wariant ma cenę w groszach. | bazowy / S1.1 |
| **FR3** | Każdy tenant ma katalog i witrynę per-tenant pod /[tenant]; publiczny katalog wyświetla tylko opublikowane produkty. | bazowy |
| **FR4** | Klienci mogą się rejestrować, logować i wylogowywać; klient A jest anonimowy u dostawcy B. | S1.0 |
| **FR5** | Klienci mogą żądać resetu hasła e-mailem. | S1.7 |
| **FR6** | Koszyk serwerowy (carts), jeden otwarty per klient+tenant, między sesjami. | S1.2 |
| **FR7** | Checkout wymaga logowania. | S1.2 |
| **FR8** | Ceny walidowane serwerowo przy add-to-cart i checkout; cena z klienta nigdy niezaufana. | S1.2 |
| **FR9** | Płatność przy odbiorze — zamówienie przez Local API. | bazowy / S1.2 |
| **FR10** | Numer zamówienia ZAM-RRRR-NNNNN przy tworzeniu. | nadpisanie bazowe |
| **FR11** | Snapshot pozycji (nazwa, etykieta wariantu, cena) odporny na zmiany. | nadpisanie bazowe |
| **FR12** | Adres dostawy wybierany z zapisanych lub nowy, zapisywany w zamówieniu. | S1.3 |
| **FR13** | CRUD adresów (pola PL; kod NN-NNN regex). | S1.3 |
| **FR14** | Automat stanów: new→confirmed→preparing→out_for_delivery→delivered; cancelled z każdego niedostarczonego; reaktywacja cancelled→new. | S1.5 |
| **FR15** | Dostawca widzi w panelu tylko własne zamówienia, filtrowalne/sortowalne; update scoped na tenanta. | S1.4, SPIKE-A |
| **FR16** | Szczegóły zamówienia: panel (full) i front read-only /[tenant]/moje-zamowienia/[id], izolowane tenant+customer. | S1.6 |
| **FR17** | E-mail potwierdzenia przy składaniu; hook sendStatusChange istnieje; błędy logowane, nie blokują. | S1.7, S1.5 |
| **FR18** | Klienci mogą przeglądać historię i zamawiać ponownie. | bazowy / S1.2 |
| **FR19** | Dostawca konfiguruje stałe okna dostawy; klient wybiera z listy (O1). | S2.1, S2.2 |
| **FR20** | CutoffTime — stała godzina; slot po cutoffie/przeszły odrzucany (O2). | S2.3 |
| **FR21** | Okna w dedykowanej kolekcji DeliverySlots (O3). | S2.1 |
| **FR22** | Slot ma limit capacity; walidacja race-safe; pełny slot znika (O4). | S2.7 |
| **FR23** | Wyjątki dni (daty niedostępne) wykluczane z dostępnych slotów (O7). | S2.8 |
| **FR24** | Slot snapshotowany do zamówienia; widoczny panel/front/mail (B1). | S2.4 |
| **FR25** | Maile statusowe tylko na milestone'ach wprzód; treść PL (O5/O6). | S2.5, S2.6 |
| **FR26** | Slot wymagany gdy tenant ma okna; brak → feature wyłączony (O8). | S2.2, S2.3 |
| **FR27** | Kolekcja Media per-tenant; Vercel Blob; sharp; alt wymagane (D1, D2). | S3.1 |
| **FR28** | Hero na produkcie i wariancie; fallback wariant→produkt→placeholder (D3, D6). | S3.2, S3.3 |
| **FR29** | Render zdjęć katalogu + szczegóły zamówienia; next/image. | S3.3 |
| **FR30** | Kolekcja Categories per-tenant; hasMany; opcjonalna (D4, D5, D7). | S3.4 |
| **FR31** | CRUD kategorii tenant-scoped w panelu. | S3.5 |
| **FR32** | Filtr po kategorii na katalogu; server-side; tenant w where. | S3.6 |

**Total FRs: 32**

### Non-Functional Requirements

| ID | Wymaganie |
|----|-----------|
| **NFR1** | Izolacja/bezpieczeństwo tenantów: brak cross-tenant dostępu; overrideAccess + ręczny where; test regresyjny. |
| **NFR2** | Integralność cen: grosze (integer); cart-validation.ts jako jedyne źródło; cena klienta niezaufana. |
| **NFR3** | Trwałość danych: snapshoty zamówień niezależne od zmian katalogu. |
| **NFR4** | Odporność: e-maile best-effort; błędy logowane, nie blokują operacji. |
| **NFR5** | Lokalizacja: PL (i18n fallback pl); waluta PLN, symbol zł. |
| **NFR6** | Poprawność hydratacji (Next 16 + Turbopack): 'use server' + next/headers reguły. |
| **NFR7** | Środowisko dev: Postgres w Docker (od-sasiada-pg). |
| **NFR8** | Wydajność frontu katalogu: next/image + sharp + lazy-load; LCP mierzony. |

**Total NFRs: 8**

### PRD Completeness Assessment

PRD jest kompletny i dobrze ustrukturyzowany:
- 32 FR pokrywają wszystkie 3 epiki
- 8 NFR adresują kluczowe obszary (izolacja, integralność, wydajność)
- Poza zakresem i ryzyka jasno zdefiniowane
- Każdy FR mapowany na konkretną historyjkę/epik

**Jedyny brak:** brak dedykowanego dokumentu UX — wizualne/UI wymagania nie są formalnie udokumentowane.

---

## Epic Coverage Validation

### Coverage Matrix

| FR | Wymaganie | Epic | Story | Status |
|----|-----------|------|-------|--------|
| FR1 | Wielotenantskość, izolacja per-tenant | EPIC-1 | SPIKE-A, S1.4 | ✓ Covered |
| FR2 | Produkt + Wariant "porcja", ceny w groszach | EPIC-1 | S1.1 | ✓ Covered |
| FR3 | Katalog per-tenant /[tenant], tylko published | EPIC-1 | bazowy | ✓ Covered |
| FR4 | Rejestracja/login/logout klienta | EPIC-1 | S1.0 | ✓ Covered |
| FR5 | Reset hasła e-mailem | EPIC-1 | S1.7 | ✓ Covered |
| FR6 | Koszyk serwerowy per klient+tenant | EPIC-1 | S1.2 | ✓ Covered |
| FR7 | Checkout wymaga logowania | EPIC-1 | S1.2 | ✓ Covered |
| FR8 | Ceny walidowane serwerowo | EPIC-1 | S1.2 | ✓ Covered |
| FR9 | Płatność przy odbiorze (Local API) | EPIC-1 | S1.2 | ✓ Covered |
| FR10 | Numer zamówienia ZAM-RRRR-NNNNN | EPIC-1 | nadpisanie bazowe | ✓ Covered |
| FR11 | Snapshot pozycji (cena, nazwa) | EPIC-1 | nadpisanie bazowe | ✓ Covered |
| FR12 | Adres dostawy zapisywany w zamówieniu | EPIC-1 | S1.3 | ✓ Covered |
| FR13 | CRUD adresów, kod pocztowy regex | EPIC-1 | S1.3 | ✓ Covered |
| FR14 | Automat stanów liniowy z cofaniem | EPIC-1 | S1.5 | ✓ Covered |
| FR15 | Panel: tylko własne zamówienia, scoped update | EPIC-1 | S1.4, SPIKE-A | ✓ Covered |
| FR16 | Szczegóły: panel edytowalne, front read-only | EPIC-1 | S1.6 | ✓ Covered |
| FR17 | E-mail potwierdzenia + hook sendStatusChange | EPIC-1 | S1.7, S1.5 | ✓ Covered |
| FR18 | Historia zamówień + reorder | EPIC-1 | S1.2 | ✓ Covered |
| FR19 | Stałe okna dostawy per tenant | EPIC-2 | S2.1, S2.2 | ✓ Covered |
| FR20 | CutoffTime, slot po cutoffie odrzucany | EPIC-2 | S2.3 | ✓ Covered |
| FR21 | DeliverySlots dedykowana kolekcja | EPIC-2 | S2.1 | ✓ Covered |
| FR22 | Capacity slotu, race-safe | EPIC-2 | S2.7 | ✓ Covered |
| FR23 | Wyjątki dni (daty niedostępne) | EPIC-2 | S2.8 | ✓ Covered |
| FR24 | Slot snapshotowany do zamówienia | EPIC-2 | S2.4 | ✓ Covered |
| FR25 | Maile statusowe na milestone'ach, PL | EPIC-2 | S2.5, S2.6 | ✓ Covered |
| FR26 | Slot wymagany gdy tenant ma okna | EPIC-2 | S2.2, S2.3 | ✓ Covered |
| FR27 | Media per-tenant, Vercel Blob, sharp, alt | EPIC-3 | S3.1 | ✓ Covered |
| FR28 | Hero na produkcie i wariancie, fallback | EPIC-3 | S3.2, S3.3 | ✓ Covered |
| FR29 | Render zdjęć katalogu + szczegóły, next/image | EPIC-3 | S3.3 | ✓ Covered |
| FR30 | Categories per-tenant, hasMany | EPIC-3 | S3.4 | ✓ Covered |
| FR31 | CRUD kategorii tenant-scoped | EPIC-3 | S3.5 | ✓ Covered |
| FR32 | Filtr po kategorii server-side | EPIC-3 | S3.6 | ✓ Covered |

### Coverage Statistics

- **Total PRD FRs:** 32
- **FRs covered in epics:** 32
- **Coverage percentage:** 100%

### Coverage Gaps

✅ **Brak luk** — wszystkie 32 FR z PRD mają przypisane historie w epikach.

### ⚠️ Nieścisłości w epics.md

| Problem | Opis |
|---------|------|
| **Stale statusy** | `epics.md` pokazuje EPIC-2 jako `☐ TODO` i EPIC-3 jako `☐ TODO`, ale `sprint-status.yaml` ma EPIC-2 `done` i EPIC-3 `in-progress`. Dokument epików nie był aktualizowany od 2026-06-20. |
| **Stale story statusy** | S3.1, S3.2, S3.3 pokazane jako `☐ TODO` w epics.md, ale faktycznie S3.1 `in-progress` (częściowo zrobione), S3.2/S3.3 `review`. |

---

## UX Alignment Assessment

### UX Document Status

**NOT FOUND** — brak dedykowanego dokumentu UX (`*ux*.md`) w `planning-artifacts/`.

### UX Implied Assessment

| Kryterium | Wartość |
|-----------|---------|
| PRD mentions user interface? | ✓ Tak — katalog `/[tenant]`, panel dostawcy, checkout, koszyk, zamówienia, formularze |
| Web/mobile components implied? | ✓ Tak — Next.js SPA z publicznym katalogiem i panelem admina |
| User-facing application? | ✓ Tak — zarówno klient końcowy jak i dostawca |
| **Verdict** | **UX implied** — aplikacja jest mocno user-facing |

### Warnings

1. **Brak wireframe'ów / mockup'ów** — komponenty widoków (katalog, panel, checkout) będą budowane bez wizualnego projektu. Ryzyko: chaotyczny UI, niespójny layout, poprawki po implementacji.
2. **Architektura nie odnosi się do UX** — `architecture.md` opisuje warstwy danych i API, ale nie frontendu ani przepływów użytkownika.
3. **Stan akceptowalny dla fazy MVP** — jeżeli priorytetem jest dostarczenie funkcji a nie dopracowanie UI, brak UX nie blokuje implementacji.

### Alignment Issues

N/A — bez dokumentu UX nie ma czego porównywać.

---

## Epic Quality Review

### Epic Structure Validation

#### EPIC-1 — Fundament workflow dostawcy
| Kryterium | Status |
|-----------|--------|
| User-centric title | ✓ — "Fundament workflow dostawcy" opisuje co użytkownik może zrobić |
| Goal = user outcome | ✓ — "dostawca wystawia towary → klient zamawia → dostawca realizuje" |
| Samodzielnie użyteczny | ✓ — pełny flow zamówienia dostawcy |
| Zależności od epików N+1 | ✓ — brak (EPIC-1 nie zależy od EPIC-2 ani EPIC-3) |
| Story user-facing | ✓ — wszystkie historie (S1.0-S1.7, SPIKE-A) |
| DB tabele tworzone gdy potrzebne | ✓ — customers (S1.0), carts (S1.2), addresses (S1.3), orders (ewolucyjnie) |

#### EPIC-2 — Okna dostawy i powiadomienia o statusie
| Kryterium | Status |
|-----------|--------|
| User-centric title | ✓ — "Okna dostawy i powiadomienia" to user benefit |
| Goal = user outcome | ✓ — "klient wybiera termin, dostaje maila" |
| Samodzielnie użyteczny (potrzebuje EPIC-1) | ✓ — naturalna zależność (potrzebuje zamówień i klientów z EPIC-1) |
| Zależności od epików N+1 | ✓ — brak (EPIC-2 nie zależy od EPIC-3) |
| Story user-facing | ✓ — wszystkie (S2.1-S2.8, SPIKE-S2, S2.9 PARK) |
| DB tabele tworzone gdy potrzebne | ✓ — DeliverySlots (S2.1), snapshoty (S2.4) |

#### EPIC-3 — Media i kategorie
| Kryterium | Status |
|-----------|--------|
| User-centric title | ✓ — "Media i kategorie" opisuje funkcję biznesową |
| Goal = user outcome | ✓ — "dostawca dodaje zdjęcia i kategorie, klient przegląda katalog" |
| Samodzielnie użyteczny (potrzebuje EPIC-1) | ✓ — potrzebuje produktów/wariantów z EPIC-1 (S1.1) |
| Zależności od epików N+1 | ✓ — brak |
| Story user-facing | ✓ — wszystkie (S3.1-S3.6, SPIKE-S3) |
| DB tabele tworzone gdy potrzebne | ✓ — Media (S3.1), Categories (S3.4) |

### Story Quality Assessment

#### Story Sizing

| Epic | Stories ogółem | S | M | L | PARK | Uwagi |
|------|---------------|---|---|---|---|-------|
| EPIC-1 | 9 | 5 | 3 | 1 | 0 | L na S1.2 (koszyk + reorder) — uzasadniony |
| EPIC-2 | 9 | 2 | 5 | 1 | 1 | S2.9 PARK, S2.1 L (config wielopolowy) |
| EPIC-3 | 7 | 1 | 5 | 0 | 0 | Wszystkie M lub S — proporcjonalne |

#### Acceptance Criteria Quality (sample: S3.1, S2.1)

| Kryterium | S3.1 | S2.1 |
|-----------|------|------|
| Testable ACs | ✓ — 6 AC, każdy weryfikowalny | ✓ — 7 AC, każdy weryfikowalny |
| Given/When/Then | ~ — narracyjne, nie formalne GWT | ~ — narracyjne |
| Error conditions covered | ✓ — brak tokenu = fallback, SVG wykluczone | ✓ — walidacja pól (regex, zakresy) |
| Specific outcomes | ✓ — konkretne wymiary, konkretne testy | ✓ — konkretne formaty HH:mm, zakresy 0-6 |
| Dependencies documented | ✓ — SPIKE-S3, blokada tokenu | ✓ — SPIKE-S2 |
| Pending items tracked | ✓ — Task 4 blocked na token | ✓ — N/A (done) |

### Dependency Analysis

#### Within-Epic (EPIC-3 example)
```
SPIKE-S3 → S3.1 → S3.2 → S3.3    (kolejność mediów)
                    S3.4 → S3.5 → S3.6    (kolejność kategorii)
```
- Wewnątrz epiku zależności liniowe — poprawne
- S3.4 (Categories) niezależne od S3.1 (Media) — mogą być równoległe ✓
- Brak forward references do EPIC-2 lub spoza EPIC-3 ✓

#### Cross-Epic
- EPIC-2 wymaga EPIC-1 (zamówienia, klienci) — OK
- EPIC-3 wymaga EPIC-1 (produkty/warianty) — OK
- Brak cyklicznych zależności ✓
- Żaden epic nie wymaga epiku N+1 ✓

### Best Practices Compliance

- [x] Epics deliver user value
- [x] Epics can function independently (z naturalnymi zależnościami)
- [x] Stories appropriately sized
- [x] No forward dependencies
- [x] Database tables created when first needed
- [x] Clear acceptance criteria (narrative but testable)
- [x] Traceability to FRs maintained (100% coverage)

### Issues Found

#### 🟠 Major Issues

| # | Issue | Affects |
|---|-------|---------|
| M1 | **SPIKE stories to techniczne investigacje, nie user stories** — SPIKE-A, SPIKE-S2, SPIKE-S3 są wartościowe (risk reduction) ale łamią zasadę "każda historia = user value". Zaakceptowane jako konwencja projektu. | SPIKE-A, SPIKE-S2, SPIKE-S3 |
| M2 | **S1.1 brzmi technicznie** — "wyłączenie śledzenia inwentarza" to zmiana konfiguracji, nie user story. Uzasadnione: to włączenie modelu biznesowego (towary świeże bez stanów). | EPIC-1 S1.1 |

#### 🟡 Minor Concerns

| # | Issue | Affects |
|---|-------|---------|
| m1 | **epics.md ma stale statusy** — EPIC-2 pokazany jako `☐ TODO` (faktycznie `done`), EPIC-3 jako `☐ TODO` (faktycznie `in-progress`), S3.1-S3.3 jako `☐ TODO` (faktycznie `in-progress`/`review`). | epics.md |
| m2 | **Formalny GWT (Given/When/Then) nieużywany** — AC są narracyjne, ale testowalne. Spójne w całym projekcie. | Wszystkie historie |
| m3 | **S2.9 PARK (deferred)** — świadome odłożenie, udokumentowane. Nie blokuje. | EPIC-2 |

### Recommendations

1. **Zaktualizować epics.md** — zsynchronizować statusy story z `sprint-status.yaml` (EPIC-2 → `done`, EPIC-3 → `in-progress`, S3.1-S3.3 → faktyczne statusy).
2. **Utrzymać konwencję SPIKE** — jest wartościowa dla risk reduction, ale dokumentować w `epics.md` adnotację, że to konwencja projektu.
3. **GWT optional** — obecna narracyjna forma AC jest wystarczająca i spójna. Nie wymuszać GWT.

---

## Summary and Recommendations

### Overall Readiness Status

**READY** — projekt jest gotowy implementacyjnie. Wszystkie strukturalne wymagania spełnione.

| Kryterium | Status | Dowód |
|-----------|--------|-------|
| PRD | ✓ | 32 FR, 8 NFR wyekstrahowane |
| Architecture | ✓ | Decyzje D1-D7, O1-O8, B1-B4 udokumentowane |
| Epics | ✓ | 3 epiki, 24 historie, 100% FR coverage |
| UX | ⚠️ | Brak dedykowanego UX, ale implied — akceptowalne dla MVP |
| Epic quality | ✓ | Zero krytycznych naruszeń best practices |
| Code quality (S3.1) | ✓ | Po code review: 2 fixy wdrożone, lint/test zielone |
| Environment | ⚠️ | AC4/AC5 S3.1 zablokowane na `BLOB_READ_WRITE_TOKEN` |

### Critical Issues Requiring Immediate Action

| # | Issue | Severity | Action |
|---|-------|----------|--------|
| 1 | **AC4/AC5 S3.1 wymaga `BLOB_READ_WRITE_TOKEN`** — realny upload Vercel Blob + model serwowania URL niezweryfikowany | 🟠 Operational | Provision Vercel Blob Marketplace → `vercel env pull` → test uploadu → ustalić model serwowania |
| 2 | **`epics.md` ma stale statusy** — wprowadza w błąd przy planowaniu | 🟡 Minor | Zaktualizować statusy: EPIC-2 `done`, EPIC-3 `in-progress`, S3.1-S3.3 rzeczywiste |

### Issues Found Summary

| Kategoria | Znalezione | Krytyczne | Uwagi |
|-----------|-----------|-----------|-------|
| Missing documents | 1 (UX) | Nie | Akceptowalne dla MVP |
| FR coverage gaps | 0 | — | 100% pokrycia |
| Epic quality violations | 5 | 0 | 2 major (konwencja projektu) + 3 minor |
| Code issues (S3.1) | 2 fixed, 0 open | — | MIME types + BLOB warning |
| Blocked items | 1 (AC4/AC5) | Operational | Token z Vercel Marketplace |

### Recommended Next Steps

1. **(Akcja użytkownika)** Provision Vercel Blob → `vercel env pull` → odblokowanie AC4/AC5 S3.1
2. Zaktualizować statusy w `epics.md`
3. Po odblokowaniu tokenu: zweryfikować model serwowania blobu i udokumentować w `architecture.md §8`
4. Kontynuować S3.2 (hero na produkcie) i S3.3 (render na froncie) — nie są zablokowane na token
5. Rozważyć dedykowany dokument UX przed EPIC-2 (okna dostawy mają wiele UI)

### Final Note

This assessment identified **6 issues** across **4 categories** (brak UX, stale statusy, SPIKE convention, S1.1 borderline, brak formalnego GWT, blocked AC4/AC5). **Zero critical structural blockers.** Głównym wąskim gardłem jest `BLOB_READ_WRITE_TOKEN` — po jego odblokowaniu S3.1 może być finalnie domknięta.

---

*Raport wygenerowany: 2026-06-24*
*Profil: Implementation Readiness Assessment (bmad-check-implementation-readiness)*
*Przegląd S3.1: code review + 2 fixy wdrożone, lint/test zielone*
