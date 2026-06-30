Sticky green shop header. Always carries the global od-sąsiada.pl mark + eyebrow alongside the seller's shop name, so the shopper knows they're on the platform.

```jsx
<ShopHeader tenantName="Świeże z Kaszub" customerName="Krystyna"
  cartCount={3} cartTotal={8600} onCart={...} onAccount={...} />
```

`cartTotal` is in grosze. The cart count chip hides when empty; account label collapses to an icon on narrow screens.
