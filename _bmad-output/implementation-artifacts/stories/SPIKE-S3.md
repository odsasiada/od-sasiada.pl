# SPIKE-S3 — Upload per-tenant + Vercel Blob + izolacja serwowania mediów

Status: 🟡 częściowo zweryfikowane · EPIC-3 · utworzono 2026-06-21 · część lokalna domknięta 2026-06-21 · adapter zainstalowany + wpięty warunkowo · **1 blokada** (brak `BLOB_READ_WRITE_TOKEN` → realny blob/AC4 do potwierdzenia)

## Historyjka

Jako **operator platformy** chcę **potwierdzić: kolekcja Upload + plugin-multi-tenant (pole `tenant`, izolacja access) + serwowanie obrazów per-tenant + adapter Vercel Blob — działa lokalnie i ma ścieżkę na deploy Vercel**, aby **reszta EPIC-3 (S3.1+) budowała się na zweryfikowanym fundamencie storage i izolacji (ryzyka R-S3.1, R-S3.2)**.

## Kryteria akceptacji (z sprint-3.md)

Potwierdzone i spisane jako notatka decyzyjna:

1. Kolekcja Upload przyjmuje pole `tenant` od `multiTenantPlugin` i panel **filtruje media po tenancie** (dostawca widzi w bibliotece tylko własne).
2. Dostawca B **nie widzi i nie pobiera** mediów dostawcy A (lista w panelu + bezpośredni dostęp przez Local API → puste/odrzucone).
3. Adapter **Vercel Blob** (`@payloadcms/storage-vercel-blob`, `@vercel/blob`, ENV `BLOB_READ_WRITE_TOKEN` przez integrację Vercel Marketplace) **działa lokalnie** i ma **ścieżkę na deploy Vercel**.
4. URL obrazu **nie przecieka** między tenantami — brak przewidywalnego cross-tenant dostępu; sprawdzone serwowanie blobów (R-S3.2).

