---
project_name: 'od-sasiada.pl'
user_name: 'mateusz'
date: '2026-06-21'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: 'complete'
optimized_for_llm: true
existing_patterns_found: 12
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Warstwa | Wybór | Wersja / uwaga |
|---------|-------|----------------|
| CMS / backend | PayloadCMS | `^3.85.1` — **Local API** do WSZYSTKICH serwerowych dostępów do danych |
| E-commerce | `@payloadcms/plugin-ecommerce` | `^3.85.1` — produkty/warianty/koszyki/zamówienia/adresy; `inventory: false`; waluta PLN |
| Multi-tenant | `@payloadcms/plugin-multi-tenant` | `^3.85.1` — kolejność pluginów `[ecommerce, multiTenant]` |
| Framework | Next.js | `^16.2.9` — App Router + Turbopack |
| UI | React / react-dom | `^19.2.7` |
| Baza danych | Postgres via `@payloadcms/db-postgres` | `^3.85.1` — Docker `od-sasiada-pg` (nie Homebrew) |
| Storage mediów | `@payloadcms/storage-vercel-blob` + `@vercel/blob` | `^3.85.1` / `^2.4.0` — Vercel Blob |
| E-mail | `@payloadcms/email-nodemailer` | `^3.85.1` — SMTP |
| Edytor | `@payloadcms/richtext-lexical` | `^3.85.1` |
| Język | TypeScript | `^6.0.3` — `strict`, `moduleResolution: bundler` |
| Walidacja env | `zod` `^4.4.3` + `@t3-oss/env-nextjs` `^0.13.11` | `src/env.ts` — jedyne źródło env |
| Lint/format | Biome | `^2.5.0` |
| Testy | Vitest | `^4.1.9` |
| Obrazy | sharp | `^0.35.2` |
| Package manager | pnpm | `10.27.0` |
| Deploy | Vercel | host efemeryczny (brak trwałego dysku) |

**Ograniczenia wersji:**
- Next 16 + React 19 + Turbopack — granica server/client jest restrykcyjna (patrz reguły `'use server'`).
- `src/payload-types.ts` i `src/importMap.js` są generowane (`pnpm payload:types` / `payload:importMap`) — NIGDY nie edytować ręcznie; wyłączone z Biome.
- Build: `payload generate:types && payload generate:importmap && next build`.

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

- **Pieniądze ZAWSZE w groszach** (integer; 130 = 1,30 zł). Formatowanie tylko przez
  `formatPLN` z `@/lib/money` (dzieli /100, separator `,`, sufiks `zł`). Nigdy float na cenach.
- **Aliasy importów:** `@/*` → `src/*`, `@payload-config` → `src/payload.config.ts`.
  Brak importów relatywnych w głąb (`../../`).
- **Kolejność importów wymuszana przez Biome** (`organizeImports`): typy → URL/node/bun →
  pakiety → alias `@/` → ścieżki. Nie układać ręcznie — `pnpm lint:fix`.
- **Walidacja env tylko przez `src/env.ts`** (`@t3-oss/env-nextjs` + zod). Nie czytać
  `process.env.*` bezpośrednio w kodzie aplikacji — dodać klucz do `runtimeEnv` + schematu.
- **Czyste, współdzielone typy/util w `@/lib/money.ts`** (np. `CartLine`, `SavedAddress`,
  `CartSnapshot`, `formatPLN`) — BEZ importów server-only, bo te typy trafiają do komponentów
  klienckich. Importowanie typów z pliku `'use server'` psuje hydratację wyspy klienckiej.
- **`async/await`** wszędzie przy Local API Payload; brak surowych `.then()`.
- TS `strict` włączony — żadnych `any` na granicach; typy z `src/payload-types.ts` dla dokumentów.

### Framework-Specific Rules (Payload / Next.js / React)

**Izolacja wielotenantska (NFR1 — wymuszana na 3 warstwach):**
- **Zapis (Local API):** koszyki/zamówienia mają `tenant` **stemplowany jawnie** z konta
  klienta po stronie serwera — NIGDY nie akceptować `tenant` z klienta. Akcja serwerowa nie ma
  kontekstu żądania, więc auto-populacja tenanta NIE działa — dodaj go ręcznie.
