# Design Tokens — od-sąsiada.pl

> Dwuwarstwowe: **paleta surowa** (nazwane skale) → **role semantyczne** (aliasy używane w UI).
> Format: CSS variables. Warstwa shadcn = kanały HSL (bez `hsl()`), warstwa marki = pełne kolory.
> **Źródło prawdy:** [`_bmad-output/design-source/tokens/`](../design-source/tokens/) (lustro 1:1 z Claude Design).

## Architektura warstw

1. **Paleta surowa** — [`tokens/palette.css`](../design-source/tokens/palette.css). Nazwane skale 50–900
   (green, stone, terracotta, amber, brick) + tinty. To „farba" — **nigdy nie odwołuj się do niej
   bezpośrednio w UI**.
2. **Role semantyczne** — [`tokens/semantic.css`](../design-source/tokens/semantic.css). Dwie skoordynowane
   warstwy na palecie:
   - **tokeny shadcn/ui** jako kanały HSL (`--primary: 133 44% 33%`) → `primary: 'hsl(var(--primary))'` w Tailwind,
   - **aliasy ról marki** jako pełne kolory (`--surface-page`, `--text-body`, `--accent-cta`, …).
3. **Dark mode** — pod `.dark` / `[data-theme="dark"]`.
4. **Override per-tenant** — `[data-tenant]` nadpisuje **tylko** akcent. Szczegóły: [tenant-theming.md](./tenant-theming.md).

## Kolory — paleta surowa

| Skala | Zakres | Kotwice | Rola |
|-------|--------|---------|------|
| **green** | `#eef6f0` → `#173c20` | `600 #2f7a3f` (legacy `--green`), `700 #245f31` (legacy `--green-dark`) | marka + success |
| **stone** | `#faf9f6` → `#1f2421` | `100 #f7f6f2` (paper), `300 #e4e2da` (border), `700 #6b716c` (muted), `900 #1f2421` (ink) | neutrale (ciepłe, nie szare) |
| **terracotta** | `#fcf1ec` → `#532316` | `500 #c75b39` (accent), `600 #b04a2c` | CTA „Kup / Dodaj do koszyka" |
| **amber** | `#fdf7ec` → `#714d10` | `600 #976715` | warning „mało sztuk" (nigdy alarmujący) |
| **brick** | `#fdeceb` → `#7e2420` | `600 #9b1c1c` (legacy alert-error) | error / destructive (stonowana ceramika) |
| **tinty** | — | `--tint-honey/leaf/pickle/bee/stone` | ciepłe tła kafli produktów bez zdjęcia |

## Kolory — role semantyczne (shadcn, kanały HSL)

| Token | Light | Dark | Mapowanie Tailwind |
|-------|-------|------|--------------------|
| `--background` | `48 24% 96%` | `60 6% 9%` | `bg-background` |
| `--foreground` | `144 7% 13%` | `48 14% 92%` | `text-foreground` |
| `--card` | `0 0% 100%` | `60 5% 12%` | `bg-card` |
| `--primary` | `133 44% 33%` (zieleń) | `133 40% 52%` | `bg-primary` |
| `--accent` | `14 56% 50%` (terakota) | `14 62% 58%` | `bg-accent` |
| `--destructive` | `0 69% 36%` | `2 58% 56%` | `bg-destructive` |
| `--success` | `133 44% 33%` | `133 40% 52%` | — |
| `--warning` | `38 73% 42%` | `38 70% 56%` | — |
| `--border` / `--input` | `48 16% 87%` | `60 4% 22%` | `border-border` |
| `--ring` | `133 44% 33%` | `133 40% 52%` | `ring-ring` |
| `--radius` | `0.75rem` | — | bazowy promień shadcn |

Każdy token ma też `*-foreground`. Konwencja użycia w Tailwind: `colors: { primary: 'hsl(var(--primary))', 'primary-foreground': 'hsl(var(--primary-foreground))' }`.

## Kolory — aliasy ról marki (pełne kolory)

| Token | Wartość | Rola |
|-------|---------|------|
| `--surface-page` | `stone-100` | tło strony |
| `--surface-card` | `white` | tło kart |
| `--surface-sunken` | `stone-200` | tła zagłębione |
| `--text-body` | `stone-900` | tekst główny |
| `--text-muted` | `stone-700` | tekst drugorzędny |
| `--text-faint` | `stone-600` | meta / podpisy |
| `--text-price` | `stone-900` | cena (krytyczna dla zaufania) |
| `--border-hairline` | `stone-300` | obramowania |
| `--border-focus` | `green-600` | focus |
| `--brand` / `--brand-strong` | `green-600` / `green-700` | akcenty marki |
| `--accent-cta` / `--accent-cta-strong` | `terracotta-500` / `600` | CTA (nadpisywane per-tenant) |
| `--state-success/-bg` | `green-600` / `green-50` | sukces |
| `--state-warning/-bg` | `amber-600` / `amber-50` | ostrzeżenie |
| `--state-error/-bg` | `brick-600` / `brick-50` | błąd |

