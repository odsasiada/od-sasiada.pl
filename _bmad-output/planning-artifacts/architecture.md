# Architektura — od-sasiada.pl

> Status: odtworzony 2026-06-20 (po Sprint 1). Poziom: System Architect. Linki krzyżowe: [PRD.md](./PRD.md), [epics.md](./epics.md). ID decyzji B1–B4 odzwierciedlają epics.md / sprint-1.md.

## 1. Stack technologiczny

| Warstwa | Wybór | Uwagi |
|---------|-------|-------|
| CMS / backend | PayloadCMS 3.85 | Local API używane do wszystkich serwerowych dostępow do danych. |
| E-commerce | `@payloadcms/plugin-ecommerce` 3.85.1 | produkty/warianty/koszyki/zamówienia/adresy/transakcje; **inwentarz wyłączony**; waluta PLN. |
| Wielotenantski | `@payloadcms/plugin-multi-tenant` | dodaje `tenant_id` do kolekcji ecommerce + klientów; `platform-admin` = wszyscy tenanci. |
| Framework webowy | Next 16, App Router, Turbopack | frontend pod `src/app/(frontend)/[tenant]/`. |
| Baza danych | Postgres (przez `@payloadcms/db-postgres`) | Kontener **Docker** `od-sasiada-pg` (nie Homebrew). |
| E-mail | `@payloadcms/email-nodemailer` (SMTP) | adres-from/host/port z env; secure wywnioskowane z portu (465 implicit TLS, 587 STARTTLS). |
| Edytor | `@payloadcms/richtext-lexical` | |
| Lint/format | Biome | |
| i18n | Tłumaczenia Payload `pl`, fallback `pl` | witryna/admin po polsku; dokumenty po angielsku. |
| Storage mediów (EPIC-3) | `@payloadcms/storage-vercel-blob` + `@vercel/blob` | Vercel Blob; `BLOB_READ_WRITE_TOKEN` via integrację Vercel Marketplace. Dysk lokalny odrzucony (host efemeryczny). **Do potwierdzenia: SPIKE-S3.** |
| Deployment | Vercel | Cel deploy = Vercel (przesądza wybór storage — decyzja D1). |

## 2. Model wielotenantski

Trzy typy aktorów:

- **Operator** — rekord `Users` z rolą `platform-admin` → `userHasAccessToAllTenants` zwraca true → dostęp między-tenantski w panelu.
- **Dostawca (tenant)** — rekord `Tenants`; admini dostawców są przypisani do swojego tenanta. Tenant ma `settings` (isActive, contactPhone, minOrderValue, priceNotice).
- **Klient** — kolekcja `Customers` (z autentykacją), każdy powiązany z jednym tenantem.

**Izolacja jest wymuszana na trzech warstwach:**

1. **Panel admina** — plugin wielotenantski ogranicza adminów tenantów do wierszy ich tenanta; `platform-admin` pomija to ograniczenie.
2. **Local API (ścieżki zapisu)** — plugin ecommerce pilnuje `update` zamówienia pod kątem tenanta (potwierdzone przez SPIKE-A; własny `access.update` okazał się niepotrzebny). Koszyki/zamówienia mają pieczęć `tenant` dodaną Explicitly z konta klienta na serwerze (nigdy akceptowane z klienta).
3. **Frontend (ścieżki odczytu)** — publiczne/odczyty klientów używają `overrideAccess: true` z **ręcznym filtrem `where`**. Katalog: `where { _status: published, tenant }`. Moje-zamówienia/szczegóły-zamówienia: `where { customer, tenant }`. Klient zalogowany u tenanta A jest traktowany jako anonimowy u tenanta B (`getCurrentCustomer(tenantId)` zwraca klienta tylko gdy `customer.tenant === tenantId`).

## 3. Model domenowy/danych

- **Produkty + Warianty — model "porcja".** Produkt nadpisany, aby dodać `title` + `description`; cena w `priceInPLN` (grosze). Warianty reprezentują porcje; **cena wariantu wygrywa** nad ceną produktu, gdy wariant jest wybrany. Katalog odkrywa tylko wiersze `_status: published` dla tenanta.
- **Koszyki** (ecommerce `carts`, serwerowy singleton per klient+tenant). Pozycje: `items[] { product, variant?, quantity }`; również `status` enum (`active|purchased|abandoned`), `subtotal`, `currency` i wymagane `tenant`. Find-or-create scopeduje przez **wyłącznie klienta + tenanta** (jeden otwarty koszyk na parę).
- **Zamówienia** (ecommerce `orders`, nadpisane przez `ordersCollectionOverride`):
  - `orderNumber` `ZAM-RRRR-NNNNN` — generowany w hooku `beforeValidate` przy tworzeniu (licznik roczny przez `payload.count`); `unique`, `index`, używany jako tytuł admina.
  - **Snapshoty pozycji** — `productNameSnapshot`, `variantLabelSnapshot`, `unitPriceSnapshot` (grosze) dodane do tablicy `items` (zagnieżdżone w zakładkach) i wypełniane przy tworzeniu z bazy.
  - Pole `status` zastąpione przez select automatu stanów; `beforeChange` waliduje przejścia; `afterChange` wywołuje e-maile potwierdzające/statusowe.
  - `amount` (suma, grosze) + `currency`; blok snapshotu `shippingAddress` (firstName/lastName/addressLine1/postalCode/city/phone).
