# Epiki — od-sasiada.pl

> Status: odtworzony 2026-06-20 (po Sprint 1). Linki krzyżowe: [PRD.md](./PRD.md), [architecture.md](./architecture.md). ID (EPIC-1, S1.x) są **stabilne** i wielokrotnie używane przez strumień implementation-artifacts.

## EPIC-1 — Fundament workflow dostawcy

**Cel (= Cel Sprintu 1):** dostawca wystawia towary → zalogowany klient zamawia → dostawca realizuje zamówienie przez automat stanów do dostawy, z potwierdzeniem e-mailem. Aplikacja jest realistycznie gotowa na pilota z pierwszym dostawcą.

**Status:** ✅ ukończone — 8/8 ticketów GOTOWE.

**Zablokowane decyzje:** B1 (zapisane adresy + snapshot zamówienia), B2 (inwentarz wyłączony), B3 (automat stanów liniowy z cofaniem + scopedowany na tenanta `update`), B4 (serwerowy koszyk + wymuszone logowanie). Patrz architecture.md.

**Kolejność budowania:** `S1.1 → SPIKE-A → S1.4 / S1.5 → S1.3 → S1.7 → S1.6 → S1.2`.

### Historyjki

| ID | Twierdzenie historyjki | Est. | Status | Zależy od |
|----|------------------------|------|--------|-----------|
| **S1.1** | Jako operator platformy chcę wyłączyć śledzenie inwentarza (konfiguracja + migracja schematu), aby towary świeże/sezonowe nie były blokowane przez stan magazynowy. | S | ✅ GOTOWE | — (pierwsza; zmienia schemat) |
| **SPIKE-A** | Jako operator platformy chcę udowodnić izolację tenantów przy `update` zamówienia (test bezpieczeństwa), aby dostawca B nie mógł modyfikować zamówień dostawcy A (oczekiwane 403/404). | S | ✅ GOTOWE — plugin pilnuje `update`; własny `access.update` niepotrzebny | S1.1 |
| **S1.4** | Jako dostawca chcę listę zamówień scopedowaną na tenanta w panelu (filtrowanie po statusie, sortowanie po dacie), aby widzieć i segregować tylko własne zamówienia. | S | ✅ GOTOWE | SPIKE-A |
| **S1.5** | Jako dostawca chcę automat stanów zamówienia (liniowy z cofaniem) plus hook `afterChange`, aby prowadzić zamówienie od nowego do dostarczonego z tylko dozwolonymi przejściami. | M | ✅ GOTOWE | SPIKE-A |
| **S1.3** | Jako klient chcę zapisywać/edytować/usuwać adresy dostawy (pola PL) i wybierać jeden przy checkout, aby zamawianie było szybkie, a adres był zapisywany w zamówieniu. | M | ✅ GOTOWE | S1.1 |
| **S1.7** | Jako klient chcę e-mail potwierdzający zamówienie i działający reset hasła, aby mieć dowód zamówienia i móc odzyskać konto. | M | ✅ GOTOWE | S1.5 (hook), konto klienta |
| **S1.6** | Jako dostawca i klient chcę pełne szczegóły zamówienia (panel = edytowalne; frontend = tylko do odczytu, izolowane tenant+klient), aby obie strony widziały dokładnie, co zostało zamówione. | M | ✅ GOTOWE | S1.5 |
| **S1.2** | Jako klient chcę trwały serwerowy koszyk z wymuszonym logowaniem przy checkout, aby mój koszyk przetrwał między sesjami, a ceny były walidowane serwerowo (refaktor koszyk-store/placeOrder/reorder). | L | ✅ GOTOWE | S1.3, logowanie |

### Kryteria akceptacji (podsumowanie)

- **S1.1** — `inventory: false`; kolumny `inventory` usunięte; `pnpm dev` startuje; seed + place-order przechodzą.
- **SPIKE-A** — admin tenantu B nie może `update` zamówienia tenantu A (403/404); test regresyjny `orders-tenant-isolation`.
- **S1.4** — dostawca widzi tylko własne zamówienia; filtr statusu; sortowanie po dacie.
- **S1.5** — enum `status`; tylko przejścia automatu stanów dozwolone (z cofaniem); `update` scopedowany na tenanta; `afterChange` wykrywa zmianę statusu (zastępczy stub powiadomienia).
- **S1.3** — zapis/edytacja/usuwanie adresu; checkout wybiera z listy lub dodaje nowy; kod pocztowy `^\d{2}-\d{3}$`; snapshot adresu do zamówienia.
- **S1.7** — adapter e-maila skonfigurowany; e-mail "zamówienie otrzymane" po złożeniu; reset hasła klienta działa.
- **S1.6** — pełne szczegóły zamówienia w panelu (snapshot, adres, kontakt, edytowalny status) i na froncie klienta (tylko do odczytu, izolacja tenant+klient).
- **S1.2** — checkout wymaga logowania; koszyk utrzymywany na `Carts` (per klient); `placeOrder` odczytuje pozycje z `Carts` (nie ufa klientowi); `reorder` zapisuje do `Carts`.

## Przyszłe epiki

- **EPIC-2 — Okna dostawy i powiadomienia o statusie** (📋 zaplanowany, decyzje ZABLOKOWANE → patrz [`docs/sprint-2.md`](../../docs/sprint-2.md)): wybór okna czasowego dostawy z cutoff; e-mail o zmianie statusu do klienta (hook `sendStatusChange` już istnieje). Rozbity na **S2.1–S2.9 + SPIKE-S2** — wszystkie ☐ TODO; decyzje O1–O8 rozstrzygnięte (O3 dedykowana kolekcja `DeliverySlots`, O4 pojemność w sprincie, O7 wyjątki dzienne w sprincie → sprint urósł: S2.1 M→L, +S2.7 pojemność, +S2.8 wyjątki, SPIKE S→M).
- **EPIC-3 — Media i kategorie** (📋 zaplanowany, decyzje ZABLOKOWANE → patrz [`docs/sprint-3.md`](../../docs/sprint-3.md)): zdjęcia produktów przez kolekcję Media per-tenant; kategorie produktów. Rozbity na **S3.1–S3.6 + SPIKE-S3** — wszystkie ☐ TODO; decyzje D1–D7 rozstrzygnięte (D1 Vercel Blob, D3 obraz produktu+wariantu → S3.2 S→M, D4 multi-kategoria hasMany).

*Dalszy backlog (jeszcze nie w rozmiarze epiku): korekta wagi przy dostawie (faza 2), e-mail klienta per-tenant, łączenie gość→konto, SMS. Odłożone poza MVP: fakturowanie operatora (3+ tenantów), pełne RODO.*
