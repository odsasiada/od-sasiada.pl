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

- Siatka kart, filtr kategorii (server-side), tinty dla produktów bez zdjęcia.
- Stany: ładowanie, pusto (sąsiedzka mikrokopia — patrz [voice-and-tone.md](./voice-and-tone.md)).
- Sygnały: badge „Sezonowe" (cena `null`), bursztynowy „Zostało N" (low stock).

## Strona produktu

- Galeria zdjęć, wybór wariantu (`Select`), **cena** (PLN, grosze → `src/lib/money.ts` / `Price`), CTA „Dodaj do koszyka".
- Chip sprzedawcy widoczny — zaufanie.

## Karta sprzedawcy / branding tenanta

- Branding przejawia się w `ShopHeader` (nazwa sklepu) i kolorze akcentu CTA.
- Sygnały zaufania/lokalizacji: nazwa sprzedawcy, dni dostawy, odbiór lokalny.
- Mechanizm: [tenant-theming.md](./tenant-theming.md).

## Koszyk i checkout

Ref repo: `CartView`, `ReorderButton`. Kit: [`CartScreen.jsx`](../design-source/ui_kits/shop/CartScreen.jsx).

- Koszyk: linie z `Price`, `QuantityStepper`, suma.
- **Checkout gotówkowy = minimum tarcia:** najmniej pól, jasne CTA, brak płatności online.
- „Ponów zamówienie" (`ReorderButton`) dla powracających.

## Profil / konto klienta

Ref repo: `AccountForm`, `AddressBook`. Kity: [`AccountScreen.jsx`](../design-source/ui_kits/shop/AccountScreen.jsx), [`OrdersScreen.jsx`](../design-source/ui_kits/shop/OrdersScreen.jsx).

- Dane konta, książka adresów (`Field` + walidacja).
- Moje zamówienia: lista ze `StatusBadge` (statusy PL — patrz `ORDER_STATUS` w [components.md](./components.md)).
