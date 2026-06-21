# Epiki — od-sasiada.pl

> Status: odtworzony 2026-06-20 (po Sprint 1). Linki krzyżowe: [PRD.md](./PRD.md), [architecture.md](./architecture.md). ID (EPIC-1, S1.x) są **stabilne** i wielokrotnie używane przez strumień implementation-artifacts.

## EPIC-1 — Fundament workflow dostawcy

**Cel (= Cel Sprintu 1):** dostawca wystawia towary → zalogowany klient zamawia → dostawca realizuje zamówienie przez automat stanów do dostawy, z potwierdzeniem e-mailem. Aplikacja jest realistycznie gotowa na pilota z pierwszym dostawcą.

**Status:** ✅ ukończone — 9/9 ticketów GOTOWE (8 ze Sprintu 1 + S1.0 bazowy auth).

**Zablokowane decyzje:** B1 (zapisane adresy + snapshot zamówienia), B2 (inwentarz wyłączony), B3 (automat stanów liniowy z cofaniem + scopedowany na tenanta `update`), B4 (serwerowy koszyk + wymuszone logowanie). Patrz architecture.md.

**Kolejność budowania:** `S1.0 (auth, bazowy) → S1.1 → SPIKE-A → S1.4 / S1.5 → S1.3 → S1.7 → S1.6 → S1.2`. Auth (S1.0) musi istnieć przed S1.2 (wymuszone logowanie) i jest częścią „konta klienta” wymaganego przez S1.7.

### Historyjki

| ID | Twierdzenie historyjki | Est. | Status | Zależy od |
|----|------------------------|------|--------|-----------|
| **S1.0** | Jako klient chcę zarejestrować konto, zalogować się i wylogować u konkretnego dostawcy (kolekcja `customers` z autentykacją, ciasteczko `payload-token`), aby konto u dostawcy A nie dawało dostępu u dostawcy B (e-mail globalnie unikalny, niedopasowanie tenanta odrzucane przy logowaniu). | S | ✅ GOTOWE | — (bazowy; auth wymagany przez S1.2 i S1.7) |
| **S1.1** | Jako operator platformy chcę wyłączyć śledzenie inwentarza (konfiguracja + migracja schematu), aby towary świeże/sezonowe nie były blokowane przez stan magazynowy. | S | ✅ GOTOWE | — (pierwsza; zmienia schemat) |
| **SPIKE-A** | Jako operator platformy chcę udowodnić izolację tenantów przy `update` zamówienia (test bezpieczeństwa), aby dostawca B nie mógł modyfikować zamówień dostawcy A (oczekiwane 403/404). | S | ✅ GOTOWE — plugin pilnuje `update`; własny `access.update` niepotrzebny | S1.1 |
| **S1.4** | Jako dostawca chcę listę zamówień scopedowaną na tenanta w panelu (filtrowanie po statusie, sortowanie po dacie), aby widzieć i segregować tylko własne zamówienia. | S | ✅ GOTOWE | SPIKE-A |
| **S1.5** | Jako dostawca chcę automat stanów zamówienia (liniowy z cofaniem) plus hook `afterChange`, aby prowadzić zamówienie od nowego do dostarczonego z tylko dozwolonymi przejściami. | M | ✅ GOTOWE | SPIKE-A |
| **S1.3** | Jako klient chcę zapisywać/edytować/usuwać adresy dostawy (pola PL) i wybierać jeden przy checkout, aby zamawianie było szybkie, a adres był zapisywany w zamówieniu. | M | ✅ GOTOWE | S1.1 |
| **S1.7** | Jako klient chcę e-mail potwierdzający zamówienie i działający reset hasła, aby mieć dowód zamówienia i móc odzyskać konto. | M | ✅ GOTOWE | S1.5 (hook), S1.0 (konto klienta / auth) |
| **S1.6** | Jako dostawca i klient chcę pełne szczegóły zamówienia (panel = edytowalne; frontend = tylko do odczytu, izolowane tenant+klient), aby obie strony widziały dokładnie, co zostało zamówione. | M | ✅ GOTOWE | S1.5 |
| **S1.2** | Jako klient chcę trwały serwerowy koszyk z wymuszonym logowaniem przy checkout, aby mój koszyk przetrwał między sesjami, a ceny były walidowane serwerowo (refaktor koszyk-store/placeOrder/reorder). | L | ✅ GOTOWE | S1.3, S1.0 (logowanie) |

### Kryteria akceptacji (podsumowanie)