- **Odczyt (frontend):** używaj `overrideAccess: true` + **ręczny `where`**:
  katalog `{ _status: 'published', tenant }`; zamówienia `{ customer, tenant }`.
- `getCurrentCustomer(tenantId)` zwraca klienta tylko gdy `customer.tenant === tenantId`
  (klient zalogowany u tenanta A jest anonimowy u tenanta B).

**Plugin ecommerce — pułapki:**
- Trzeba przekazać `products: true` **explicite**, inaczej plugin nie utworzy produktów/
  wariantów/koszyków (mimo że docs mówią o domyślnym true).
- Zamówienia pluginowe = tylko referencje (`items[] { product, variant, quantity }` + `amount`
  + `currency`) — brak snapshotów per pozycja, brak numeru. Snapshoty (`productNameSnapshot`,
  `unitPriceSnapshot`…), `orderNumber` (`ZAM-RRRR-NNNNN`) i status dostawy dodane przez
  `ordersCollectionOverride`.
- Gotówka: zamówienia tworzone wprost przez Local API — bez PaymentAdapter/Stripe.
- `carts`: `tenant` wymagany (stempluj ręcznie); `status` **nie jest zapytywalną ścieżką**
  (`QueryError`) → find-or-create scopuj TYLKO przez `customer + tenant`, nigdy po `status`.

**Automat stanów zamówienia:**
- Przejścia walidowane centralnie w `src/ecommerce/order-status.ts` (`new→confirmed→preparing→
  out_for_delivery→delivered`, `cancelled` z każdego niedostarczonego, reaktywacja `cancelled→new`).
- Walidacja w hooku `beforeChange`; e-maile w `afterChange`. Reguły wymuszane w aplikacji
  (hook), nie w bazie.

**Granica `'use server'` + Turbopack (ciche awarie hydratacji!):**
- Plik `'use server'` importowany przez komponent kliencki musi importować `next/headers`
  **bezpośrednio** (nie przez `@/lib/auth`) i NIE może być podwójnie importowany przez komponent
  serwerowy i kliencki naraz.
- Helpery odczytu trzymaj w zwykłych modułach (`@/lib/cart`, `@/lib/addresses`), nie w plikach akcji.
- Typy wejściowe akcji trzymaj inline. Naruszenie = cicha awaria wyspy klienckiej (bez błędu).

**Walidacja koszyka — jedno źródło prawdy:**
- `src/lib/cart-validation.ts` to czysty moduł (BEZ `'use server'`, `next/headers`, `@/lib/auth`,
  Reacta). Cena jednostkowa ZAWSZE z bazy (`overrideAccess: true`, cena wariantu wygrywa);
  cena od klienta nigdy nie zaufana. Re-walidacja autorytatywnie przy `placeOrder`.

**Next/React:**
- Routing frontendu pod `src/app/(frontend)/[tenant]/...`; admin pod `(backend)`.
- Akcje serwerowe ustawiają ciasteczko `payload-token` ręcznie (logowanie/rejestracja via Local API).
- Ścieżki URL po polsku (`koszyk`, `moje-zamowienia`, `konto`, `reset-hasla`).

### Testing Rules

- **Vitest 4**, environment `node`, `globals: true`. Uruchamianie: `pnpm test` (`vitest run`),
  watch: `pnpm test:watch`.
- **Dwa rodzaje testów, dwie konwencje nazw:**
  - Unit: `tests/unit/*.test.ts` — czyste moduły (np. `money`, `order-status`, `delivery-slots`,
    `postal-code`), bez DB.
  - Integracyjne: `tests/integration/*.integration.test.ts` — wymagają realnego Postgresa
    (Docker) i JEDNEJ współdzielonej instancji Payload.
- **Integracje NIGDY równolegle:** `fileParallelism: false`, `pool: 'forks'` (jedna instancja
  Payload, jedna baza). Timeout `60s` (`testTimeout`/`hookTimeout`).
- **Setup w `tests/setup/`:** `load-env.ts` ładuje `.env.local` do `process.env` (Payload czyta
  env przy imporcie); `payload.ts` / `integration.ts` / `fixtures.ts` dostarczają instancję
  i dane.
