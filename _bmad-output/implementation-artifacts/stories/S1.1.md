# S1.1 — Wyłączenie `inventory`

Status: udokumentowany 2026-06-20 · ✅ GOTOWE · EPIC-1

## Historyjka

Jako **operator platformy** chcę **wyłączenia śledzenia inwentarza**, aby **dostawcy towarów świeżych/sezonowych nie byli zmuszeni do utrzymywania stanów magazynowych** (decyzja B2).

## Kryteria akceptacji (z sprint-1.md)

- `inventory: false` ustawione na pluginie ecommerce.
- Kolumny `inventory` znikają ze schematu.
- `pnpm dev` uruchamia się czysto.
- Seed + place-order nadal przechodzą na nowym schemacie.

## Zależności

- Brak — to pierwsza historyjka, ponieważ zmienia schemat.

## Uwagi implementacyjne

- `src/payload.config.ts` — `ecommercePlugin({ ..., inventory: false, ... })`.
- Migracja schematu zastosowana (kolumny inventory usunięte), aby zależne historyjki budowały na ostatecznym kształcie.

## Dowody testów / weryfikacji

- Dostarczone wcześniej, zweryfikowane wg sprint-1.md: `pnpm dev` startuje, seed + place-order przechodzą na schemacie bez inventory. Brak dedykowanego skryptu spike — zweryfikowane przez start aplikacji i istniejący flow seed / `place-order.ts`.