- **Klienci** — per-tenant, z autentykacją. Rejestracja/logowanie/wylogowanie przez Local API z ręcznym ciasteczkiem `payload-token` z akcji serwerowej.
- **Adresy** (ecommerce `addresses`, relacja `addresses.customer`, dostęp `isDocumentOwner`). Kod pocztowy PL walidowany `^\d{2}-\d{3}$` przez nadpisanie `addressFields`. Wybrany adres jest **zapisywany w zamówieniu** (B1) — zapisany adres pozostaje do wielokrotnego użycia.
- **Ceny** — wszystko w **groszach** (liczby całkowite; 130 = 1,30 zł). `formatPLN` dzieli przez 100; waluta PLN skonfigurowana z symbolem `zł`.

## 4. Kluczowe decyzje architektoniczne

| ID | Decyzja | Uzasadnienie | Kompromis |
|----|---------|--------------|-----------|
| **B1** | Zapisane adresy dostawy w kolekcji pluginowej `addresses` **plus** snapshot adresu w każdym zamówieniu. | Szybki powtórny checkout (ponowne użycie zapisanego adresu) bez utraty dokładnego adresu, na który wysłano zamówienie. | Dane adresowe zduplikowane (zapis vs. snapshot); edycje zapisanego adresu nie zmieniają wstecznie starych zamówień (zamierzone). |
| **B2** | `inventory: false`. | Towary świeże/sezonowe nie są magazynem; liczenie stanu jest bezsensowne i blokowałoby zamawianie. | Brak ochrony przed overselling; dostępność obsługiwana poza systemem (dostawca potwierdza telefonicznie/e-mailem). |
| **B3** | Workflow zamówienia = **automat stanów liniowy z cofaniem** (`new→confirmed→preparing→out_for_delivery→delivered`, `cancelled` z każdego niedostarczonego, reaktywacja `cancelled→new`); `update` scopedowany na tenanta. | Odzwierciedla prawdziwy workflow dostawy świeżych produktów; cofanie obsługuje błędy; przejścia walidowane centralnie w `order-status.ts`. | Pojedyncza ścieżka liniowa — brak równoległego/rozgałęzionego fulfillment; reguły przejść wymuszane przez aplikację (hook), nie ograniczenia bazy. |
| **B4** | **Serwerowy koszyk** na `Carts` + **wymuszone logowanie** przed checkoutem. | Koszyk przeżywa sesje; cena/tenant walidowane autorytatywnie serwerowo; zamówienia wiarygodnie przypisane do klienta. | Brak checkoutu gościa (odłożone); akcja serwerowa nie ma kontekstu żądania, więc `tenant` musi być dodawany ręcznie. |

## 5. Bezpieczeństwo / izolacja

- Brak odczytu/zapisu zamówień, katalogu, koszyków, klientów, adresów między-tenantami (NFR1). Izolacja zapisu przez plugin + explicite dodany tenant; izolacja odczytu przez `overrideAccess` + ręczne `where { customer, tenant }`.
- Test regresyjny `orders-tenant-isolation` (SPIKE-A / R2) potwierdza, że dostawca B nie może `update` zamówienia dostawcy A.
- **Uwaga dotycząca auth klientów:** unikalność e-maili jest **globalna** (domyślne Payload) — ten sam e-mail nie może się zarejestrować u dwóch dostawców. Niedopasowanie tenantów jest odrzucane przy logowaniu, więc jest to *bezpieczne*, ale jeszcze nie "oddzielne konto per dostawca". Przyszłość: usunięcie globalnej unikalności, dodanie złożonej unikalności `(tenant, email)` + własna logika logowania.

## 6. Walidacja cen (zasada serwerowa)

