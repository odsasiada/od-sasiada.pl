# Design System — od-sąsiada.pl

> Punkt wejścia do systemu projektowego. Źródło prawdy: [`_bmad-output/design-source/`](../design-source/)
> (lustro 1:1 z projektu Claude Design „Od Sąsiada - Design System").

## Filozofia projektowa

**Stół kuchenny sąsiada, nie magazyn korporacji.** Ciepło ponad sterylność. Marketplace
ma sprawiać wrażenie, że kupujesz od konkretnej osoby z okolicy — nie od bezosobowej platformy.
Stąd ciepłe neutrale (kamień, nie szarość), zielona DNA marki, miękkie zaokrąglenia
(„drewniany stół"), niskie ciepłe cienie i spokojny ruch bez sprężyn.

## Zasady przewodnie

1. **Zaufanie przez wyeksponowanie sprzedawcy** — nazwa/branding tenanta są widoczne (chip na karcie produktu, nagłówek sklepu).
2. **Cena jest najważniejszą liczbą** — własna rola typograficzna (`--text-price-*`, tabular lining, ciężka waga, przecinek dziesiętny, „zł" po liczbie).
3. **Mobile-first** — siatka 4px, min. cel dotykowy 44px, podłoga typografii UI = 14px.
4. **Minimum tarcia w checkoucie gotówkowym** — najmniej pól, jasne CTA.
5. **Spójność mimo per-tenant brandingu** — sprzedawca zmienia **tylko** akcent; szkielet (powierzchnie, neutrale, typografia, komponenty) jest niezmienny → kupujący zawsze czuje, że jest na od-sąsiada.pl.
6. **Dostępność wbudowana** — WCAG 2.1 AA; akcent tenanta przechodzi walidację kontrastu.

## Architektura systemu

Globalna baza tokenów (tożsamość od-sąsiada.pl) + lekka warstwa override per-sprzedawca.

```
palette.css (skale 50–900: green/stone/terracotta/amber/brick + tinty)
   ↓  (nigdy bezpośrednio w UI)
semantic.css ── shadcn HSL channels (--primary, --accent, --border, --ring…)
            └── aliasy ról marki (--surface-page, --text-body, --accent-cta…)
   ↓
.dark / [data-theme=dark]   →  przepięcie ról dla dark mode
[data-tenant]               →  override TYLKO --tenant-accent → --accent-cta / --accent
   ↓
komponenty (Button, ProductCard, ShopHeader, Badge, Price, Field, Select…)
```

Szczegóły warstwy per-tenant: [tenant-theming.md](./tenant-theming.md).

## Mapa dokumentów

Patrz [index.md](./index.md).

## Stack

- **Tailwind CSS** + **shadcn/ui** (do wprowadzenia — jeszcze nieobecne w repo).
- Tokeny jako CSS variables (`tokens/*.css`) → mapowanie na `theme.extend` (kanały HSL).
- **Fonty:** `next/font/google` — Bricolage Grotesque (display) + Hanken Grotesk (body), subsets `latin` + `latin-ext`.
- Stan wyjściowy tokenów w repo: `src/app/(frontend)/globals.css` (legacy CSS vars — do migracji).

## Lustro źródłowe

| Folder w `design-source/` | Zawartość |
|---------------------------|-----------|
| `tokens/` | warstwy tokenów (palette, semantic, typography, spacing, radius, elevation, motion, base, fonts) |
| `components/` | referencyjne `.jsx` + `.d.ts` + `.prompt.md` + specimeny `*.card.html` |
| `templates/shop-page/` | `ShopPage.dc.html` — pełna strona mini-sklepu |
| `ui_kits/shop/` | kompletny kit ekranów (Catalog / Cart / Account / Orders) |
| `guidelines/` | karty-specimeny (kolory, typografia, spacing, radius, elevation, brand) |
| `assets/logo/` | mark + wordmarki SVG |

> Lustro jest **read-only** (patrz [`design-source/MIRROR.md`](../design-source/MIRROR.md)). Edytuj upstream i re-syncuj.
