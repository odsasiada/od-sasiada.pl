# S1.4 — Panel dostawcy: lista zamówień scopedowana na tenanta

Status: udokumentowany 2026-06-20 · ✅ GOTOWE · EPIC-1

## Historyjka

Jako **dostawca** chcę, aby **lista zamówień w panelu pokazywała tylko moje własne zamówienia**, aby **nigdy nie widzieć ani nie działać na zamówieniach innego dostawcy**.

## Kryteria akceptacji (z sprint-1.md)

- Dostawca widzi tylko własne zamówienia w panelu.
- Filtrowanie po statusie.
- Sortowanie po dacie.

## Zależności

- SPIKE-A (izolacja zweryfikowana).

## Uwagi implementacyjne

- Dostarczone przez listę scopedowaną pluginu wielotenantskiego (nie potrzebny własny kod dostępu — potwierdzone przez SPIKE-A). Kolekcja zamówień podłączona przez `src/ecommerce/orders.ts` (`ordersOverride`) w `src/payload.config.ts`.

## Dowody testów / weryfikacji

- Dostarczone wcześniej, zweryfikowane przez `pnpm payload run src/spike-order-list.ts` (wyjście `/tmp/spike-list.txt`): z `overrideAccess: false` i adminem-dostawcą B jako użytkownikiem, lista zamówień B zwraca **0 dokumentów**, a zamówienie tenanta A jest nieobecne w wynikach B — tzn. ta sama ścieżka dostępu, której używa lista admina, poprawnie scopeduje na tenanta.