- Alias `@/` w testach działa przez `vite-tsconfig-paths`.
- **Testy bezpieczeństwa są obowiązkowe** dla izolacji tenantów: `orders-isolation`,
  `order-detail-idor` (potwierdzają brak dostępu cross-tenant / IDOR — NFR1). Zmieniając
  dostęp/`where`, uruchom te regresje.

### Code Quality & Style Rules

**Biome (lint + format) — jedyne narzędzie:**
- Format: `pnpm format` (`biome format --write .`); lint: `pnpm lint` (`biome check .`);
  auto-fix: `pnpm lint:fix` (`biome check --write .`). Brak ESLint/Prettier.
- Styl JS/TS: **single quotes**, **bez średników** (`asNeeded`), JSX single quotes,
  2 spacje, `lineWidth: 120`.
- `organizeImports`, `useSortedKeys`, `useSortedProperties`, `useSortedAttributes` = ON —
  klucze/properties/atrybuty JSX sortowane automatycznie. Pisz w dowolnej kolejności i odpal fix.
- Domeny lint: `next: recommended`, `react: recommended`. `noArrayIndexKey` wyłączone.
- Wyłączone z Biome (generowane): `src/payload-types.ts`, `src/importMap.js`.

**Organizacja kodu / nazewnictwo:**
- `src/collections/*` — kolekcje Payload, **PascalCase** (`Tenants.ts`, `Customers.ts`,
  `Users.ts`, `Media.ts`).
- `src/lib/*` — czyste/serwerowe helpery, **kebab-case** (`cart-validation.ts`, `money.ts`,
  `delivery-slots.ts`).
- `src/ecommerce/*` — nadpisania/logika pluginu ecommerce (`orders.ts`, `order-status.ts`,
  `order-emails.ts`).
- `src/access/index.ts` — współdzielone funkcje dostępu (`isAdmin`, `isAuthenticated`,
  `isDocumentOwner`, `adminOrPublishedStatus`, `publicAccess`).
- Pliki akcji serwerowych: sufiks `-actions.ts` w katalogu trasy (`cart-actions.ts`,
  `account-actions.ts`, `address-actions.ts`).
- Komponenty: `src/components/shop/*` (mieszane — `Catalog.tsx`, `cart-store.tsx`).

**Dokumenty:** treść artefaktów i komentarze po **polsku** (i18n `pl`, fallback `pl`),
kod/identyfikatory po angielsku.

### UI / Design System

