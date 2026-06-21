---
stepsCompleted: ['step-01-document-discovery', 'step-02-prd-analysis', 'step-03-epic-coverage-validation', 'step-04-ux-alignment', 'step-05-epic-quality-review', 'step-06-final-assessment']
documentsIncluded:
  prd: '_bmad-output/planning-artifacts/PRD.md'
  architecture: '_bmad-output/planning-artifacts/architecture.md'
  epics: '_bmad-output/planning-artifacts/epics.md'
  productBrief: '_bmad-output/planning-artifacts/product-brief.md'
  ux: null
  stories:
    - '_bmad-output/implementation-artifacts/stories/S1.1.md'
    - '_bmad-output/implementation-artifacts/stories/S1.2.md'
    - '_bmad-output/implementation-artifacts/stories/S1.3.md'
    - '_bmad-output/implementation-artifacts/stories/S1.4.md'
    - '_bmad-output/implementation-artifacts/stories/S1.5.md'
    - '_bmad-output/implementation-artifacts/stories/S1.6.md'
    - '_bmad-output/implementation-artifacts/stories/S1.7.md'
    - '_bmad-output/implementation-artifacts/stories/SPIKE-A.md'
  sprintStatus: '_bmad-output/implementation-artifacts/sprint-status.yaml'
---

# Implementation Readiness Assessment Report

**Date:** 2026-06-21
**Project:** od-sasiada.pl

## Document Inventory

| Typ dokumentu | Plik | Rozmiar | Zmodyfikowano | Status |
|---|---|---|---|---|
| PRD | `planning-artifacts/PRD.md` | 7.9 KB | 2026-06-21 09:58 | ✅ Found (whole) |
| Architecture | `planning-artifacts/architecture.md` | 10.0 KB | 2026-06-21 09:59 | ✅ Found (whole) |
| Epics & Stories | `planning-artifacts/epics.md` | 5.3 KB | 2026-06-21 09:59 | ✅ Found (whole) |
| Product Brief | `planning-artifacts/product-brief.md` | 6.7 KB | 2026-06-21 09:58 | ✅ Found (whole) |
| UX Design | — | — | — | ⚠️ Missing |
| Story files | `implementation-artifacts/stories/*.md` (8 plików) | — | 2026-06-21 10:00–10:01 | ✅ Found |
| Sprint status | `implementation-artifacts/sprint-status.yaml` | 80 wierszy | 2026-06-21 | ✅ Found |

**Duplikaty (whole + sharded):** Brak — wszystkie dokumenty istnieją wyłącznie jako pojedyncze pliki.

**Braki:** Dokument UX Design nie został znaleziony.

---

## PRD Analysis

> Uwaga kontekstowa: PRD jest oznaczony jako **„odtworzony 2026-06-20 (po Sprint 1)"** — dokument odtworzony wstecznie po realizacji EPIC-1. EPIC-1 (S1.1–S1.7 + SPIKE-A) jest oznaczony jako GOTOWE.

### Wymagania funkcjonalne (FR) — wyodrębnione

