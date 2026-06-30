# od-sąsiada.pl — Design System

> Lokalny, multi-tenant marketplace, w którym mieszkańcy kupują **prosto od sąsiadów** z najbliższej okolicy: domowe wypieki, przetwory, rękodzieło, miód, warzywa z ogródka. Każdy sprzedawca prowadzi własny mini-sklep w ramach jednej, spójnej platformy. Płatność **gotówką przy odbiorze**, bez pośredników, w **PLN**.

This design system **systematises and extends** the brand DNA that already ships in the product (`globals.css`). It does not reinvent it. Leading green, warm cream paper, soft corners and gentle shadows are preserved; what's new are full colour scales, a terracotta CTA accent, semantic state colours, a type system, dark mode, per-tenant theming, and a component + UI-kit layer.

**Wartości marki:** zaufanie · bliskość · prostota. Klient ma poczuć, że kupuje **od człowieka z sąsiedztwa, nie od korporacji**.

---

## Sources

This system was built from the product's real codebase. Explore these to design with higher fidelity:

- **GitHub:** [`odsasiada/od-sasiada.pl`](https://github.com/odsasiada/od-sasiada.pl) — Next.js (App Router) + Payload CMS, multi-tenant.
  - `src/app/(frontend)/globals.css` — original CSS variables + shop styles (the seed for our tokens).
  - `src/app/(frontend)/[tenant]/…` — per-tenant routes: `koszyk` (cart), `konto` (account), `moje-zamowienia` (my orders), `reset-hasla`.
  - `src/components/shop/` — `Catalog`, `CartView`, `Header`, `AccountForm`, `AddressBook`, `ReorderButton`, `ResetPasswordForm`, `cart-store`.
  - `src/ecommerce/order-status.ts` — order state machine + Polish status labels.
  - `src/seed.ts` — sample supplier **"Świeże z Kaszub"** and its price list (used verbatim in the UI kit).

> No `public/` folder exists in the repo, so **no brand logo or font binaries were available**. The logo and webfonts in this system are **substitutions** — see Caveats.

---

## Content fundamentals

**Język:** Polski. **Ton:** ciepły, ludzki, na **„Ty"** — jak rozmowa z sąsiadem przez płot. Zero korpo-żargonu, zero marketingowego nadęcia.

- **Zwracamy się na „Ty", nie na „Państwo".** „Zaloguj się, żeby zamówić u sąsiada", „Dorzuć jeszcze za 8,00 zł", „Miło Cię widzieć!".
- **My = sprzedawca/platforma w 1. os. lmn., po ludzku.** „Zadzwonimy, żeby potwierdzić dostawę", „Podeślę aktualny cennik" (sprzedawca pisze jak do znajomego).
- **Ceny = fundament zaufania.** Zawsze czytelne, duże, pogrubione, z przecinkiem dziesiętnym i „zł" po liczbie: **`40,00 zł`**, `7,50 zł / kg`, `1,30 zł / szt.`. Nigdy `40.00 PLN`.
- **Konkret zamiast obietnic.** „Płatność gotówką przy odbiorze — bez żadnych zaliczek", „Dostawa w piątki", „Minimalne zamówienie: 30,00 zł".
- **Stany pisane spokojnie.** Błąd to nie alarm: „Minimalna wartość zamówienia to 30,00 zł." — informujemy i podpowiadamy wyjście, nie straszymy.
- **Casing:** zdaniowy (sentence case) w nagłówkach i przyciskach: „Dodaj do koszyka", „Złóż zamówienie", „Moje zamówienia". Wersaliki tylko na drobne eyebrow-labele z trackingiem.
- **Krótko i rzeczowo.** Etykiety jedno-/dwuwyrazowe: „Koszyk", „Termin dostawy", „Zamów ponownie".
- **Emoji:** oszczędnie i tylko ludzko (🌱 jako maskotka marki w znaku). W UI ikony zamiast emoji — patrz Iconography.

**Status zamówienia (PL, z `order-status.ts`):** Nowe · Potwierdzone · W przygotowaniu · W dostawie · Dostarczone · Anulowane.

---

## Visual foundations

**Vibe:** ciepły drewniany stół, kremowy papier/len, świeże produkty. Spokojnie, naturalnie, bez sterylności i bez „material-design ostrości".

- **Kolory.** Wiodąca **zieleń `#2f7a3f`** (i ciemniejsza `#245f31`) = marka + sukces. **Terakota `#c75b39`** = akcent CTA („Kup", „Dodaj do koszyka"). Neutrale to **ciepły kamień (stone)**, nie zimny szary. Tło strony zawsze **kremowe `#f7f6f2`** — nigdy sterylna biel. Stany: success = zieleń, warning = **miękki bursztyn** (mało sztuk), error = **stonowana ceglana czerwień** (nigdy jaskrawy alarm). Pełne skale 50–900 dla zieleni, kamienia i terakoty.
- **Tła.** Płaskie, ciepłe powierzchnie. Strona = kremowy papier; karty bez ciężkich obwódek. **Brak gradientów** w UI. Gdy brak zdjęcia produktu, kafel staje się **typograficznym plakatem**: miękki, ciepły odcień kategorii (miód = miodowy, warzywa = zielony, kiszonki = terakota, od pszczół = ochra) z **dużą nazwą produktu** — celowo, nie jak brakujące zdjęcie.
- **Zdjęcia.** Gdy są — produktowe, ciepłe, naturalne światło, kwadrat/4:5, `object-fit: cover`, zaokrąglone, **wyeksponowane**. Tożsamość sprzedawcy zawsze obecna jako **subtelny wiersz „sąsiada"** (kropka-monogram + nazwa) = zaufanie, bez ciężkiego chipa.
- **Typografia.** Nagłówki: **Bricolage Grotesque** (humanistyczny grotesk z lekko „ręcznym" charakterem — sąsiedzko, nie korpo). Treść / UI / ceny: **Hanken Grotesk** (czysty, czytelny, równe cyfry tabularne). Ceny zawsze `tnum`+`lnum`, pogrubione.
- **Zaokrąglenia.** Miękkie: kontrolki 6–8 px, karty 12 px, panele 16 px, pełne pille na badge/chip/licznik koszyka. Nic ostrego.
- **Cienie.** Delikatne, **ciepło tonowane** (odrobina kamienia/grafitu, nie czysta czerń). Karta „leży na papierze", nie unosi się. Elewacja oszczędna.
- **Obramowania.** Włoskowate 1 px `#e4e2da` (stone-300) na kartach i inputach; mocniejsze na hoverze.
- **Hover.** Karty: cień rośnie + uniesienie o ~1 px + obramowanie ciemnieje. Przyciski: ciemniejszy odcień tła (np. zieleń → ciemniejsza zieleń). Linki: podkreślenie.
- **Press.** Lekkie ściśnięcie `scale(0.98)` na przyciskach, ciemniejsze tło na krokach ±.
- **Focus.** Spójny **zielony halo** `0 0 0 3px` na wszystkim, na czym da się sfokusować (klawiatura). Zieleń jako sygnał zaufania zostaje nawet w scope'ie tenanta.
- **Ruch.** Cichy i naturalny: ease-out, 120–260 ms, łagodne fade'y i drobne uniesienia. **Bez bounce'ów, bez ripple'i, bez nieskończonych pętli.** Respektujemy `prefers-reduced-motion`.
- **Transparentność / blur.** Minimalnie. Półprzezroczysta biel tylko na chipie sprzedawcy nad zdjęciem (czytelność).
- **Layout.** Mobile-first (osiedlowe zakupy = telefon). Edytorialny, przewiewny: kontener `max-width: 1040px`, duży nagłówek + eyebrow, hojne odstępy. **Lekki, minimalistyczny header** (kremowy, jedna włoskowa linia, delikatny blur) — zieleń niesie tylko znak marki, nie ciężka belka. Kategorie jako **tekstowe zakładki z podkreśleniem**, nie wypełnione pille. Cena = bohater karty; dodawanie to **okrągły terakotowy przycisk** (dziedziczy akcent per-tenant). Minimum pól w checkoutcie (gotówka = brak płatności online).

---

## Per-tenant theming (wymóg architektury)

Globalna warstwa tokenów = tożsamość **od-sąsiada.pl**. Na nią **lekki** override per sprzedawca — **TYLKO kolor akcentu i logo** — przez nadpisanie CSS vars na kontenerze tenanta. Szkielet (tła, neutrale, typografia, komponenty, zielony header, zielony focus-ring) **pozostaje niezmienny**, więc klient zawsze czuje, że jest na od-sąsiada.pl.

```html
<div data-tenant style="--tenant-accent:#7a5cc4; --tenant-accent-strong:#634aa6">
  <!-- mini-sklep sprzedawcy: CTA przejmuje akcent, reszta bez zmian -->
</div>
```

`Button variant="cta"` i `ProductCard` czytają `--accent-cta`, więc w scope'ie `[data-tenant]` automatycznie biorą kolor sprzedawcy. Zobacz kartę **Brand → Per-tenant theming**.

---

## Tailwind + shadcn/ui

Tokeny semantyczne w `tokens/semantic.css` są zapisane jako **kanały HSL** (bez `hsl()`), zgodnie z konwencją shadcn — `--background`, `--foreground`, `--primary`, `--accent`, `--muted`, `--border`, `--ring`, `--card`, `--destructive`, `--success`, `--warning`. Mapowanie w Tailwindzie:

```js
// tailwind.config — theme.extend.colors
colors: {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
  accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
  muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
  destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
  border: 'hsl(var(--border))', input: 'hsl(var(--input))', ring: 'hsl(var(--ring))',
  card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
},
borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
```

Dark mode: dodaj klasę `.dark` (lub `[data-theme="dark"]`) na `<html>`. Wszystkie role mają warianty dark (ciepły grafit, nie czysta czerń).

---

## Iconography

See the **ICONOGRAPHY** section below.

## ICONOGRAPHY

- **Codebase today uses emoji** as icons (`👤`, `🛒`, `🗑`, `✓`, `←`) inline in JSX. For a consistent, scalable system this design system **replaces them with [Lucide](https://lucide.dev)** — a clean, rounded, 2px-stroke line set whose warm, friendly feel matches the brand. ⚠️ This is a **deliberate substitution** (flagged in Caveats); confirm before adopting in production.
- **Stroke style:** outline, `stroke-width: 2`, round caps/joins, `currentColor` so icons inherit text colour. Default size 18–20 px in UI, 16 px inline.
- **How it's loaded:** components inline the few SVG paths they need (cart, user, trash, chevron, alert, refresh) so they stay self-contained with no icon-font dependency. The specimen cards pull the full Lucide set from CDN (`unpkg.com/lucide`) for demos.
- **Recommended glyphs:** `shopping-cart` / `shopping-basket` (koszyk/dodaj), `user-round` (konto), `trash-2` (usuń), `chevron-down` (select), `rotate-ccw` (zamów ponownie), `circle-alert` / `triangle-alert` (stany), `check` (potwierdzenie).
- **Emoji** stays only as the brand mascot sprout (🌱) in the logo fallback — never as functional UI icons.
- **No hand-drawn SVG illustrations.** When product photography exists it's exposed; absent that, the photo-less tile becomes a warm typographic poster (category-tinted), never a broken-image hatch.

---

## Index / manifest

**Root**
- `styles.css` — the single entry point consumers link (import manifest only).
- `readme.md` — this guide.
- `SKILL.md` — Agent-Skill front-matter for use in Claude Code.

**`tokens/`** (each `@import`ed from `styles.css`)
- `fonts.css` — webfont loading + family vars · `palette.css` — raw colour scales · `semantic.css` — shadcn roles + brand aliases + **dark mode** + **per-tenant** · `typography.css` · `spacing.css` · `radius.css` · `elevation.css` · `motion.css` · `base.css` (element resets).

**`assets/logo/`** — `odsasiada-mark.svg`, `odsasiada-wordmark.svg`, `odsasiada-wordmark-light.svg` (⚠ placeholder).

**`components/`** (React primitives — `window.OdSSiadaDesignSystem_…`)
- `buttons/` — **Button** (primary · cta · secondary · ghost · danger · link), **IconButton**
- `forms/` — **Field** (text input), **Select**
- `commerce/` — **Price** (`formatPLN`), **QuantityStepper**, **ProductCard**
- `feedback/` — **Badge** (`ORDER_STATUS`, **StatusBadge**), **Alert**
- `layout/` — **ShopHeader**

**`ui_kits/shop/`** — full interactive recreation: katalog → koszyk → checkout gotówkowy → potwierdzenie → moje zamówienia → logowanie. (`index.html` + `data.js` + screen JSX.)

**`guidelines/`** — foundation specimen cards (Colors, Type, Spacing, Brand) shown on the Design System tab.

---

## Caveats / substitutions

- ⚠️ **Logo is a placeholder.** The repo had no brand asset, so the sprout mark + wordmark were created here. Replace with the real licensed logo (drop files in `assets/logo/`).
- ⚠️ **Fonts are substituted.** No font binaries shipped in the repo. Headings use **Bricolage Grotesque**, body/UI **Hanken Grotesk**, both from Google Fonts (both cover Polish/Latin-Extended). Swap for licensed brand fonts if you have them (edit `tokens/fonts.css`).
- ⚠️ **Icons substituted** emoji → Lucide (see Iconography).
- The repo's UI strings mix English and Polish; this system standardises on **Polish** per the brand brief.
