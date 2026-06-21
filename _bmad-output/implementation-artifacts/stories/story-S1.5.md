# S1.5 — Automat stanów zamówienia (liniowy z cofaniem) + stub `afterChange`

Status: udokumentowany 2026-06-20 · ✅ GOTOWE · EPIC-1

## Historyjka

Jako **dostawca** chcę, aby **status zamówienia przesuwał się tylko przez dozwolone przejścia**, aby **prowadzić zamówienie od nowego do dostarczonego (lub anulować / cofnąć) bez niespójnych stanów** (decyzja B3).

## Kryteria akceptacji (z sprint-1.md)

- `status` to enum.
- Dozwolone są tylko przejścia przewidziane przez automat stanów (z cofaniem).
- `access.update` ogranicza aktualizacje do tenanta.
- `afterChange` wykrywa zmianę statusu (zastępczy stub powiadomienia).

## Zależności

- SPIKE-A.

## Uwagi implementacyjne

- `src/ecommerce/order-status.ts` — automat stanów. Sekwencja `new → confirmed → preparing → out_for_delivery → delivered`; `cancelled` jest poza sekwencją (anuluj z każdego stanu oprócz `delivered`); `cancelled → new` reaktywuje. `isAllowedTransition` zezwala: no-op, jeden krok do przodu, cofnięcie dowolnej liczby kroków, anulowanie, reaktywacja. Eksportuje również `orderStatusField` (select nadpisujący status pluginu) i etykiety / opcje.
- `src/ecommerce/orders.ts` — `ordersOverride` podłącza pole statusu, walidację przejść, snapshot pozycji i stub powiadomienia `afterChange` do kolekcji zamówień.

## Dowody testów / weryfikacji

- Dostarczone wcześniej, zweryfikowane przez `pnpm payload run src/spike-status-machine.ts` (wyjście `/tmp/spike-sm.txt`): zabronione przeskoki są blokowane (`new → preparing`, `confirmed → out_for_delivery`, `new → delivered`), podczas gdy legalne kroki, cofnięcia, anulowanie i reaktywacja przechodzą.