- **FR1** — Wielotenantowość: każdy dostawca = tenant; izolacja w admin/Local API/froncie. (SPIKE-A, S1.4)
- **FR2** — Katalog Produkt + Wariant „porcja"; cena w groszach. (bazowy/S1.1)
- **FR3** — Witryna per-tenant `/[tenant]`; publicznie tylko produkty opublikowane. (bazowy)
- **FR4** — Rejestracja/login/logout klientów (`customers`); klient zalogowany u A jest anonimowy u B. (S1.2)
- **FR5** — Reset hasła e-mailem. (S1.7)
- **FR6** — Koszyk serwerowy (`carts`), jeden otwarty per klient+tenant, trwały między sesjami. (S1.2)
- **FR7** — Checkout wymaga logowania (gość poza zakresem). (S1.2)
- **FR8** — Walidacja serwerowa cen i tenanta przy add-to-cart i checkout; cena z klienta nigdy nie zaufana. (S1.2)
- **FR9** — Checkout = płatność przy odbiorze; zamówienie przez Local API. (bazowy/S1.2)
- **FR10** — Numer zamówienia `ZAM-RRRR-NNNNN` generowany przy tworzeniu. (nadpisanie bazowe)
- **FR11** — Snapshot pozycji (nazwa, wariant, cena jednostkowa) odporny na późniejsze zmiany. (nadpisanie bazowe)
- **FR12** — Adres dostawy wybierany/wpisywany i zapisywany w zamówieniu. (S1.3)
- **FR13** — CRUD adresów dostawy (pola PL; kod `^\d{2}-\d{3}$`). (S1.3)
- **FR14** — Automat stanów: `new → confirmed → preparing → out_for_delivery → delivered`, `cancelled` z każdego niedostarczonego, reaktywacja `cancelled → new`; niedozwolone przejścia odrzucane. (S1.5)
- **FR15** — Dostawca widzi tylko własne zamówienia, filtr po statusie, sort po dacie; `update` scopedowany na tenanta. (S1.4, SPIKE-A)
- **FR16** — Szczegóły zamówienia: panel dostawcy (edytowalny status) + front klienta read-only `/[tenant]/moje-zamowienia/[id]`, izolacja tenant+klient. (S1.6)
- **FR17** — E-mail potwierdzający przy składaniu; hook `sendStatusChange` na przyszłość; błędy e-mail logowane, nie blokują. (S1.7, S1.5)
- **FR18** — „Moje zamówienia" + zamów ponownie (zapis do koszyka serwerowego). (bazowy/S1.2)

**Łącznie FR: 18**

### Wymagania niefunkcjonalne (NFR) — wyodrębnione

- **NFR1** — Izolacja/bezpieczeństwo tenantów; odczyty frontu `overrideAccess: true` + ręczny filtr `{customer, tenant}`; cross-tenant → puste/403/404; test regresyjny `orders-tenant-isolation`.
- **NFR2** — Integralność cen: grosze (int); jedno źródło prawdy `cart-validation.ts` współdzielone przez koszyk i `placeOrder`.
- **NFR3** — Trwałość danych: snapshoty + numer zamówienia niezależne od edycji katalogu.
- **NFR4** — Odporność: e-maile best-effort; błędy SMTP łapane/logowane, nie psują zamówienia.
- **NFR5** — Lokalizacja: PL (`i18n` fallback `pl`); waluta PLN `zł`.
- **NFR6** — Poprawność hydratacji (Next 16 + Turbopack): zasady importu plików `'use server'`.
- **NFR7** — Dev: Postgres w Dockerze (`postgres:17`, `od-sasiada-pg`), nie Homebrew.

**Łącznie NFR: 7**

### Wymagania dodatkowe / ograniczenia

- **Poza zakresem:** koszyk/checkout gościa, e-mail per-tenant, okna dostawy (EPIC-2), e-mail o zmianie statusu w przepływie klienta (EPIC-2), zdjęcia/kategorie (EPIC-3), korekta wagi, łączenie gość→konto, SMS, fakturowanie operatora, pełne RODO.
- **Persony:** Operator (`platform-admin`), Dostawca (tenant), Klient (`customers`).
- **Ryzyka:** R1 (brak e-maili), R2 (izolacja przy `update`), R3 (migracja koszyka serwerowego).

### Ocena kompletności PRD

- ✅ Wszystkie FR mają jawne mapowanie na historyjki — dobra traceability u źródła.
- ✅ NFR konkretne i mierzalne (regex, nazwy plików, test regresyjny).
- ⚠️ FR nie mają jawnych kryteriów akceptacji w PRD (delegowane do plików stories) — sprawdzimy w krokach 3–4.
- ⚠️ Brak dokumentu UX — przepływy UI opisane tylko narracyjnie.
- ℹ️ PRD odtworzony po Sprincie 1 — ocena dotyczy spójności wstecznej, nie planowania pre-implementacyjnego.

---

## Epic Coverage Validation

**Stories EPIC-1 (8/8, wszystkie ✅ GOTOWE):** S1.1, SPIKE-A, S1.4, S1.5, S1.3, S1.7, S1.6, S1.2.

