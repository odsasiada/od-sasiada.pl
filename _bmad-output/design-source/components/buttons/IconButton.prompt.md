Square, icon-only action button for toolbars and rows (remove from cart, close, qty). Pair with a Lucide icon and always set `aria-label`.

```jsx
<IconButton aria-label="Usuń z koszyka" variant="danger">
  <i data-lucide="trash-2"></i>
</IconButton>
```

Variants: `ghost` (default), `outline`, `danger` (red hover). Sizes: `sm`/`md`/`lg` — keep `md` (44px) for primary mobile targets.
