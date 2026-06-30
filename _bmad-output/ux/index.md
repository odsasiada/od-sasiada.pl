# Dokumentacja UX — od-sąsiada.pl

> Sekcja UX / Design System. Wygenerowana w trybie party-mode (Sally + Winston + Paige),
> wypełniona z lustra Claude Design: [`_bmad-output/design-source/`](../design-source/) (źródło prawdy, read-only).

## Przegląd

Ta sekcja opisuje system projektowy od-sąsiada.pl — tokeny, komponenty, wzorce ekranów, język UI
i dostępność. Dla **devów front** (jak budować spójnie z tokenów/komponentów) i **projektantów**
(zasady, filozofia, branding per-tenant). Wartości są wyciągnięte 1:1 z lustra w `design-source/`;
ten katalog to ludzko-czytelna warstwa nad nim.

## Pliki

- **[design-system.md](./design-system.md)** — punkt wejścia: filozofia, zasady, architektura warstw, stack
- **[design-tokens.md](./design-tokens.md)** — kolory, typografia, spacing, radii, cienie, motion + mapowanie Tailwind
- **[tenant-theming.md](./tenant-theming.md)** — branding per-sprzedawca (override akcentu), fallback, kontrast
- **[components.md](./components.md)** — Button, Field, ProductCard, Price, ShopHeader, Badge (propsy z `.d.ts`)
- **[patterns.md](./patterns.md)** — wzorce ekranów: sklep, lista, produkt, koszyk, konto
- **[voice-and-tone.md](./voice-and-tone.md)** — język UI: sąsiedzki PL, „zamiast → napisz", mikrokopia
- **[accessibility.md](./accessibility.md)** — WCAG 2.1 AA, kontrast, klawiatura, czytniki ekranu, formularze

## Jak korzystać z tej dokumentacji

1. Zacznij od [design-system.md](./design-system.md) (filozofia, zasady, architektura warstw).
2. [design-tokens.md](./design-tokens.md) — konkretne wartości; [tenant-theming.md](./tenant-theming.md) — branding sprzedawcy.
3. [components.md](./components.md) + [patterns.md](./patterns.md) — budowa ekranów.
4. [voice-and-tone.md](./voice-and-tone.md) + [accessibility.md](./accessibility.md) — copy i a11y.

**Źródło prawdy:** lustro [`design-source/`](../design-source/) (read-only). Te docsy są pochodną.
Po zmianie w upstream Claude Design → re-sync lustra, potem aktualizacja tych docsów.
Migracja tokenów do `src/app/(frontend)/globals.css` to **osobne zadanie** (plan `glistening-singing-dove.md`).
