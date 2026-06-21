# S1.6 — Szczegóły zamówienia: panel dostawcy + trasa frontendu klienta

Status: udokumentowany 2026-06-20 · ✅ GOTOWE · EPIC-1

## Historyjka

Jako **klient** chcę **strony szczegółów tylko-do-odczytu dla każdego mojego zamówienia**, a jako **dostawca** chcę **pełnych edytowalnych szczegółów zamówienia w panelu**, aby **obie strony widziały pozycje, adres, kontakt i status — ze ścisłą izolacją tenant + klient**.

## Kryteria akceptacji (z sprint-1.md)

- Pełne szczegóły zamówienia w panelu: snapshot pozycji, adres, kontakt, **edytowalny status**.
- Szczegóły zamówienia na froncie klienta: **tylko do odczytu**, z izolacją tenant + klient.

## Zależności

- S1.5 (status / automat stanów).

## Uwagi implementacyjne

- `src/app/(frontend)/[tenant]/moje-zamowienia/[id]/page.tsx` — trasa szczegółów tylko-do-odczytu klienta. Strona pobiera zamówienie z dokładnym zapytaniem izolacji `where { and: [ {id}, {customer}, {tenant} ] }` (`overrideAccess: true`, ręczne `where`). Wszystkie trzy klauzule muszą pasować; każde niedopasowanie zwraca zero dokumentów → strona renderuje nie-znaleziono.
- `src/app/(frontend)/[tenant]/moje-zamowienia/page.tsx` — strona listy zaktualizowana, aby każdy wiersz linkował do trasy szczegółów.
- `src/spike-order-detail.ts` — regresja IDOR zamrażająca kontrakt izolacji (patrz niżej).
- Szczegóły w panelu dostarczane przez nadpisanie kolekcji zamówień (`src/ecommerce/orders.ts`) z edytowanym polem statusu z S1.5 i snapshotem pozycji.

### Kluczowa decyzja: IDOR = 404 (brak orakulum istnienia)

Ponieważ zapytanie strony dodaje `customer` + `tenant` do `id`, odmowa żądania i nieistniejące id są **nierozróżnialne** — oba zwracają zero dokumentów i renderują nie-znaleziono. Nie ma osobnego 403 "istnieje ale zabronione", więc atakujący nie może używać kodów odpowiedzi do badania, które id zamówień istnieją. **Odmowa == nie-znaleziono** jest zablokowanym zachowaniem.

## Dowody testów / weryfikacji (ta sesja — zweryfikowano)

Regresja `src/spike-order-detail.ts` → **4 / 4 PASS** (wyjście `/tmp/spike-order-detail.txt`). Skrypt tworzy klientów A1, A2 (tenant A) i B1 (tenant B) z jednym zamówieniem każdy, następnie uruchamia zapytanie strony dla każdego scenariusza:

| # | Scenariusz | Oczekiwane dokumenty | Wynik |
|---|------------|---------------------|-------|
| 1 | A1 czyta własne zamówienie (baseline) | 1 | PASS |
| 2 | A1 podstawia id zamówienia A2, ten sam tenant (rdzeniowy IDOR) | 0 | PASS |
| 3 | A1 podstawia id zamówienia B1, między-tenantskie | 0 | PASS |
| 4 | nieistniejące id `999999999` | 0 dokumentów, **bez rzucania** | PASS |

- **Browser smoke:** strona szczegółów renderuje się poprawnie i **konsola jest czysta** (brak błędów).
