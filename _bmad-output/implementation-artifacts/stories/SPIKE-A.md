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

- `src/spike-order-isolation.ts` — tworzy zamówienie u tenanta A, następnie próbuje aktualizacji statusu jako admin-dostawca B z `overrideAccess: false`. Asertuje, że aktualizacja jest zablokowana (rzuca) **lub** zapisany status się nie zmienił.
- **Odkrycie:** pluginy ecommerce + wielotenantskie już pilnują `update` zamówienia. Własny warunek `access.update` na nadpisaniu zamówienia był zatem **niepotrzebny** — patrz sprint-1.md ("plugin pilnuje update, własny access.update zbędny").

## Dowody testów / weryfikacji

- Dostarczone wcześniej, zweryfikowane przez `pnpm payload run src/spike-order-isolation.ts` (wyjście `/tmp/spike-a.txt`): między-tenantska aktualizacja admina B jest odrzucana / no-op → **izolacja się utrzymuje**. Spalono ryzyko R2 przed rozpoczęciem S1.5.