## Typografia

Źródło: [`tokens/typography.css`](../design-source/tokens/typography.css).

- **Rodziny:** `--font-display` = **Bricolage Grotesque** (nagłówki, charakter „ręcznie cięty"),
  `--font-body` = **Hanken Grotesk** (body, UI, etykiety), `--font-mono` (techniczne).
- **Wagi:** 400 / 500 / 600 / 700 / 800 (`--fw-regular` … `--fw-extrabold`).
- **Skala** (rem, ~1.2 modular): `2xs 11` · `xs 13` · `sm 14` · `base 16` · `md 18` · `lg 22` · `xl 28` · `2xl 36` · `3xl 48` · `4xl 60`.
- **Line-height:** `tight 1.1` / `snug 1.25` / `normal 1.5` / `relaxed 1.65`.
- **Tracking:** `tight -0.02em` (display) … `caps 0.06em` (uppercase eyebrow).
- **Cena (rola osobna):** `--text-price-sm/md/lg` = `16/20/28px`, `--fw-price: 700`,
  `--price-feature: 'tnum' 1, 'lnum' 1` (tabular lining), separator dziesiętny = przecinek, „zł" po liczbie.

> Fonty ładowane w produkcji przez `next/font/google` (subsets `latin` + `latin-ext` dla polskich znaków),
> nie przez `@import` z `tokens/fonts.css`.

## Spacing

Źródło: [`tokens/spacing.css`](../design-source/tokens/spacing.css). Siatka bazowa **4px**.

- Kroki: `1·4` `2·8` `3·12` `4·16` (domyślny gutter) `5·20` `6·24` (padding kontenera) `8·32` `12·48` (rytm sekcji) `16·64` `20·80` `24·96`.
- Layout: `--container-max: 1000px`, `--container-pad: 24px`, `--grid-gutter: 16px`, `--tap-min: 44px` (min. cel dotykowy, mobile-first).

## Promienie (radii)

Źródło: [`tokens/radius.css`](../design-source/tokens/radius.css). Miękkie, „drewniany stół".

- `sm 6` (steppery) · `md 8` (inputy, przyciski, zdjęcia) · `lg 12 ★` (karty — bazowy `--radius`) · `xl 16` (panele/modale) · `2xl 24` (bloki marketingowe) · `pill 999` (badge, licznik koszyka).

## Cienie (elevation)

Źródło: [`tokens/elevation.css`](../design-source/tokens/elevation.css). Niskie, ciepłe (`--shadow-color: 60 8% 20%`, podbijaj alpha zamiast czerni).

- `xs` → `xl` (5 stopni) + `--ring-focus` (zielona poświata `0 0 0 3px hsl(var(--ring)/.35)`) + `--shadow-inset` (inputy).

## Motion

Źródło: [`tokens/motion.css`](../design-source/tokens/motion.css). Spokojny ruch, bez sprężyn.

- Czasy: `fast 120` / `base 180` / `slow 260` / `slower 400` ms.
- Easingi: `--ease-standard` / `--ease-entrance` / `--ease-exit`.
- Feedback: `--hover-lift: -1px`, `--press-scale: 0.98`.
- `prefers-reduced-motion: reduce` → wszystkie czasy `0ms`, lift/scale wyłączone.

## Tokeny nadpisywalne per-tenant

| Token | Nadpisywalny? | Uwagi |
|-------|---------------|-------|
| `--tenant-accent` / `--tenant-accent-strong` | ✅ | jedyne nadpisywane; zasilają `--accent-cta` i `--accent` w `[data-tenant]` |
| logo | ✅ | przez `--tenant-logo` / props |
| spacing / typografia / neutrale / komponenty | ❌ (zamrożone) | spójność platformy |

Domyślnie `--tenant-accent` = terakota globalna. Mechanizm: [tenant-theming.md](./tenant-theming.md).

## Mapowanie na Tailwind (docelowo)

```js
// tailwind.config — theme.extend
colors: {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
  accent:  { DEFAULT: 'hsl(var(--accent))',  foreground: 'hsl(var(--accent-foreground))' },
  destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
  border: 'hsl(var(--border))', input: 'hsl(var(--input))', ring: 'hsl(var(--ring))',
  card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
},
borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
```

> **Stan wyjściowy w repo:** `src/app/(frontend)/globals.css` ma legacy `--green/--bg/--card/--border/--text/--muted`.
> Plan migracji (legacy → tokeny powyżej) jest w `glistening-singing-dove.md` (osobne zadanie).
