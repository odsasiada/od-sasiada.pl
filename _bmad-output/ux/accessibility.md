# Dostępność — od-sąsiada.pl

> Cel: WCAG 2.1 AA. Szczególny nacisk: walidacja kontrastu przy per-tenant override.

## Poziom docelowy

WCAG 2.1 AA.

## Kontrast

- Tekst normalny ≥ **4.5:1**, tekst duży (≥ 18px bold / 24px) ≥ **3:1**, elementy UI/ikony ≥ **3:1**.
- Paleta zaprojektowana pod kontrast: ink `stone-900` na `stone-100`/`white`, terakota `500/600`
  i zieleń `600/700` dają biały tekst ≥ 4.5:1.
- **Walidacja koloru nadpisanego przez tenanta** — akcent (`--tenant-accent`) z białym tekstem CTA
  musi spełniać kontrast na białych kartach i kremowej stronie. Gdy nie spełnia → odrzuć / przyciemnij.
  Ref: [tenant-theming.md](./tenant-theming.md).

## Nawigacja klawiaturą

- Pełna obsługa tab / enter / esc; logiczna kolejność focusu.
- Cele dotykowe/klikalne ≥ `--tap-min` (44px).

## Focus i stany

- Widoczny focus ring: `--ring-focus` (`0 0 0 3px hsl(var(--ring)/.35)`, zielona poświata).
- Stany hover/active/disabled rozróżnialne **nie tylko kolorem** (lift, scale, opacity, ikona).
- `prefers-reduced-motion: reduce` respektowane — czasy ruchu → 0ms (tokeny motion).

## Czytniki ekranu

- `aria-label` dla akcji-ikon (np. okrągły przycisk „+" na karcie produktu, pill koszyka).
- `alt` dla zdjęć produktów i logo tenantów; dekoracyjne tinty/placeholdery → `alt=""`.
- Statusy zamówień jako tekst (label PL), nie sam kolor badge.

## Formularze

- `label` programowo powiązane z polem; dopisek „(opcjonalnie)" dla pól nieobowiązkowych.
- Komunikat błędu (`error`) programowo powiązany z kontrolą (`aria-describedby`); stan invalid
  sygnalizowany **nie tylko kolorem** (tekst błędu + ceglane obramowanie).
- Cena czytelna jako tekst (separator przecinek, „zł"), nie tylko wizualnie.
