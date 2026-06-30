# Branding per-tenant — od-sąsiada.pl

> Jak globalne tokeny są nadpisywane wartościami sprzedawcy, bez rozbijania spójności platformy.
> Źródło: [`design-source/tokens/semantic.css`](../design-source/tokens/semantic.css) (sekcja „Per-tenant theming").

## Model warstw

```
baza globalna (semantic.css :root)   →   --tenant-accent = terracotta-500 (domyślnie)
        │
        ▼  scope [data-tenant]  (override TYLKO akcentu)
   --accent-cta        = var(--tenant-accent)
   --accent-cta-strong = var(--tenant-accent-strong)
   --accent            = var(--tenant-accent)
        │
        ▼
   render: szkielet (powierzchnie, neutrale, typografia, komponenty) NIEZMIENNY
```

Kupujący zawsze czuje, że jest na od-sąsiada.pl — zmienia się jedynie kolor akcentu sprzedawcy.

## Mechanizm nadpisywania

CSS variables wstrzykiwane na kontenerze tenanta. Wzorzec z design systemu:

```html
<div data-tenant style="--tenant-accent:#7a5cc4; --tenant-accent-strong:#634aa6">
  … mini-sklep sprzedawcy …
</div>
```

Reguła `[data-tenant]` przepina `--tenant-accent` na `--accent-cta` / `--accent`.
Komponenty czytające CTA używają `var(--accent-cta)` → automatycznie biorą akcent tenanta.

**Docelowo w repo:** owinąć `src/app/(frontend)/[tenant]/layout.tsx` w `<div data-tenant>`.
Na teraz akcent = **domyślna terakota** (pole koloru w kolekcji Tenants odłożone; architektura gotowa).

## Co tenant może zmienić

| Element | Override | Uzasadnienie |
|---------|----------|--------------|
| `--tenant-accent` / `--tenant-accent-strong` | ✅ | rozpoznawalność sprzedawcy (jedyne nadpisywane) |
| logo | ✅ | tożsamość sprzedawcy (`--tenant-logo` / props) |
| spacing / typografia / neutrale / powierzchnie / komponenty | ❌ | spójność od-sąsiada.pl |

## Źródło wartości

**Stan obecny:** brak pola koloru w kolekcji Tenants — używana domyślna terakota.
**TODO (osobne zadanie):** dodać pole `accent` (hex) do kolekcji Tenants w Payload i wstrzykiwać
jako inline `--tenant-accent` w layoucie tenanta. Wartość MUSI przejść walidację kontrastu (niżej).

## Fallback

Brak akcentu u tenanta → token globalny (`--tenant-accent` = `terracotta-500`).
Wzorzec w komponentach: `background: var(--tenant-accent, var(--accent-cta))`.

## Dark mode

W dark mode role marki są przepięte (`--accent-cta` → `terracotta-400/300`), ale `[data-tenant]`
nadal nadpisuje akcent wartością sprzedawcy — szkielet ciemny pozostaje wspólny.

## Dostępność override'ów

Kolor akcentu nadpisany przez tenanta **MUSI** przejść walidację kontrastu na tłach systemu
(białe karty, kremowa strona) — tekst na akcencie ≥ 4.5:1. Patrz [accessibility.md](./accessibility.md).
