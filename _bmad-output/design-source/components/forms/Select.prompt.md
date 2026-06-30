Labelled native select, styled to match Field. Use for product variants, saved addresses and delivery slots.

```jsx
<Select label="Porcja" value={variantId} onChange={...}>
  <option value="1-kg">1 kg — 8,50 zł</option>
  <option value="5-kg">5 kg — 32,00 zł</option>
</Select>
```

Spreads all native `<select>` props; renders its own chevron.