- **S1.0** — rejestracja/login/logout klienta na kolekcji `customers`; sesja w ciasteczku `payload-token`; e-mail globalnie unikalny; niedopasowanie tenanta odrzucane przy logowaniu; klient zalogowany u A jest anonimowy u B.
- **S1.1** — `inventory: false`; kolumny `inventory` usunięte; `pnpm dev` startuje; seed + place-order przechodzą.
- **SPIKE-A** — admin tenantu B nie może `update` zamówienia tenantu A (403/404); test regresyjny `orders-tenant-isolation`.
- **S1.4** — dostawca widzi tylko własne zamówienia; filtr statusu; sortowanie po dacie.
- **S1.5** — enum `status`; tylko przejścia automatu stanów dozwolone (z cofaniem); aktualizacje scopedowane na tenanta przez plugin (własny `access.update` zbędny — zweryfikowane SPIKE-A); `afterChange` wykrywa zmianę statusu (zastępczy stub powiadomienia).
- **S1.3** — zapis/edytacja/usuwanie adresu; checkout wybiera z listy lub dodaje nowy; kod pocztowy `^\d{2}-\d{3}$`; snapshot adresu do zamówienia.
- **S1.7** — adapter e-maila skonfigurowany; e-mail "zamówienie otrzymane" po złożeniu; reset hasła klienta działa.
- **S1.6** — pełne szczegóły zamówienia w panelu (snapshot, adres, kontakt, edytowalny status) i na froncie klienta (tylko do odczytu, izolacja tenant+klient).
- **S1.2** — checkout wymaga logowania; koszyk utrzymywany na `Carts` (per klient); `placeOrder` odczytuje pozycje z `Carts` (nie ufa klientowi); `reorder` zapisuje do `Carts`.

## EPIC-2 — Okna dostawy i powiadomienia o statusie

**Cel (= Cel Sprintu 2):** zalogowany klient wybiera w checkoucie termin (slot) dostawy walidowany serwerowo względem cutoffu, limitu miejsc i wyjątków dni, zrzucony (snapshot) do zamówienia; przy istotnej zmianie statusu dostaje maila — domykając pętlę „zamów → wiem kiedy dojedzie → wiem co się dzieje".

**Status:** 📋 zaplanowany — wszystkie historie ☐ TODO. FR19–FR26 (PRD §3). Pełne AC: pliki `stories/S2.*` + `stories/SPIKE-S2.md`. Rejestr ryzyk / decyzje (historia): [`docs/archive/sprint-2.md`](../../docs/archive/sprint-2.md).

**Zablokowane decyzje (O1–O8):** O1 stałe okna; O2 cutoff jako godzina dzienna; **O3 dedykowana kolekcja `DeliverySlots`** (nie `tenant.settings`); **O4 capacity w sprincie** (limit miejsc, walidacja odporna na wyścig); O5 maile na milestone'ach; O6 mail przy `cancelled`, ciche cofnięcia; **O7 wyjątki dni w sprincie**; O8 slot wymagany, gdy tenant ma okna. Reguła capacity przy `cancelled`: **zwalniamy miejsce; `cancelled→new` re-waliduje** (zatwierdzone).

**Kolejność budowania:** `SPIKE-S2 → S2.1 → S2.8 → S2.2 → S2.3 → S2.7 → S2.4 → S2.5 → S2.6` (S2.9 PARK).

### Historyjki