`src/lib/cart-validation.ts` jest **pojedynczym źródłem prawdy** dla legalności pozycji i ceny — czystym modułem (BEZ `'use server'`, bez `next/headers`, bez `@/lib/auth`, bez Reacta), bezpiecznym do importu zarówno z komponentów serwerowych, jak i plików akcji z `'use server'`. Jest współdzielony przez `cart-actions.ts` i `placeOrder`.

`validateLineItem` odczytuje produkt/wariant z bazy (`overrideAccess: true`) i potwierdza: produkt istnieje, należy do tego tenanta, jest opublikowany; wariant (jeśli istnieje) należy do tego tenanta i tego produktu, jest opublikowany. **Cena jednostkowa jest zawsze odczytywana z bazy (wariant wygrywa); cena klienta nigdy nie jest zaufana.** Ceny są ponownie walidowane autorytatywnie przy checkout, ponieważ mogą się zmienić między dodaniem do koszyka a `placeOrder`.

## 7. Znane pułapki / ograniczenia

| Ograniczenie | Szczegół | Źródło |
|--------------|----------|--------|
| Eksplcite `products: true` | Plugin ecommerce **nie** tworzy produktów/wariantów/koszyków, chyba że `products` zostanie przekazane explicite, mimo że dokumenty mówią o domyślnej wartości true (`sanitizePluginConfig` stosuje domyślne wartości produktów tylko wewnątrz `if (config.products)`). Kolejność pluginów `[ecommerce, multiTenant]`. | `ecommerce-plugin-products-gotcha` |
| Zamówienia to tylko referencje | Zamówienie pluginowe = `items[] { product, variant, quantity }` + `amount` + `currency`; **bez snapshotów per pozycja, bez numeru zamówienia**, enum statusu to `processing/completed/...`. Snapshoty + `orderNumber` + status dostawy dodane przez `ordersCollectionOverride`. | `ecommerce-order-model` |
| Gotówka pomija płatność z góry | Zamówienia tworzone bezpośrednio przez Local API (bez PaymentAdapter / Stripe). | `ecommerce-order-model` |
| `carts.tenant` wymagane, `status` niezapytywalne | `tenant` wymagane i **nie** auto-populowane w akcji serwerowej (pieczęć z konta klienta). `status` **nie jest zapytywalną ścieżką** (`QueryError`) → find-or-create scopeduje tylko przez klienta+tenanta, nigdy nie filtruje po `status`. | `carts-collection-gotchas` |
| `'use server'` + granica hydratacji Turbopack | Plik akcji z `'use server'` importowany przez komponent kliencki musi (1) importować `next/headers` **bezpośrednio** (nie przez `@/lib/auth`), (2) nie być podwójnie importowany przez komponent serwerowy *i* kliencki. Helpery odczytu podzielone na zwykłe moduły (`@/lib/addresses.ts`, `@/lib/cart`). Typy wejściowe akcji trzymane inline. Naruszenie → cicha awaria hydratacji client-island (bez błędu). | `use-server-turbopack-gotcha` |
| Docker, nie Homebrew, Postgres | Lokalny Postgres działa w jednorazowym Dockerze (`postgres:17`, `od-sasiada-pg`, port 5432, baza `od_sasiada`). Jeśli daemon jest wyłączony, zrestartuj Docker Desktop. | `local-db-docker` |
| Efemeryczny FS na Vercel | Host Vercel nie ma trwałego dysku — media nie mogą iść na dysk lokalny; muszą trafiać do Vercel Blob (D1). `BLOB_READ_WRITE_TOKEN` przez integrację Marketplace, nie commitowany. | sprint-3.md / §8 |

## 8. Storage mediów i deployment (EPIC-3)

> Status: decyzja D1 (historia: [docs/archive/sprint-3.md](../../docs/archive/sprint-3.md)); **do potwierdzenia w SPIKE-S3** przed S3.1.

- **Adapter:** Vercel Blob (`@payloadcms/storage-vercel-blob`) skonfigurowany na kolekcji `Media`; `sharp` generuje warianty rozmiarów.
- **ENV/sekrety:** `BLOB_READ_WRITE_TOKEN` dostarczony przez integrację Vercel Marketplace (nie commitowany).
- **Izolacja serwowania (NFR1):** URL-e blobów **nie mogą** dawać przewidywalnego dostępu cross-tenant; `access.read` na `Media` tenant-scoped (nie publiczny bez filtra). SPIKE-S3 weryfikuje brak przecieku.
- **Cel deploy:** Vercel (host efemeryczny → dysk lokalny wykluczony).
- **Wydajność (NFR8):** render katalogu przez `next/image` + warianty `sharp` + lazy-load; mierzyć LCP listy produktów.