> Uwaga metodyczna: `epics.md` nie zawiera jawnej tablicy „FR Coverage Map". Mapowanie FR→historyjka pochodzi z kolumny „Historyjka" w PRD i zostało zweryfikowane krzyżowo z listą historyjek EPIC-1.

### Coverage Matrix

| FR | Skrót wymagania | Pokrycie (historyjka / źródło) | Status |
|----|-----------------|--------------------------------|--------|
| FR1 | Wielotenantowość + izolacja | SPIKE-A, S1.4 | ✅ Covered |
| FR2 | Produkt+Wariant „porcja", cena w groszach | S1.1 (+ baseline schema) | ✅ Covered |
| FR3 | Witryna `/[tenant]`, tylko opublikowane | **baseline** (brak dedykowanej historyjki) | ⚠️ Covered (baseline) |
| FR4 | Rejestracja/login/logout klientów | S1.0 (retro, dodane w remediacji) | ✅ Covered |
| FR5 | Reset hasła e-mailem | S1.7 | ✅ Covered |
| FR6 | Koszyk serwerowy `carts` | S1.2 | ✅ Covered |
| FR7 | Checkout wymaga logowania | S1.2 | ✅ Covered |
| FR8 | Walidacja serwerowa cen/tenanta | S1.2 | ✅ Covered |
| FR9 | Płatność przy odbiorze przez Local API | S1.2 (+ baseline) | ✅ Covered |
| FR10 | Numer zamówienia `ZAM-RRRR-NNNNN` | **nadpisanie bazowe** (brak dedykowanej historyjki) | ⚠️ Covered (baseline override) |
| FR11 | Snapshot pozycji zamówienia | **nadpisanie bazowe** (brak dedykowanej historyjki) | ⚠️ Covered (baseline override) |
| FR12 | Adres zapisywany w zamówieniu | S1.3 | ✅ Covered |
| FR13 | CRUD adresów (regex kodu PL) | S1.3 | ✅ Covered |
| FR14 | Automat stanów zamówienia | S1.5 | ✅ Covered |
| FR15 | Lista zamówień scopedowana, filtr/sort | S1.4, SPIKE-A | ✅ Covered |
| FR16 | Szczegóły zamówienia (panel + front) | S1.6 | ✅ Covered |
| FR17 | E-mail potwierdzenia + hook statusu | S1.7, S1.5 | ✅ Covered |
| FR18 | Moje zamówienia + zamów ponownie | S1.2 (+ baseline) | ✅ Covered |

### Missing Requirements

- **Brak FR bez ścieżki implementacji** — wszystkie 18 FR są traceable do historyjki EPIC-1 lub do funkcji bazowych platformy.
- **Brak FR z epików nieobecnych w PRD** — żadnego scope creep; EPIC-2/EPIC-3 są jawnie poza zakresem MVP i oznaczone TODO.

### Ostrzeżenia pokrycia (do weryfikacji w kroku 5)

- **FR3, FR10, FR11** (i częściowo FR9, FR18) są oznaczone jako pokryte przez **„baseline" / „nadpisanie bazowe"** — nie mają dedykowanych plików historyjek. Pokrycie jest twierdzone na poziomie platformy/konfiguracji, nie na poziomie historyjki z kryteriami akceptacji. To luka traceability na poziomie artefaktów (nie funkcjonalna, bo EPIC-1 jest GOTOWE), ale warto potwierdzić, że FR10 i FR11 (numer + snapshot — krytyczne dla NFR3) mają realne pokrycie w kodzie/testach.

### Coverage Statistics

- Łącznie FR w PRD: **18**
- FR z traceable pokryciem: **18**
- Pokrycie: **100%** (po remediacji: 16 przez dedykowane historyjki — w tym FR4→S1.0 — + 2 baseline/override: FR3, FR10/FR11)

---

## UX Alignment Assessment

### UX Document Status

**❌ Not Found** — brak dokumentu `*ux*.md` (potwierdzone w kroku 1).

### Czy UX jest implikowane?

