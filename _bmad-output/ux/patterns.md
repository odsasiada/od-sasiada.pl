# Wzorce UI — od-sąsiada.pl

> Złożone wzorce ekranów składane z komponentów. Referencje: [`design-source/templates/shop-page/`](../design-source/templates/shop-page/)
> (pełny szablon) i [`design-source/ui_kits/shop/`](../design-source/ui_kits/shop/) (kit ekranów: Catalog / Cart / Account / Orders).

## Strona sklepu (mini-shop sprzedawcy) — `ShopPage`

Ref: [`templates/shop-page/ShopPage.dc.html`](../design-source/templates/shop-page/ShopPage.dc.html).

- **`ShopHeader`** (sticky, jasny): mark od-sąsiada.pl + nazwa sklepu, konto, pill koszyka `N · X,XX zł`.
- **Karta intro:** nazwa sklepu, minimalne zamówienie, dni dostawy, „płatność gotówką przy odbiorze".
- **Siatka `ProductCard`** (aspect 4/5) z akcentem per-tenant na CTA.

## Lista produktów

Ref repo: `Catalog`, `CategoryFilter`. Kit: [`CatalogScreen.jsx`](../design-source/ui_kits/shop/CatalogScreen.jsx).

- Siatka kart, filtr kategorii (server-side, `CategoryFilter`), tinty dla produktów bez zdjęcia (`--tint-stone`).
- Stany: ładowanie, pusto (sąsiedzka mikrokopia — patrz [voice-and-tone.md](./voice-and-tone.md)).
- Sygnały: badge „Sezonowe" (cena `null`).
- ⚠️ **Low-stock („Zostało N") — NIE wdrożone i poza zakresem MVP:** śledzenie stanu jest wyłączone (`inventory: false`, decyzja B2 w architekturze), więc nie ma źródła danych dla licznika sztuk. Nie implementować bez wprowadzenia inwentarza.

## Strona produktu

- **Pojedyncze hero** (jedno zdjęcie; decyzja D2 — galeria odłożona do backlogu), wybór wariantu (`Select`), **cena** (PLN, grosze → `src/lib/money.ts` / `Price`), CTA „Dodaj do koszyka".
- Fallback zdjęcia: **wariant → produkt → placeholder/tint** (`resolveProductImage`, D3); zdjęcie opcjonalne (D6).
- Chip sprzedawcy widoczny — zaufanie.

## Karta sprzedawcy / branding tenanta

- Branding przejawia się w `ShopHeader` (nazwa sklepu) i kolorze akcentu CTA.
- Sygnały zaufania/lokalizacji: nazwa sprzedawcy, dni dostawy, odbiór lokalny.
- Mechanizm: [tenant-theming.md](./tenant-theming.md).

## Koszyk i checkout

Ref repo: `CartView`, `ReorderButton`. Kit: [`CartScreen.jsx`](../design-source/ui_kits/shop/CartScreen.jsx).

- Koszyk: linie z `Price`, `QuantityStepper`, suma.
- **Checkout gotówkowy = minimum tarcia:** najmniej pól, jasne CTA, brak płatności online.
- **Wybór terminu dostawy** (sekcja „Dane do dostawy", `CartView` — EPIC-2):
  - `Select` „Termin dostawy" z placeholderem „— wybierz termin —"; etykiety przez `formatSlotLabel` (dzień + okno).
  - Lista pokazuje **tylko realne wystąpienia** — sloty po cutoffie / w dniu-wyjątku / pełne (capacity) są odfiltrowane serwerowo; walidacja autorytatywna w `placeOrder` (cutoff S2.3, capacity odporne na wyścig S2.7).
  - **Stan pusty:** „Brak dostępnych terminów dostawy — skontaktuj się z dostawcą."
  - **Slot wymagany, gdy tenant ma okna** (O8): CTA złożenia zamówienia zablokowane do wyboru terminu; tenant bez okien → sekcja ukryta, checkout jak w EPIC-1.
  - Wybrany termin jest **snapshotem** w zamówieniu — widoczny w panelu, na froncie i w mailu potwierdzającym (S2.4).
- „Ponów zamówienie" (`ReorderButton`) dla powracających.

## Profil / konto klienta

Ref repo: `AccountForm`, `AddressBook`. Kity: [`AccountScreen.jsx`](../design-source/ui_kits/shop/AccountScreen.jsx), [`OrdersScreen.jsx`](../design-source/ui_kits/shop/OrdersScreen.jsx).

- Dane konta, książka adresów (`Field` + walidacja).
- Moje zamówienia: lista ze `StatusBadge` (statusy PL — patrz `ORDER_STATUS` w [components.md](./components.md)).
