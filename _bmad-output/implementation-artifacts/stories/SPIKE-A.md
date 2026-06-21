# SPIKE-A — Izolacja tenantów przy `update` zamówienia

Status: udokumentowany 2026-06-20 · ✅ GOTOWE · EPIC-1

## Historyjka

Jako **operator platformy** chcę **dowodu, że admin-dostawca B nie może modyfikować zamówień dostawcy A**, aby **automat stanów (S1.5) był budowany na zweryfikowanym bezpiecznym fundamencie** (ryzyko R2).

## Kryteria akceptacji (z sprint-1.md)

- Admin-tenant B nie może `update` zamówienia należącego do tenanta A (oczekiwane 403 / 404).
- Test regresyjny (`orders-tenant-isolation`) przechwytuje wynik.

## Zależności

- S1.1 (ostateczny schemat na miejscu).

## Uwagi implementacyjne

- `tests/integration/orders-isolation.integration.test.ts` (suita `orders-tenant-isolation`) — tworzy zamówienie u tenanta A, następnie próbuje aktualizacji statusu jako admin-dostawca B z `overrideAccess: false`. Asertuje, że aktualizacja jest zablokowana (rzuca) **lub** zapisany status się nie zmienił.
- **Odkrycie:** pluginy ecommerce + wielotenantskie już pilnują `update` zamówienia. Własny warunek `access.update` na nadpisaniu zamówienia był zatem **niepotrzebny** — patrz sprint-1.md ("plugin pilnuje update, własny access.update zbędny").

## Dowody testów / weryfikacji

- Reprodukowalny artefakt: `tests/integration/orders-isolation.integration.test.ts` (suita `orders-tenant-isolation`), uruchamiany przez `pnpm test` (live Docker Postgres `od-sasiada-pg`) → cała suita **39 passed, 1 skipped**. Między-tenantska aktualizacja admina B jest odrzucana / no-op → **izolacja się utrzymuje**. Spalono ryzyko R2 przed rozpoczęciem S1.5.