**Tak, silnie.** To aplikacja user-facing z wieloma przepływami UI:
- Front klienta pod `/[tenant]/`: katalog, koszyk, checkout, „moje zamówienia", szczegóły zamówienia, konto (rejestracja/login/reset hasła), CRUD adresów.
- Panel admina dostawcy: lista zamówień (filtr/sort), edycja statusu, szczegóły zamówienia.
- Przepływy międzyekranowe: dodaj-do-koszyka → checkout (wybór adresu) → potwierdzenie + e-mail; zamów ponownie.

### UX ↔ PRD Alignment

- Przepływy są opisane **narracyjnie** w PRD (FR3, FR7, FR12, FR16, FR18) i w trasach architektury — spójne między sobą.
- Brak jednak: makiet/wireframe'ów, specyfikacji komponentów, stanów pustych/błędów/ładowania, walidacji formularzy po stronie UI, mapy nawigacji.

### UX ↔ Architecture Alignment

- ✅ Architektura wspiera wszystkie implikowane potrzeby UI: trasy Next App Router per-tenant, akcje serwerowe, izolacja odczytu dla widoków klienta, panel Payload dla dostawcy.
- ✅ NFR6 (granica hydratacji Turbopack) to faktycznie ograniczenie architektoniczne o bezpośrednim wpływie na UX (ciche awarie client-island) — dobrze, że jest udokumentowane.
- ⚠️ Brak wymagań wydajności front-endu / czasów ładowania / responsywności w NFR.

### Warnings

- ⚠️ **WARNING — brak dokumentu UX przy aplikacji user-facing.** Dla EPIC-1 (GOTOWE) ryzyko jest niskie wstecznie, ale dla EPIC-2/EPIC-3 (okna dostawy = nietrywialny UI wyboru slotu z cutoff/pojemnością; zdjęcia produktów = upload + galeria) brak specyfikacji UX jest realnym ryzykiem planistycznym.
- ⚠️ **Brak NFR usability/dostępność/responsywność** — żadnego wymagania a11y ani mobilnego, mimo że to sklep konsumencki (klienci najpewniej mobilni).
- ℹ️ Rekomendacja: przed EPIC-2 dodać lekki dokument UX (przepływy + stany ekranów) przynajmniej dla wyboru okna dostawy.

---

## Epic Quality Review

> Standard: best practices z create-epics-and-stories (wartość użytkownika, niezależność, brak zależności do przodu, sizing, jakość AC, traceability). Uwaga: EPIC-1 jest GOTOWE i udokumentowane wstecznie — przegląd dotyczy jakości artefaktów planistycznych, nie blokowania zakończonej pracy.

### Best Practices Compliance Checklist (EPIC-1)

- [x] Epic dostarcza wartość użytkownika — cel „dostawca wystawia → klient zamawia → realizacja przez automat stanów" jest user-centric. ✅
- [x] Epic funkcjonuje niezależnie — EPIC-1 stoi sam; EPIC-2/3 zależą tylko od EPIC-1, brak zależności do przodu między epikami. ✅
- [~] Historyjki odpowiednio zwymiarowane — większość M/L poprawnie; dwie pozycje techniczne (patrz niżej). 🟡
- [x] Brak zależności do przodu — kolejność budowania `S1.1→SPIKE-A→S1.4/S1.5→S1.3→S1.7→S1.6→S1.2` jest zgodna z deklarowanymi zależnościami (wszystkie wstecz). ✅
- [x] Tabele tworzone gdy potrzebne — S1.1 najpierw celowo (zmiana schematu), kolekcje z pluginów; brak „wszystko z góry". ✅
- [~] Jasne kryteria akceptacji — konkretne i testowalne, ale nie w formacie Given/When/Then. 🟡
- [x] Zachowana traceability do FR — po remediacji FR4 ma dedykowaną historyjkę S1.0; 16/18 przez historyjki, 3 FR baseline (FR3/FR10/FR11) pozostają jako Minor m4. ✅

### 🔴 Critical Violations

- **Brak.** Żadnego epiku technicznego bez wartości, żadnej zależności do przodu łamiącej niezależność, żadnej historyjki rozmiaru epiku.