- **Design system** („Od Sąsiada", Claude Design) — dokumentacja UX w
  [`_bmad-output/ux/`](./ux/index.md): tokeny, komponenty, wzorce, voice & tone, a11y.
- **Źródło prawdy** = lustro 1:1 [`_bmad-output/design-source/`](./design-source/MIRROR.md)
  (read-only; edytuj upstream + re-sync). NIE importować z lustra w kodzie aplikacji.
- **Stan w repo:** tokeny jeszcze NIE wdrożone do `src/` — `globals.css` ma legacy CSS vars
  (`--green/--bg/--card/--border/--text/--muted`). Migracja = osobne zadanie (plan `glistening-singing-dove.md`).
- **Tokeny:** paleta surowa (skale 50–900) → role semantyczne (shadcn HSL channels + aliasy marki);
  pieniądze formatuj przez `formatPLN` (rola `--text-price-*`, tabular lining). Szczegóły: [`ux/design-tokens.md`](./ux/design-tokens.md).
- **Per-tenant:** sprzedawca nadpisuje TYLKO akcent (`[data-tenant]` → `--accent-cta`); szkielet niezmienny.
  Akcent musi przejść walidację kontrastu. Szczegóły: [`ux/tenant-theming.md`](./ux/tenant-theming.md).
- **Fonty (docelowo):** `next/font/google` — Bricolage Grotesque (display) + Hanken Grotesk (body), subsets `latin` + `latin-ext`.

### Development Workflow Rules

- **Lokalny Postgres przez Docker** (`od-sasiada-pg`, `postgres:17`, port 5432, baza
  `od_sasiada`) — NIE Homebrew. Jeśli daemon padł, zrestartuj Docker Desktop.
- **Po zmianie kolekcji/pól regeneruj typy:** `pnpm payload:types` (+ `payload:importMap` przy
  zmianie komponentów admina). Build robi oba kroki automatycznie.
- **Seed:** `pnpm seed` (`payload run src/seed.ts`) — uwaga na uporządkowane usuwanie
  (`seed.ts:17`) zależne od kolejności.
- **Fallow przed commitem AI-generated zmian:** `fallow audit --format json --quiet`
  (oraz `dead-code` / `dupes` / `health` dla celowanych sprawdzeń — patrz `AGENTS.md`).
  Zanim usuniesz „nieużywany" eksport/zależność: `fallow dead-code --trace ...`.
- **Deploy: Vercel.** Host efemeryczny → brak lokalnego dysku na media (idą do Vercel Blob).
  `BLOB_READ_WRITE_TOKEN` z integracji Vercel Marketplace — NIE commitować (`.env.local`).
- **Sekrety:** `PAYLOAD_SECRET` min. 32 znaki; env walidowane przy starcie przez `src/env.ts`.

### Critical Don't-Miss Rules

**NIGDY nie rób tego:**
- ❌ Nie ufaj cenie/tenantowi/customerowi przysłanym z klienta — czytaj autorytatywnie z bazy
  i stempluj serwerowo.
- ❌ Nie filtruj `carts` po `status` w zapytaniu (`QueryError` — ścieżka niezapytywalna).
- ❌ Nie importuj `next/headers` ani `@/lib/auth` do czystych modułów (`money`, `cart-validation`,
  `cart`, `addresses`) — i nie dawaj im `'use server'`. Złamanie = cicha awaria hydratacji.
- ❌ Nie pomijaj `products: true` w configu pluginu ecommerce (crash konfiguracji).
- ❌ Nie edytuj ręcznie `src/payload-types.ts` / `src/importMap.js` (generowane).
- ❌ Nie commituj `BLOB_READ_WRITE_TOKEN` ani innych sekretów.
- ❌ Nie zapisuj cen jako float — tylko grosze (integer).
- ❌ Nie obchodź `order-status.ts` — przejścia statusu walidowane centralnie.

**Bezpieczeństwo (NFR1 — izolacja tenantów):**
- Każdy odczyt frontendowy z `overrideAccess: true` MUSI mieć ręczny `where { tenant }`
  (+ `customer` dla danych klienta). Brak filtra = wyciek cross-tenant.
- Szczegóły zamówienia: zawsze `where { customer, tenant }` (ochrona IDOR).
- Auth klientów: unikalność e-maila jest **globalna** (domyślne Payload) — ten sam e-mail nie
  zarejestruje się u dwóch dostawców; niedopasowanie tenanta odrzucane przy logowaniu. Złożona
  unikalność `(tenant, email)` to TODO.
- Media (EPIC-3): `access.read` tenant-scoped — URL-e blobów nie mogą dawać dostępu cross-tenant
  (do potwierdzenia: SPIKE-S3).

**Znane ograniczenia (zamierzone):**
- `inventory: false` — brak ochrony przed overselling; dostępność potwierdzana poza systemem.
- Brak checkoutu gościa — wymagane logowanie przed checkoutem.
- Edycja zapisanego adresu nie zmienia wstecznie snapshotów w starych zamówieniach (B1).
- Płatność gotówką — bez Stripe/PaymentAdapter; zamówienia wprost przez Local API.

**Wydajność:** render katalogu przez `next/image` + warianty `sharp` + lazy-load; mierzyć
LCP listy produktów (NFR8).

---

## Usage Guidelines

**Dla agentów AI:**

- Przeczytaj ten plik PRZED implementacją jakiegokolwiek kodu.
- Stosuj WSZYSTKIE reguły dokładnie tak, jak opisano.
- W razie wątpliwości wybierz wariant bardziej restrykcyjny.
- Zaktualizuj ten plik, gdy pojawią się nowe wzorce.

**Dla ludzi:**

- Trzymaj plik zwięzły i skupiony na potrzebach agentów.
- Aktualizuj przy zmianie stacku/wzorców.
- Przeglądaj okresowo; usuwaj reguły, które stały się oczywiste.

Last Updated: 2026-06-30
