# Znane Issue

_Dokumentowanie błędów i problemów napotkanych w trakcie rozwoju projektu._

---

## KI-001: TenantSelectionProvider — Maximum update depth exceeded

**Data:** 2026-06-25
**Status:** ⏳ Oczekuje na fix (PR #16990 open)
**Wersja Payload:** 3.85.1
**Wersja Next.js:** 16.2.9 (Turbopack)
**Wersja React:** 19.2.7

### Objawy

Przejście na `/admin/collections/tenants/914` (edycja tenanta) powoduje błąd:

```
Maximum update depth exceeded. This can happen when a component repeatedly calls setState
inside componentWillUpdate or componentDidUpdate.
```

Stack trace wskazuje na `TenantSelectionProvider` z `@payloadcms/plugin-multi-tenant`.

### Root Cause

Pętla reinicjalizacji stanu w `TenantSelectionProvider`:

1. `WatchTenantCollection` reaguje na `submitted` (nawet przy nieudanej walidacji)
2. Wywołuje `syncTenants()` → `setTenantOptions()` (zmiana stanu)
3. Zmienia identyfikator callback `setTenant`
4. Effect "no selected tenant" wywołuje się ponownie → `router.refresh()`
5. `router.refresh()` przekazuje `<Form>` nowy `initialState` → reset formularza / ponowny render

### Powiązane GitHub

- **Issue:** [#16953](https://github.com/payloadcms/payload/issues/16953) — `multi-tenant tenants create form wiped on failed validation`
- **PR (open):** [#16990](https://github.com/payloadcms/payload/pull/16990) — `fix: prevent form reset when tenant create fails validation`
- **PR (merged):** [#16065](https://github.com/payloadcms/payload/pull/16065) — `fix: infinite api calling loop on user switch` (v3.82.0)
- **Reprodukcja:** [github.com/jhb-dev/payload-multi-tenant-create-form-reset](https://github.com/jhb-dev/payload-multi-tenant-create-form-reset)

### Fix (oczekujący na merge)

```tsx
// packages/plugin-multi-tenant/src/providers/TenantSelectionProvider/index.client.tsx
// WatchTenantCollection — dodaj && id
if (operation === 'create' && submitted && id) {  // było: && submitted
  void syncTenants()
}
```

### Tymczasowy workaround

Wyłącz multi-tenant plugin w `payload.config.ts` (zakomentuj `multiTenant()`) aby potwierdzić czy problem jest w pluginie.

### Uwagi

- Fix z PR #16065 (v3.82.0) naprawił infinite API calling loop przy przełączaniu użytkownika
- Ale problem nadal występuje w scenario z `WatchTenantCollection` + failed validation
- PR #16990 dodaje brakujący guard `&& id`

---

## KI-002: Usuwanie tenanta wisi w nieskończoność (DELETE /api/tenants/{id})

**Data:** 2026-06-25
**Status:** 🔴 Open (issue Payload #16045 open, brak fixa od maintainera)
**Wersja Payload:** 3.85.1
**Wersja Next.js:** 16.2.9 (Turbopack)
**DB:** Postgres 17 (Docker, kontener `od-sasiada-pg`), `@payloadcms/db-postgres` + drizzle

### Objawy

Platform-admin usuwa tenanta w panelu → żądanie `DELETE /api/tenants/{id}` wisi w nieskończoność (brak odpowiedzi). Po czasie połączenie pada:

```
ERROR: Failed query: delete from "tenants" where "tenants"."id" = $1  (params: 853)
caused by: error: terminating connection due to administrator command
Error: Connection terminated unexpectedly
⨯ uncaughtException: Connection terminated unexpectedly
```

`cleanupAfterTenantDelete: false` było już ustawione i **NIE pomogło**.

### Root Cause

Dwa osobne zdarzenia — nie mylić:

1. **Zawieszenie (pierwotne):** gołe `DELETE FROM tenants WHERE id=$1` blokuje się na *row locku* trzymanym przez wyciekły backend `idle in transaction`. Wcześniejsze żądanie otworzyło transakcję (prawdopodobnie ścieżka advisory-lock w `src/lib/slot-reservation.ts` lub inny zapis, który rzucił wyjątek po `beginTransaction()` a przed commit/rollback) i zostawiło backend trzymający blokadę. Pool nie ustawia `idle_in_transaction_session_timeout` / `lock_timeout` / `statement_timeout` (tylko `connectionString`), więc czekanie jest nieograniczone. `uncaughtException`-y w logu to potwierdzenie wycieku transakcji.
2. **Terminacja (wtórna):** `terminating connection due to administrator command` (kod 57P01) to NIE timeout zapytania (to byłoby `canceling statement due to statement timeout`) ani timeout idle-in-transaction. Oznacza `pg_terminate_backend()` **albo restart/shutdown postmastera** — czyli najpewniej restart kontenera Docker / ręczne ubicie backendu. Backend ginie później i dopiero wtedy żądanie się rozwija.

Kaskada `ON DELETE SET NULL` na 16 tabelach-dzieciach + brak indeksów na kolumnach FK `tenant` to **mnożnik** (poszerza okno kolizji i zakres blokad), ale nie przyczyna zawieszenia. Advisory locki ze slot-reservation są wykluczone jako bezpośrednia przyczyna (rozłączne przestrzenie blokad; brak komunikatu „deadlock detected").

Plugin multi-tenant jest **oczyszczony z zarzutów**: w `dist/index.js:227` `if (cleanupAfterTenantDelete !== false) { addTenantCleanup(...) }` — z flagą `false` hook `afterTenantDelete` nie jest rejestrowany. W `src/` nie ma własnych hooków `beforeDelete`/`afterDelete`. Wisi sama warstwa transakcji Postgresa Payloda.

### Powiązane GitHub

- **Issue (open):** [#16045](https://github.com/payloadcms/payload/issues/16045) — `Delete tenant hangs when using global collections` (pasuje dokładnie; w trakcie zawieszenia SELECT na `users` siedzi idle_in_transaction; repro: [github.com/simovicaleksa/delete-tenant-reproduction](https://github.com/simovicaleksa/delete-tenant-reproduction))
- **Issue (open):** [#14576](https://github.com/payloadcms/payload/issues/14576) — `tenant deletion fails with DrizzleQueryError — transaction aborted (Postgres)`
- **Issue (open):** [#15674](https://github.com/payloadcms/payload/issues/15674) — `payload.destroy leaves one checked-out pg client, causing pool.end() timeout`

### Diagnoza (uruchom GDY delete wisi)

```sql
-- 1. Kto czeka, kto blokuje
SELECT pid, state, wait_event_type, wait_event,
       age(clock_timestamp(), xact_start) AS xact_age,
       pg_blocking_pids(pid)              AS blocked_by,
       left(query, 120)                   AS query
FROM pg_stat_activity
WHERE datname = current_database() AND state IS DISTINCT FROM 'idle'
ORDER BY xact_start NULLS LAST;
```

- `blocked_by` przy `delete from "tenants"` niepuste + bloker `idle in transaction` → **wyciek transakcji** (Gałąź A). Sprawdź rollback w `src/lib/slot-reservation.ts:54-71`.
- `blocked_by` puste, zapytanie realnie biegnie → **brak indeksów FK** (Gałąź B); wykryj luki przez `pg_constraint`/`pg_index`, napraw `CREATE INDEX CONCURRENTLY`.

Test izolacji (Payload bug vs. zepsuty dev server Next): usuń tenanta przez **Local API w samodzielnym skrypcie tsx** (bez Next/panelu, ta sama baza) — `await payload.delete({ collection: 'tenants', id })`. Wisi → realny bug DB/Payload. Działa w ms → uszkodzony stan połączeń dev servera (wyciek tx przez HMR).

> ⚠️ Gotcha przy pisaniu skryptu: `payload run <script>` wymaga **top-level `await`** (jak `src/seed.ts`) — `run().catch()` (fire-and-forget) powoduje, że proces kończy się przed dokończeniem. Logi przez `payload.logger`/pino giną przy `process.exit()` (worker nie zdąża flushnąć) — pisz wynik przez `fs.writeFileSync` lub `console.log` + czyste `payload.db.destroy()`.

### Wynik testu izolacji (2026-06-25)

Samodzielny `deleteByID` tenanta przez Local API (ta sama baza Docker, bez Next.js):

```
[scratch] created throwaway tenant id=1058
[scratch] ✅ deleteByID returned in 19ms — NO hang via Local API.
```

**Wniosek:** ścieżka DELETE Payloda (ten sam `deleteByID` co panel) działa w **19 ms, bez zawieszenia**, gdy nie ma kolidujących blokad. To gałąź „działa w ms" → zawieszenie w panelu jest **środowiskowe** (osierocony `idle in transaction` w długo żyjącym dev serverze po HMR / wcześniejszym błędnym żądaniu), a NIE wrodzony bug delete'a w Payloadzie.

**Potwierdzenie na tenantach Z dziećmi (2026-06-25):** usunięto przez Local API 6 testowych tenantów (853, 854, 877, 878, 913, 914) mających kategorie/produkty — każdy `deleteByID` z kaskadą `ON DELETE SET NULL` wykonał się w **5–79 ms, bez zawieszenia**. To eliminuje również teorię „wolna/blokująca kaskada SET NULL" jako przyczynę — kaskada jest sprawna. Pozostała przyczyna zawieszenia w panelu to wyłącznie kolizja z wyciekłą blokadą w dev serverze. Następny krok przy realnym zawieszeniu panelu: odpalić zapytanie z sekcji „Diagnoza" i potwierdzić `blocked_by` + bloker `idle in transaction`.

### Skrypty diagnostyczne

Reużywalne narzędzia w `_bmad-output/scripts/`:

- **`ki-002-tenant-delete-isolation.ts`** — Local API: test izolacji (utwórz tenanta-jednorazówkę i usuń, z pomiarem) lub celowane usuwanie po id (z bezpiecznikiem na chronione id). 60s watchdog, wynik też w `/tmp/ki-002-tenant-delete.log`.
  ```bash
  # test izolacji (throwaway tenant)
  pnpm payload run _bmad-output/scripts/ki-002-tenant-delete-isolation.ts
  # celowane usuwanie
  pnpm payload run _bmad-output/scripts/ki-002-tenant-delete-isolation.ts 853 854
  ```
- **`ki-002-diagnose-delete-hang.sql`** — zapytania do odpalenia GDY panel wisi: kto blokuje (`pg_blocking_pids`), wiszące `idle in transaction`, graf blokad, brakujące indeksy FK, komendy odblokowujące.
  ```bash
  docker exec -i od-sasiada-pg psql -U postgres -d od_sasiada -f - < _bmad-output/scripts/ki-002-diagnose-delete-hang.sql
  ```

### Fix / workaround

1. **Odblokuj teraz:** `SELECT pg_terminate_backend(<blocking_pid>)`, lub wybij wszystkie stare tx:
   ```sql
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity
   WHERE datname = current_database() AND state = 'idle in transaction'
     AND age(clock_timestamp(), xact_start) > interval '30 seconds';
   ```
   Lub młotem: `docker restart od-sasiada-pg` **+ restart `next dev`**.
2. **Siatka bezpieczeństwa** (zamienia „wisi wiecznie" w czysty szybki błąd) — ustaw na poolu/DB: `idle_in_transaction_session_timeout` (~30s), `lock_timeout` (~5s), `statement_timeout`.
3. **Trwale:** zaudytuj surowe ścieżki `beginTransaction` pod gwarantowany `rollbackTransaction` w każdym catch/finally; dodaj `index: true` na kolumnach FK `tenant` w tabelach z dużą liczbą wierszy.

### Uwagi

- Zawieszenie = oczekiwanie na blokadę (pierwotne); „administrator command" = ktoś ubił backend (wtórne). Nie ścigać komunikatu o terminacji jako przyczyny.
- Warto skomentować #16045 śladem `pg_stat_activity` (idle_in_transaction) — issue nie ma jeszcze fixa od maintainera.

---

## Szablon dla kolejnych issue

```markdown
## KI-XXX: Tytuł

**Data:** RRRR-MM-DD
**Status:** 🔴 Open / ⏳ Oczekuje / ✅ Fixed
**Wersja Payload:** x.x.x
**Wersja Next.js:** x.x.x

### Objawy
[Opis błędu]

### Root Cause
[Przyczyna źródłowa]

### Powiązane GitHub
- Issue: [#XXX](url)
- PR: [#XXX](url)

### Fix
[Kod poprawki lub workaround]

### Uwagi
[Dodatkowe informacje]
```

### Terminal

[browser] Uncaught Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
    at TenantSelectionProvider (node_modules/.pnpm/@payloadcms+plugin-multi-tenant@3.85.1_@payloadcms+ui@3.85.1_@types+react@19.2.17_monac_4e3551a48ea1c50223a6ee206991e71b/node_modules/@payloadcms/plugin-multi-tenant/src/providers/TenantSelectionProvider/index.tsx:65:5)
    at RenderServerComponent (node_modules/.pnpm/@payloadcms+ui@3.85.1_@types+react@19.2.17_monaco-editor@0.55.1_next@16.2.9_react-dom@1_5b1d57c967138af65beadb155bb7709a/node_modules/@payloadcms/ui/src/elements/RenderServerComponent/index.tsx:76:14)
    at NestProviders (node_modules/.pnpm/@payloadcms+next@3.85.1_@types+react@19.2.17_graphql@16.14.2_monaco-editor@0.55.1_next@_30cdb07129abf351406403983d1cd39a/node_modules/@payloadcms/next/src/layouts/Root/NestProviders.tsx:20:10)
    at RootLayoutContent (node_modules/.pnpm/@payloadcms+next@3.85.1_@types+react@19.2.17_graphql@16.14.2_monaco-editor@0.55.1_next@_30cdb07129abf351406403983d1cd39a/node_modules/@payloadcms/next/src/layouts/Root/index.tsx:152:13)
    at RootLayout (node_modules/.pnpm/@payloadcms+next@3.85.1_@types+react@19.2.17_graphql@16.14.2_monaco-editor@0.55.1_next@_30cdb07129abf351406403983d1cd39a/node_modules/@payloadcms/next/src/layouts/Root/index.tsx:42:5)
    at Layout (src/app/(backend)/layout.tsx:28:5)
  63 |
  64 |   return (
> 65 |     <TenantSelectionProviderClient
     |     ^
  66 |       initialTenantOptions={tenantOptions}
  67 |       initialValue={initialValue}
  68 |       tenantsCollectionSlug={tenantsCollectionSlug}
 GET /admin/collections/tenants/914 200 in 247ms (next.js: 8ms, application-code: 239ms)
 GET /api/users/me 200 in 42ms (next.js: 5ms, application-code: 38ms)
 GET /api/tenants/populate-tenant-options 200 in 20ms (next.js: 13ms, application-code: 7ms)
 GET /admin/collections/tenants/914 200 in 123ms (next.js: 1667µs, application-code: 121ms)
[browser] Uncaught Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
    at TenantSelectionProvider (node_modules/.pnpm/@payloadcms+plugin-multi-tenant@3.85.1_@payloadcms+ui@3.85.1_@types+react@19.2.17_monac_4e3551a48ea1c50223a6ee206991e71b/node_modules/@payloadcms/plugin-multi-tenant/src/providers/TenantSelectionProvider/index.tsx:65:5)
    at RenderServerComponent (node_modules/.pnpm/@payloadcms+ui@3.85.1_@types+react@19.2.17_monaco-editor@0.55.1_next@16.2.9_react-dom@1_5b1d57c967138af65beadb155bb7709a/node_modules/@payloadcms/ui/src/elements/RenderServerComponent/index.tsx:76:14)
    at NestProviders (node_modules/.pnpm/@payloadcms+next@3.85.1_@types+react@19.2.17_graphql@16.14.2_monaco-editor@0.55.1_next@_30cdb07129abf351406403983d1cd39a/node_modules/@payloadcms/next/src/layouts/Root/NestProviders.tsx:20:10)
    at RootLayoutContent (node_modules/.pnpm/@payloadcms+next@3.85.1_@types+react@19.2.17_graphql@16.14.2_monaco-editor@0.55.1_next@_30cdb07129abf351406403983d1cd39a/node_modules/@payloadcms/next/src/layouts/Root/index.tsx:152:13)
    at RootLayout (node_modules/.pnpm/@payloadcms+next@3.85.1_@types+react@19.2.17_graphql@16.14.2_monaco-editor@0.55.1_next@_30cdb07129abf351406403983d1cd39a/node_modules/@payloadcms/next/src/layouts/Root/index.tsx:42:5)
    at Layout (src/app/(backend)/layout.tsx:28:5)
  63 |
  64 |   return (
> 65 |     <TenantSelectionProviderClient
     |     ^
  66 |       initialTenantOptions={tenantOptions}
  67 |       initialValue={initialValue}
  68 |       tenantsCollectionSlug={tenantsCollectionSlug}