### 🟠 Major Issues — wszystkie ✅ ROZWIĄZANE (remediacja 2026-06-21)

- **M1 — FR4 (rejestracja/login/logout klientów) nie ma historyjki implementującej.** ~~S1.2 i S1.7 deklarują „logowanie / konto klienta (auth)" jako zależność, ale żadna historyjka EPIC-1 nie dostarcza auth klienta.~~ → **✅ RESOLVED:** dodano retro-historyjkę `S1.0.md` (auth klienta: rejestracja/login/logout + reguła per-tenant + globalnie unikalny e-mail), `✅ GOTOWE · baseline`. FR4 w PRD przemapowane na S1.0; S1.0 dodane do tabeli EPIC-1 (9/9); zależności S1.2/S1.7 wskazują na S1.0.
- **M2 — Dowody testów wskazują na usunięte pliki.** ~~Każda historyjka cytuje skrypty `src/spike-*.ts`, usunięte w commicie `95d474f` — dowód nieodtwarzalny.~~ → **✅ RESOLVED:** wprowadzono runner testów (vitest + integracja Payload Local API), zaportowano inwarianty spike'ów do **9 trwałych plików testowych** w `tests/`; dodano skrypt `pnpm test`. Wynik: **39 passed / 1 skipped** (1 skip = celowy live-SMTP) na żywym Docker Postgres. Sekcje „Dowody testów" we wszystkich historyjkach przepięte na nowe testy.
- **M3 — Sprzeczność AC vs implementacja w S1.5.** ~~AC mówi „`access.update` ogranicza aktualizacje do tenanta", choć plugin sam pilnuje update.~~ → **✅ RESOLVED:** AC S1.5 (i podsumowanie w `epics.md`) przepisane na „aktualizacje scopedowane na tenanta — wymuszone przez plugin, własny `access.update` zbędny (zweryfikowane SPIKE-A)".

### 🟡 Minor Concerns

- **m1 — S1.1 i SPIKE-A to pozycje techniczne/badawcze.** S1.1 = zmiana konfiguracji/schematu (uzasadniona decyzją B2, ujęta jako wartość operatora); SPIKE-A = spike (z definicji bez wartości użytkownika, ale poprawnie oznaczony jako spike i wiążący ryzyko R2). Akceptowalne, lecz to nie „klasyczne" historyjki użytkownika.
- **m2 — Format AC nie jest Given/When/Then.** ACs są stylem listy kontrolnej; testowalne, ale niespójne z preferowanym BDD.
- **m3 — Brak historyjki setupu projektu.** Brak „Set up project from starter" — N/A, bo to istniejący projekt brownfield udokumentowany wstecznie; warto odnotować dla kontekstu greenfield/brownfield.
- **m4 — FR3/FR10/FR11/FR9/FR18 pokryte przez „baseline/nadpisanie bazowe"** bez dedykowanej historyjki (przeniesione z kroku 3). FR10 (numer zamówienia) i FR11 (snapshot) są krytyczne dla NFR3 — pokrycie istnieje w architekturze (`ordersCollectionOverride`), ale nie na poziomie historyjki z AC.

### Dependency Analysis (podsumowanie)

| Historyjka | Deklarowana zależność | Kierunek | Werdykt |
|---|---|---|---|
| S1.1 | — | — | ✅ |
| SPIKE-A | S1.1 | wstecz | ✅ |
| S1.4 | SPIKE-A | wstecz | ✅ |
| S1.5 | SPIKE-A | wstecz | ✅ |
| S1.3 | S1.1 | wstecz | ✅ |
| S1.7 | S1.5, **S1.0** (konto klienta) | wstecz | ✅ |
| S1.6 | S1.5 | wstecz | ✅ |
| S1.2 | S1.3, **S1.0** (logowanie) | wstecz | ✅ |

Brak zależności do przodu i brak cykli. Wiszące odwołanie do „auth klienta" zostało domknięte przez retro-historyjkę S1.0 (M1 RESOLVED) — wszystkie zależności są teraz wstecz do istniejących historyjek.

---

## Summary and Recommendations

### Overall Readiness Status

