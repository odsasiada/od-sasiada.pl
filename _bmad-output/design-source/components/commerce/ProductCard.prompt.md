Catalog product card — the centrepiece. Exposed square photo, a prominent **seller chip** (the core trust signal), price (or variant select), and the terracotta CTA.

```jsx
<ProductCard
  title="Miód rzepakowy 1 L" price={4000} seller="Świeże z Kaszub"
  description="Prosto z pasieki." onAdd={() => add(...)} />

<ProductCard title="Pomidory malinowe" seller="Ogród Pani Krysi" seasonal />
<ProductCard title="Jaja wiejskie" price={130} unit="szt." seller="Świeże z Kaszub" lowStock={4} />
```

Composes Price, Badge, Button, Select, QuantityStepper. Omit `image` to get the brand hatch placeholder. Wrap a grid of these in `[data-tenant]` to theme the CTA per seller.
