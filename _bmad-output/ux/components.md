# Komponenty UI — od-sąsiada.pl

> Baza: shadcn/ui (do wprowadzenia). Kontrakty referencyjne: [`design-source/components/`](../design-source/components/).
> Istniejące wzorce w repo: `src/components/shop/`. Dla każdego: Anatomia / Warianty / Stany / Kiedy używać.

## Konwencja

- **Baza:** shadcn/ui + tokeny z [design-tokens.md](./design-tokens.md). Komponenty czytają role semantyczne, nie paletę surową.
- **Lokalizacja docelowa w repo:** `src/components/shop/` (i `src/components/shop/ui/` dla prymitywów Price/Badge).
- **Per-tenant:** komponenty z CTA czytają `var(--accent-cta)`, które w `[data-tenant]` przyjmuje akcent sprzedawcy.
- **Referencja kontraktów:** pliki `.d.ts` w lustrze podają dokładne propsy (PL etykiety są częścią kontraktu).

## Przyciski — `Button` ([`.d.ts`](../design-source/components/buttons/Button.d.ts))

- **Anatomia:** `leadingIcon?` + label + `trailingIcon?`; opcjonalne `fullWidth`; `as: 'button' | 'a'`.
- **Warianty:** `primary` (zieleń marki) · `cta` (terakota „Kup / Dodaj do koszyka", adoptuje akcent tenanta) · `secondary` · `ghost` · `danger` · `link`.
- **Rozmiary:** `sm / md / lg` (cel dotykowy min. 44px).
- **Stany:** hover (lift -1px) / active (scale 0.98) / disabled / focus (ring zielony). Patrz tokeny motion.
- **Kiedy:** `cta` tylko dla głównej akcji zakupu; `primary` dla akcji marki; `danger` wyłącznie destruktywne.
- **IconButton** — okrągły wariant (np. przycisk „+" na karcie produktu).

## Pola formularza — `Field` / `Select` ([`Field.d.ts`](../design-source/components/forms/Field.d.ts))

- **Anatomia:** `label` (+ opcjonalne „(opcjonalnie)" gdy `optional`) → kontrola → `hint` lub `error`.
- **Stany:** default / focus (ring) / invalid (ceglany, `error` ustawiony) / disabled.
- **Błędy:** `error` przełącza pole w stan invalid; komunikat programowo powiązany (a11y).
- **Użycie:** domyślna kontrola każdego formularza — checkout, konto, książka adresów. Ref repo: `AccountForm`, `AddressBook`, `ResetPasswordForm`.

## Karty

### Karta produktu — `ProductCard` ([`.d.ts`](../design-source/components/commerce/ProductCard.d.ts))
- **Anatomia:** kafel ze zdjęciem (aspect 4/5) lub tint dla braku zdjęcia (`tone`: honey/leaf/pickle/bee/stone) + duża nazwa-poster; **chip sprzedawcy** (`seller`) — sygnał zaufania; mała etykieta kategorii; linia ceny + okrągły CTA „Dodaj do koszyka".
- **Cena:** `price` w **groszach** (`number | null`) → `Price`. `null`/`seasonal` → „Cena sezonowa" + „Zapytaj o cenę".
- **Stany specjalne:** `added` → potwierdzenie „✓ Dodano"; `variants` → `Select` nad ceną.
- ⚠️ **`lowStock` / „Zostało N" — kontrakt referencyjny lustra, NIE wdrożone (poza zakresem MVP):** `inventory: false` (B2) → brak źródła danych o stanie. Nie wiązać tego propa do UI bez wprowadzenia inwentarza.
- **Per-tenant:** w `[data-tenant]` CTA przyjmuje akcent sprzedawcy.
- Ref repo: `Catalog`.

## Cena — `Price` ([`.d.ts`](../design-source/components/commerce/Price.d.ts))

- Formatuje grosze → `"40,00 zł"` (tabular lining, ciężka waga, przecinek dziesiętny, „zł" po liczbie).
- Propsy: `value` (grosze, `null`→sezonowa), `unit` („kg", „szt.", „1 L"), `size: sm/md/lg`, `seasonal`.
- **Reuse w repo:** `formatPLN` z `src/lib/money.ts` (już istnieje).

## Nawigacja — `ShopHeader` ([`.d.ts`](../design-source/components/layout/ShopHeader.d.ts))

- **Anatomia:** sticky, jasny; globalny mark od-sąsiada.pl + nazwa sklepu sprzedawcy (`tenantName`); wejście do konta (`customerName` lub „Zaloguj się"); pill koszyka `cartCount · formatPLN(cartTotal)`.
- Ref repo: `Header`, `CategoryFilter`.

## Komunikaty i alerty — `Alert` / `Badge` ([`Badge.d.ts`](../design-source/components/feedback/Badge.d.ts))

- **Badge tony:** `neutral / brand / success / warning / error / accent`; rozmiary `sm/md`; opcjonalny `dot`.
- **`StatusBadge` + `ORDER_STATUS`:** mapa statusu zamówienia → `{ label (PL), tone }` (lustro `ecommerce/order-status.ts`): `new / confirmed / preparing / out_for_delivery / delivered / cancelled`.
- **Alert tony:** success (zielony) / warning bursztynowy „mało sztuk" / error ceglany — używają `--state-*`.
- Ref repo: statusy w `orders/`, `ReorderButton`.
