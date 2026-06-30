Brand button — the main action control; use `cta` (terracotta, tenant-aware) for "Dodaj do koszyka" / "Kup", `primary` (green) for confirmations, `secondary`/`ghost` for quieter actions.

```jsx
<Button variant="cta" size="lg" fullWidth>Dodaj do koszyka</Button>
<Button variant="primary">Złóż zamówienie</Button>
<Button variant="secondary">Anuluj</Button>
<Button variant="ghost" size="sm">Wróć</Button>
```

Variants: `primary` · `cta` · `secondary` · `ghost` · `danger` · `link`.
Sizes: `sm` (36px) · `md` (44px, default) · `lg` (52px). Set `fullWidth` on mobile.
`cta` reads `--accent-cta`, so inside a `[data-tenant]` scope it takes the seller's accent automatically. Use `leadingIcon` / `trailingIcon` for Lucide glyphs.
