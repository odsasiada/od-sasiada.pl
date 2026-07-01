# Deferred Work

## Deferred from: code review of S3.5 (2026-06-25)

- Slug na Categories nie ma unikalności — znane Q1 (S3.4: auto vs ręczny, unikalność per-tenant) [src/collections/Categories.ts]
- `console.warn` w payload.config.ts — developer convenience, brak strukturalnego logowania
- `categoriesField()` w `productsCollectionOverride` — należy do S3.4/S3.6, nie S3.5 — commit organization
- BLOB warning — zmiana konfiguracyjna poza zakresem S3.5
- Media mimeTypes (`['image/*']` → explicit) — security improvement, poza zakresem S3.5

## Deferred from: code review of S3.6 (2026-06-25)

- Duplikat sluga kategorii w obrębie tenanta → `getCatalog` `limit:1` rozwiązuje niedeterministycznie + dwa identyczne `?kategoria=` linki podświetlone aktywnie [src/lib/shop.ts; src/collections/Categories.ts] — znane Q1/S3.4 (unikalność sluga per-tenant niewymuszona)
- `getCategories` `limit: 200` cicho ucina pasek filtra przy >200 kategoriach [src/lib/shop.ts] — low, spójne z innymi twardymi limitami
- Twarde limity katalogu — >500 produktów / >1000 wariantów cicho ucinane (brak paginacji) [src/lib/shop.ts] — pre-existing
- Brak `sort` na zapytaniu produktów w `getCatalog` → kolejność z bazy [src/lib/shop.ts] — pre-existing

## Deferred from: code review of S3.2/S3.3/S3.4 (2026-06-25)

- [S3.2] `heroTenantMatch` waliduje hero tylko gdy `heroImage` w payloadzie write (partial update / reparenting tenanta nie re-waliduje) — siatka bezpieczeństwa to scoping read-side (S3.3, testowane) [src/ecommerce/hero-tenant-match.ts]
- [S3.3] `next.config` remotePattern `*.public.blob.vercel-storage.com` — wildcard dopuszcza dowolny store Vercel Blob przez next/image (drobny abuse, nie izolacja tenanta) [next.config.ts]
- [S3.3] Upload <768px: brak wariantu `card` → oryginał serwowany jako card (NFR8 minor) [src/lib/shop.ts toProductImage]
- [S3.3] `resolveOrderItemImages` `limit: size` bez chunkowania — zamówienie >~100 różnych produktów może uciąć miniatury [src/lib/shop.ts]
- [S3.4] `slugify` nazw wyłącznie nie-łacińskich → pusty slug → throw z mylącym komunikatem; auto-slug blokuje takie nazwy (manualny slug wymagany) [src/collections/Categories.ts]

## Deferred from: code review of S4.3–S4.7 (2026-07-01)

- [S4.6] `addRandomSuffix:false` → kolizje nazw plików cross-tenant (dwa tenanty `miod.jpg` → nadpisanie bloba); per-tenant `prefix` = przyszła praca, single-tenant demo [src/payload.config.ts:127]
- [S4.6] Skrypt `delete-tenant-media.mjs` kasuje CAŁE media tenanta (nie tylko hero), pomija hooki adaptera (osierocone bloby), finalny `delete` poza try (FK z innych tabel → nieobsłużony wyjątek w połowie) — świadomy one-off [_bmad-output/scripts/delete-tenant-media.mjs:50]
- [S4.6] Lookup produktów pod hero `limit: 200` cicho pomija >200 produktów; `pagination:false` gdy katalog urośnie [src/seed-production.ts:266]
- [S4.6] Dryf AC: AC3 mówi o URL blob `*.public.blob.vercel-storage.com`, a serwowanie idzie app-domain `/api/media/file/...` (intencja „bez 404" spełniona) — aktualizacja treści historii [S4.6.md]
- [S4.5] Seed create-only (nie upsert): zmiana `priceInPLN`/`description` nie zadziała przy ponownym uruchomieniu (dryf ceny); tylko kategorie zawsze aktualizowane [src/seed-production.ts:24-37]
- [S4.5] Dryf AC: AC4 mówi „6 pozycji", zaseedowano 7 kategorii (dodano „Jaja") — aktualizacja AC [S4.5.md]