**✅ READY** — dla EPIC-1. (Po remediacji wszystkie 3 issues Major zamknięte.)

Kontekst: EPIC-1 jest GOTOWE (9/9 po dodaniu S1.0), a PRD/architektura/epiki odtworzone wstecznie. Brak blokerów funkcjonalnych: wszystkie 18 FR traceable (16 przez historyjki + 2 baseline), architektura spójna z PRD, brak zależności do przodu i brak konfliktów dokumentów. Pozostają wyłącznie Minor + brak dokumentu UX (rekomendacja przed EPIC-2).

### Critical Issues Requiring Immediate Action

- **Brak issue krytycznych (🔴).** Żaden problem nie blokuje implementacji ani nie podważa zakończonego EPIC-1.

### Major Issues — status po remediacji (🟠 → ✅)

1. **M1 — FR4 (auth klienta) bez historyjki.** → **✅ RESOLVED:** dodano retro-historyjkę `S1.0.md`; FR4 przemapowane na S1.0; zależności S1.2/S1.7 domknięte.
2. **M2 — Dowody testów wskazują na usunięte `src/spike-*.ts`.** → **✅ RESOLVED:** runner testów (vitest + Payload), 9 trwałych testów w `tests/`, `pnpm test` = 39 passed / 1 skipped; odwołania w historyjkach przepięte.
3. **M3 — Sprzeczność w AC S1.5.** → **✅ RESOLVED:** AC S1.5 i `epics.md` poprawione (izolacja update wymuszona przez plugin).

### Recommended Next Steps

1. ✅ ~~Domknąć traceability FR4~~ — zrobione (S1.0). Pozostaje opcjonalnie udokumentować FR3/FR10/FR11 baseline na poziomie historyjki (Minor m4).
2. ✅ ~~Utwardzić dowody testów~~ — zrobione (vitest + `tests/`, `pnpm test`).
3. ✅ ~~Poprawić AC S1.5~~ — zrobione.
4. **Przed EPIC-2/EPIC-3: dodać lekki dokument UX** (przepływy + stany ekranów), szczególnie dla wyboru okna dostawy (nietrywialny UI z cutoff/pojemnością) i uploadu zdjęć; dodać NFR usability/dostępność/responsywność (sklep konsumencki, klienci mobilni). *(pozostaje otwarte)*

### Final Note

Ocena wykryła pierwotnie **8 problemów** w **3 kategoriach severity** (0 krytycznych, 3 major, 5 minor) plus 1 brak dokumentu (UX). **Wszystkie 3 issues Major zostały rozwiązane w remediacji 2026-06-21.** Pozostają Minor (m1–m4) oraz brak dokumentu UX — rekomendowane do adresowania **przed EPIC-2**. EPIC-1: READY, bez blokerów.

---

## Remediation Log (2026-06-21)

Naprawy wykonane przez subagentów; decyzje podjęte w wątku nadrzędnym.

| Issue | Decyzja | Działanie | Artefakty |
|---|---|---|---|
| **M1** | Retro-historyjka | Utworzono S1.0 (auth klienta); FR4→S1.0; S1.0 w tabeli EPIC-1 (9/9) | `stories/S1.0.md`, `PRD.md`, `epics.md` |
| **M2** | Wprowadzić runner testów | vitest + integracja Payload; 9 testów; `pnpm test` = **39 pass / 1 skip** (live DB); odwołania w historyjkach przepięte | `vitest.config.ts`, `tests/**`, `package.json`, wszystkie `stories/*.md` |
| **M3** | Poprawka tekstu | AC S1.5 przepisane (izolacja update przez plugin) | `stories/S1.5.md`, `epics.md` |

**Stan po remediacji:** Major 3/3 ✅ RESOLVED · Critical 0 · pozostają Minor m1–m4 + brak UX (przed EPIC-2). Zmiany w drzewie roboczym, niezacommitowane.

---

**Assessor:** Claude (rola: Product Manager — requirements traceability)
**Data:** 2026-06-21 (ocena) · 2026-06-21 (remediacja M1–M3)
**Język oceny:** Polski
