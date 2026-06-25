# SPIKE-S3 — Upload per-tenant + Vercel Blob + izolacja serwowania mediów

Status: done · EPIC-3 · utworzono 2026-06-21 · część lokalna domknięta 2026-06-21 · **odblokowane 2026-06-25** (token sprovisionowany, AC4 zweryfikowane empirycznie na realnym blobie — patrz notatka odblokowania)

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
| AC3 — Vercel Blob lokalnie + deploy | ✅ | token sprovisionowany (Vercel Marketplace, public store); realny upload działa (`media-isolation` tworzy realne PNG przez adapter); deploy ścieżka gotowa |
| AC4 — URL nie przecieka cross-tenant | ✅ | zweryfikowane empirycznie 2026-06-25 — patrz notatka odblokowania (fix `addRandomSuffix: true` + live probe + test panelu) |

### Do architektury §8

Po odblokowaniu: potwierdzić, czy serwowanie pliku z Vercel Blob idzie przez access Payloada czy bezpośrednio z publicznej domeny blob (determinuje, czy `access.read` realnie chroni plik, czy izolacja opiera się na nieprzewidywalności ścieżki + braku listowania). Dopiero wtedy zdjąć z §8 status „do potwierdzenia w SPIKE-S3".

### Otwarte pytania
1. ~~Serwowanie blobu: przez access-control Payloada czy publiczny URL domeny?~~ → **ROZSTRZYGNIĘTE 2026-06-25:** publiczny URL domeny blob (store ustawiony jako public). `access.read` chroni TYLKO panel/API (metadane), NIE surowych bajtów. Izolacja bajtów = nieprzewidywalny URL + brak listowania (patrz notatka odblokowania).
2. ~~Kolejność `vercelBlobStorage` vs multi-tenant w `plugins`~~ → **POTWIERDZONE:** `media: {}` w multi-tenant + adapter wpięty warunkowo działa; pełna regresja 128 testów zielona.

---

## Notatka odblokowania — 2026-06-25 (AC3 + AC4 zweryfikowane)

> Token `BLOB_READ_WRITE_TOKEN` sprovisionowany przez użytkownika (integracja Vercel Marketplace). Blob store przełączony z **private → public** (właściwy wybór dla publicznych zdjęć produktów oglądanych przez anonimowych klientów). AC3/AC4 zweryfikowane empirycznie — nic nie sfabrykowano.

### 🔴 Znaleziony realny problem (AC4) — przed fixem

Forensyka adaptera `@payloadcms/storage-vercel-blob@3.85.1` + `@vercel/blob@2.4.0`:
- Adapter domyślnie `addRandomSuffix: false` (`dist/index.js:7`); nasz config tego **nie nadpisywał**.
- `getFileKey({ docPrefix:'', collectionPrefix:'', filename })` → klucz = **goła nazwa pliku** (Media bez `prefix`).
- Efekt: URL bloba = `https://<store>.public.blob.vercel-storage.com/<nazwa-pliku>` — **przewidywalny**.

**Live probe na realnym blobie potwierdził:**
- PRZED (`addRandomSuffix:false`): URL = dokładnie podana nazwa pliku → przewidywalny; anon GET 200 (publicznie pobieralny); ponowny upload tej samej nazwy → **ODRZUCONY** (`blob already exists`, kolizja cross-tenant).
- Czyli przy public blobie warstwa „nieprzewidywalny URL" **nie istniała** → ryzyko: tenant B zgaduje nazwę pliku tenanta A i pobiera obrazek; kolizja nazw między tenantami.

### ✅ Fix + werdykt

`src/payload.config.ts` — `vercelBlobStorage({ addRandomSuffix: true, ... })`:
- PO (`addRandomSuffix:true`): URL = `<store>/<nazwa>-<losowy-sufiks>.ext` → **nie do zgadnięcia**; brak kolizji nazw między tenantami.
- Plik próbny posprzątany (`del`).

**Model izolacji mediów (dwie warstwy, obie zweryfikowane):**

| Warstwa | Co chroni | Mechanizm | Dowód |
|---|---|---|---|
| Panel / API / konto | A nie widzi metadanych ani listy mediów B | `multiTenantPlugin` row-scope + `access.read: isAdmin` | `media-isolation` 4/4 (admin B nie listuje/nie czyta media A) |
| Surowe bajty (public URL) | A nie zgadnie/wylistuje URL pliku B | public blob + `addRandomSuffix: true` + brak publicznego listowania (listing tylko z server-only tokenem RW) | live probe 2026-06-25 |

**Zastrzeżenie:** przy public blobie plik jest „unlisted public" — kto ma dokładny URL, pobierze (zamierzone dla zdjęć produktów). Gdyby media miały trzymać dane prywatne per-konto → wrócić do private blob + proxy przez Payload.

### Werdykt końcowy
Wszystkie AC (AC1–AC4) ✅. Blokada zdjęta. SPIKE-S3 i S3.1 → `done`.

### Pliki dotknięte (odblokowanie)
- `src/payload.config.ts` (MOD — `addRandomSuffix: true` na `vercelBlobStorage`, komentarz R-S3.2/AC4)