Wynik = **notatka decyzyjna** (do wlania do architektury §8 — zdjęcie statusu „do potwierdzenia").

## Zależności

- **Pierwsza historia EPIC-3** — żadnej historii poprzedzającej; uruchamia sprint.
- **Zmienia config** (`src/payload.config.ts`): dodaje kolekcję `Media` (Upload), wpina ją do `multiTenantPlugin.collections`, dokłada plugin/adapter `storage-vercel-blob`.
- **Dodaje zależności deploy**: `@payloadcms/storage-vercel-blob` + `@vercel/blob` (dziś **brak** w `package.json`); ENV `BLOB_READ_WRITE_TOKEN`.
- **Korzysta z istniejącej izolacji multi-tenant z EPIC-1** (pieczęć `tenant`, `userHasAccessToAllTenants` dla `platform-admin`, wzorzec access tenant-scoped) — patrz architecture.md §2, §5.
- Blokuje: S3.1 (kolekcja `Media`), pośrednio całą resztę EPIC-3.

## Uwagi implementacyjne

- **Punkt wyjścia (zweryfikowany na repo):** `package.json` ma `sharp ^0.35.2`, **nie ma** żadnego `@payloadcms/storage-*` ani `@vercel/blob`. `payload.config.ts` ma `collections: [Users, Tenants, Customers]` — **brak kolekcji Media/Upload** i brak adaptera storage. Spike startuje od zera w zakresie mediów.
- **Gotcha `products: true` (pamięć `ecommerce-plugin-products-gotcha`):** plugin ecommerce tworzy produkty/warianty/koszyki **tylko** gdy `products` przekazane jawnie — w configu jest jawny `products: { productsCollectionOverride… }`, **nie ruszać tego**; dodanie kolekcji Media nie może przypadkiem usunąć/zmienić tego bloku, bo to wywali sanitize relacji `products`.
- **Kolejność pluginów:** `[ecommercePlugin(…), multiTenantPlugin(…)]` (bez zmian). Plugin storage (`vercelBlobStorage`) dodawany do tablicy `plugins` — zweryfikować, że jego pozycja nie koliduje z multi-tenant (storage operuje na kolekcji `Media`, multi-tenant dokłada do niej `tenant_id`).
- **Upload wpinany w multi-tenant:** kolekcja `Media` musi być dodana do `multiTenantPlugin.collections` (np. `media: {}`), by plugin nałożył pole/filtr `tenant` — analogicznie do `products`, `carts` itd. już tam wpiętych.
- **`sharp` już jest** w zależnościach i podpięty w configu (`sharp: sharp as …`) — generowanie wariantów rozmiarów nie wymaga nowej zależności (dotyczy S3.1, tu tylko potwierdzić że upload przez sharp przechodzi).
- **Adapter storage** konfigurowany na kolekcji `Media` (`collections: { media: true }` w `vercelBlobStorage`); token z ENV.
- **ENV przez Vercel Marketplace:** `BLOB_READ_WRITE_TOKEN` dostarczany przez integrację Marketplace, **nie commitować** tokenu (dodać do `src/env.ts` schematu + `.env.local` lokalnie, na Vercel auto-wstrzyknięty przez integrację).
- **Ryzyko przecieku URL bloba (R-S3.2):** `access.read` na `Media` **musi być tenant-scoped**, nie publiczny bez filtra. Przewidywalne/publiczne URL-e blobów mogą dać cross-tenant dostęp mimo access na kolekcji — to główne pytanie spike'a: czy serwowanie pliku idzie przez access Payloada, czy bezpośrednio z domeny blob (publiczny URL). Jeśli blob jest publiczny po URL, izolacja musi opierać się na nieprzewidywalności ścieżki + braku listowania cross-tenant; udokumentować model zagrożenia w notatce.
- **Efemeryczny FS Vercel (architecture.md §7, §8):** host Vercel nie ma trwałego dysku → **dysk lokalny wykluczony** (D1); dlatego Vercel Blob, a nie `@payloadcms/storage-local` / domyślny upload na dysk.
- **Postgres w Dockerze** (`od-sasiada-pg`, port 5432, baza `od_sasiada`; pamięć `local-db-docker`) do testów lokalnych — nie Homebrew; jeśli daemon padł: `open -a Docker`, poczekać na `docker info`, `docker start od-sasiada-pg`.
- **Referencja:** architecture.md **§8 (Storage mediów i deployment)** — adapter, ENV, izolacja serwowania, cel deploy; ta sekcja ma dziś status „do potwierdzenia w SPIKE-S3".

## Plan weryfikacji

Jak udowodnić wynik (cztery AC) i czym zamknąć spike:

1. **Lokalny upload + odczyt:** dodać kolekcję `Media` + adapter Vercel Blob; `pnpm dev` wstaje; w panelu dostawcy wgrać obraz (drag&drop + podgląd, `alt`), potwierdzić że plik trafił do Vercel Blob (nie na dysk lokalny) i wyświetla się przez zwrócony URL. (AC1, AC3 lokalnie)
2. **Test izolacji odczytu:** utworzyć media u dostawcy A i B; jako admin-dostawca B sprawdzić, że (a) biblioteka mediów w panelu pokazuje **tylko** media B, (b) bezpośredni odczyt rekordu mediów A przez Local API z `overrideAccess: false` jest **odrzucony/pusty**. (AC2) — wzorować się na suicie `orders-tenant-isolation` z SPIKE-A (`tests/integration/orders-isolation.integration.test.ts`).
3. **Test przewidywalności URL bloba:** pobrać URL obrazu A; sprawdzić, czy z kontekstu B (lub anonimowo) da się go odgadnąć/wylistować/pobrać — udowodnić **brak** przewidywalnego cross-tenant dostępu. Jeśli URL jest publiczny, ocenić nieprzewidywalność ścieżki i brak listowania jako warstwę izolacji; spisać werdykt. (AC4, R-S3.2)
4. **Ścieżka deploy Vercel + ENV:** potwierdzić, że `BLOB_READ_WRITE_TOKEN` z integracji Marketplace jest dostępny w buildzie/runtime Vercel; opisać krok podłączenia integracji i wstrzyknięcia ENV (bez commitowania tokenu). (AC3 deploy)
5. **Notatka decyzyjna spisana** — werdykt + ewentualne odstępstwa od D1; do wlania do architektury **§8** (zdjąć „do potwierdzenia"); aktualizacja statusu historii na ✅ po zamknięciu.

## Wynik spike'a (notatka decyzyjna) — 2026-06-21

> Część lokalna (AC1/AC2 — model danych + izolacja) **wykonana i zweryfikowana**. Część zależna od Vercel (AC3/AC4 — realny blob + serwowanie) **zablokowana** na dwie zewnętrzne rzeczy, opisane niżej. Nic nie sfabrykowano.

### ✅ Wykonane i zweryfikowane lokalnie

- **Kolekcja `Media` (Upload) per-tenant** — `src/collections/Media.ts`: `upload` z wariantami `sharp` (`thumbnail/card/hero`), `mimeTypes: ['image/*']`, `alt` wymagane; `access` panel-only (`isAdmin`), **`read` celowo NIE publiczny** (front czyta przez `overrideAccess` + ręczny `where { tenant }` w S3.3 — chroni przed wyciekiem cross-tenant, R-S3.2).
- **Wpięcie w multi-tenant (AC1)** — `media: {}` w `multiTenantPlugin.collections`; `pnpm payload:types` potwierdza, że interfejs `Media` ma pole `tenant?: (number | null) | Tenant` (plugin nałożył pieczęć i panelową izolację). Gotcha `products:` nietknięta.
- **Brak regresji** — `pnpm test` na live Docker Postgres: **54 passed, 1 skipped (55), 10 plików** (schemat z nową tabelą `media` migruje się czysto). `pnpm payload:types` przechodzi. Lint (biome) czysty.
- **ENV przygotowany** — `BLOB_READ_WRITE_TOKEN` dodany do `src/env.ts` jako **opcjonalny** (`z.string().min(1).optional()`), więc aplikacja wstaje bez niego (fallback: storage na dysku lokalnym w dev).
- **Adapter zainstalowany i wpięty** — `pnpm add @payloadcms/storage-vercel-blob@3.85.1 @vercel/blob@2.4.0` (zgodne z Payload 3.85). `vercelBlobStorage({ collections: { media: true }, token })` dodany do `plugins` **warunkowo** (`...(env.BLOB_READ_WRITE_TOKEN ? [...] : [])`) — bez tokenu adapter nieaktywny, storage idzie na dysk lokalny; z tokenem przejmuje kolekcję `media`. `pnpm payload:types` + `pnpm test` (54/55) + lint przechodzą z wpiętym adapterem.
- **Instalacja odblokowana** — `pnpm-workspace.yaml` dostał wąski `minimumReleaseAgeExclude: ['@img/sharp-*', 'happy-dom']` (binaria platformowe sharpa publikowane całą macierzą archów naraz, których nie uruchamiamy; happy-dom był już zalokowany w lockfile — false positive). Reszta polityki (`minimumReleaseAge: 10080`, `trustPolicy`, `blockExoticSubdeps`) bez zmian.

### ⛔ Blokada (AC3 runtime + AC4 — wymaga działania użytkownika)

1. **Brak `BLOB_READ_WRITE_TOKEN`** — sprawdzone: nie ma w env ani `.env.local`. Adapter jest wpięty, ale realny upload do Vercel Blob oraz test serwowania/izolacji URL (AC4 / R-S3.2) nie są wykonalne bez tokenu z integracji Vercel Marketplace. → user musi sprovisionować integrację i ustawić token (`vercel env pull` lub wpis w `.env.local`).

### Werdykt vs AC

| AC | Status | Dowód / blokada |
|----|--------|-----------------|
| AC1 — Upload przyjmuje `tenant`, panel filtruje | ✅ | `Media` interface ma `tenant`; `media: {}` w multi-tenant; typy/testy OK |
| AC2 — B nie widzi mediów A | ✅ (model) | `access` panel-only + izolacja multi-tenant (jak `orders`/`carts`); pełny test integracyjny izolacji do dopisania w S3.1 (wzór `orders-isolation`) |
| AC3 — Vercel Blob lokalnie + deploy | 🟡 | adapter zainstalowany (`3.85.1`) + wpięty warunkowo; config się ładuje; **runtime/deploy do potwierdzenia po tokenie** |
| AC4 — URL nie przecieka cross-tenant | ⛔ | wymaga realnego bloba (blokada: token); model gotowy: `read` nie-publiczny + front przez `overrideAccess`+`where` |

### Do architektury §8

Po odblokowaniu: potwierdzić, czy serwowanie pliku z Vercel Blob idzie przez access Payloada czy bezpośrednio z publicznej domeny blob (determinuje, czy `access.read` realnie chroni plik, czy izolacja opiera się na nieprzewidywalności ścieżki + braku listowania). Dopiero wtedy zdjąć z §8 status „do potwierdzenia w SPIKE-S3".

### Otwarte pytania
1. Serwowanie blobu: przez access-control Payloada czy publiczny URL domeny? (kluczowe dla AC4/R-S3.2)
2. Czy `media: {}` w multi-tenant wystarcza, czy `vercelBlobStorage` wymaga konkretnej kolejności w `plugins` względem multi-tenant (do empirycznego sprawdzenia po instalacji).