| ID | Twierdzenie historyjki | Est. | Status | Zależy od |
|----|------------------------|------|--------|-----------|
| **SPIKE-S2** | Jako operator chcę potwierdzić kształt kolekcji `DeliverySlots` (O3) i matematykę cutoffu (strefa PL/Europe-Warsaw), w tym podejście do wyjątków dni (O7) i współbieżności capacity (O4), by reszta S2 budowała się na pewnym fundamencie. | M | ☐ TODO | — (pierwsza) |
| **S2.1** | Jako dostawca chcę skonfigurować tygodniowe okna dostawy + cutoff + limit miejsc w dedykowanej kolekcji `DeliverySlots` (multi-tenant), by klient wybierał tylko realne terminy. | L | ☐ TODO | SPIKE-S2 |
| **S2.8** | Jako dostawca chcę oznaczać konkretne daty jako niedostępne (wyjątki/override harmonogramu), by sloty z tych dni nie były oferowane (O7). | M | ☐ TODO | S2.1 |
| **S2.2** | Jako klient chcę wybrać w checkoucie termin dostawy z listy dostępnych slotów, by wiedzieć kiedy dojedzie zamówienie. | M | ☐ TODO | S2.1, S2.8 |
| **S2.3** | Jako operator chcę serwerowej walidacji cutoffu w `placeOrder`, by nie dało się wybrać slotu zamkniętego/przeszłego/wyłączonego (klientowi nie ufamy). | M | ☐ TODO | S2.2 |
| **S2.7** | Jako operator chcę serwerowej walidacji DOSTĘPNOŚCI slotu (capacity) odpornej na wyścig przy `placeOrder`, by dwoje klientów nie zarezerwowało ostatniego miejsca naraz i slot pełny znikał z listy (O4). | M | ☐ TODO | S2.3 |
| **S2.4** | Jako dostawca i klient chcę widzieć wybrany slot w szczegółach zamówienia (panel + front read-only) i w mailu potwierdzającym, by termin był wiążącym snapshotem zamówienia. | S | ☐ TODO | S2.7 |
| **S2.5** | Jako klient chcę dostawać maila przy istotnej zmianie statusu (PL, milestone'y, bez spamu przy cofnięciu) — **zawężenie istniejącego `sendStatusChange`, który dziś wysyła na każdej zmianie** — by wiedzieć co się dzieje bez dzwonienia. | M | ☐ TODO | S1.5 (hook istnieje) |
| **S2.6** | Jako operator chcę PL-izacji treści maili (potwierdzenie + status) i dodania slotu/kontaktu dostawcy, by komunikacja była po polsku i kompletna. | S | ☐ TODO | S2.4, S2.5 |
| **S2.9** | Jako dostawca chcę widoku dziennego obłożenia slotów w panelu (zajęte/limit per slot), by planować rozwóz. | M | ☐ TODO (PARK) | S2.1, S2.7 |

## EPIC-3 — Media i kategorie

**Cel (= Cel Sprintu 3):** dostawca dodaje zdjęcia i kategorie produktów, a klient przegląda katalog ze zdjęciami i filtruje po kategoriach — wszystko izolowane per-tenant.

**Status:** 📋 zaplanowany — wszystkie historie ☐ TODO. FR27–FR32 (PRD §3). Pełne AC: pliki `stories/S3.*` + `stories/SPIKE-S3.md`. Rejestr ryzyk / decyzje (historia): [`docs/archive/sprint-3.md`](../../docs/archive/sprint-3.md).

**Zablokowane decyzje (D1–D7):** **D1 storage = Vercel Blob** (deploy = Vercel, ENV przez Marketplace); D2 jedno hero (galeria → backlog); **D3 zdjęcie na produkcie ORAZ wariancie** (fallback wariant→produkt→placeholder); **D4 wiele kategorii na produkt (`hasMany`)**; D5 kategorie per-tenant; D6 zdjęcie opcjonalne; D7 kategoria opcjonalna.

**Kolejność budowania:** `SPIKE-S3 → S3.1 → S3.2 → S3.3 → S3.4 → S3.5 → S3.6` (S3.4 równolegle do S3.1; upload UX S3.7 domyka się w S3.1).

### Historyjki

| ID | Twierdzenie historyjki | Est. | Status | Zależy od |
|----|------------------------|------|--------|-----------|
| **SPIKE-S3** | Jako operator chcę potwierdzić: kolekcja Upload + plugin-multi-tenant (pole `tenant`, izolacja access) + serwowanie obrazów per-tenant + adapter **Vercel Blob** — działa lokalnie i ma ścieżkę na deploy Vercel. | S | ☐ TODO | — (pierwsza; zmienia config + zależności deploy) |
| **S3.1** | Jako dostawca chcę kolekcji `Media` (Upload) per-tenant (access ograniczający do własnych mediów; `sharp` rozmiary; `alt`; storage Vercel Blob), by wgrywać zdjęcia produktów. | M | ☐ TODO | SPIKE-S3 |
| **S3.2** | Jako dostawca chcę przypisać pojedyncze hero do produktu **oraz** wariantu (oba opcjonalne, izolacja tenant-match; wariant nadpisuje hero produktu), by prezentować właściwe zdjęcie (D3). | M | ☐ TODO | S3.1 |
| **S3.3** | Jako klient chcę widzieć zdjęcie na katalogu `/[tenant]` i w szczegółach zamówienia (`next/image`, fallback wariant→produkt→placeholder), by wiedzieć co kupuję (D3). | M | ☐ TODO | S3.2 |
| **S3.4** | Jako dostawca chcę kolekcji `Categories` per-tenant z relacją produkt↔kategoria **`hasMany`** (wiele kategorii na produkt), by porządkować katalog (D4). | M | ☐ TODO | — (równolegle do S3.1) |
| **S3.5** | Jako dostawca chcę zarządzać tylko własnymi kategoriami w panelu (CRUD tenant-scoped; B nie widzi kategorii A), by mieć izolowaną taksonomię. | S | ☐ TODO | S3.4 |
| **S3.6** | Jako klient chcę filtrować katalog `/[tenant]` po kategorii (`?kategoria=`, server-side, `tenant` zawsze w `where`; produkt z wieloma kategoriami widoczny w każdej), by szybciej znaleźć produkty (D4). | M | ☐ TODO | S3.4, S3.3 |

## Dalszy backlog

*Jeszcze nie w rozmiarze epiku: korekta wagi przy dostawie (faza 2), e-mail klienta per-tenant, łączenie gość→konto, SMS, galeria zdjęć, hierarchia kategorii. Odłożone poza MVP: fakturowanie operatora (3+ tenantów), pełne RODO.*
