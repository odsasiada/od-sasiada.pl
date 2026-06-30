Labelled text input — the default form control. Pass `error` to show the invalid (brick) state, `hint` for help text, `optional` to mark non-required fields.

```jsx
<Field label="Telefon" type="tel" required value={phone} onChange={...} />
<Field label="E-mail" type="email" optional hint="Wyślemy potwierdzenie zamówienia." />
<Field label="Kod pocztowy" error="Podaj kod w formacie 00-000." />
```

Mobile-first 44px target, green focus ring. Spreads all native `<input>` props.
