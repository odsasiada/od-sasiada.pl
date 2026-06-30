// od-sąsiada.pl · Cart + cash-on-delivery checkout. Minimum friction.
const { Field, Select, Button, Alert, QuantityStepper, Price } = window.OdSSiadaDesignSystem_16cae9
const formatPLN = (g) => `${(g / 100).toFixed(2).replace('.', ',')} zł`

function CartScreen({ items, setQty, removeItem, tenant, loggedIn, onRequireLogin, onPlaced, onBack }) {
  const [contact, setContact] = React.useState({ firstName: 'Krystyna', lastName: 'Nowak', phone: '601 234 567', addr: '', code: '', city: 'Kościerzyna', email: '' })
  const [slot, setSlot] = React.useState('')
  const [placed, setPlaced] = React.useState(null)
  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  const belowMin = total < tenant.minOrderValue
  const set = (k) => (e) => setContact((c) => ({ ...c, [k]: e.target.value }))

  if (placed) {
    return (
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '56px 24px 64px' }}>
        <Alert tone="success" title={`Dziękujemy! Zamówienie ${placed} przyjęte.`}>
          Zadzwonimy, żeby potwierdzić dostawę. Płacisz gotówką przy odbiorze — bez żadnych zaliczek.
        </Alert>
        <div style={{ marginTop: 16 }}>
          <Button variant="ghost" onClick={onBack}>← Wróć do katalogu</Button>
        </div>
      </main>
    )
  }

  const place = () => {
    if (!loggedIn) { onRequireLogin(); return }
    const num = '2024-' + Math.floor(120 + Math.random() * 80)
    setPlaced(num)
    onPlaced({ number: num, total, items })
  }

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px 64px' }}>
      <Button variant="ghost" size="sm" onClick={onBack} className="cart-back">← Wróć do katalogu</Button>
      <h1 style={{ fontSize: 'var(--text-2xl)', letterSpacing: 'var(--tracking-tight)', margin: '14px 0 20px' }}>Twój koszyk</h1>

      {items.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Koszyk jest pusty. Zajrzyj do katalogu sąsiada.</p>
      ) : (
        <>
          {items.map((i) => (
            <div key={i.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border-hairline)' }}>
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{i.title}</div>
                {i.variantLabel ? <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{i.variantLabel}</div> : null}
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>{formatPLN(i.price)} / szt.</div>
              </div>
              <QuantityStepper value={i.qty} onChange={(n) => setQty(i.id, n)} size="sm" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 96, justifyContent: 'flex-end' }}>
                <strong style={{ fontFeatureSettings: 'var(--price-feature)' }}>{formatPLN(i.price * i.qty)}</strong>
                <button type="button" onClick={() => removeItem(i.id)} aria-label="Usuń"
                  style={{ border: 0, background: 'transparent', color: 'var(--text-faint)', cursor: 'pointer', display: 'inline-flex', padding: 4 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                </button>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '18px 0' }}>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Razem</span>
            <Price value={total} size="lg" />
          </div>

          {belowMin ? (
            <Alert tone="error">Minimalna wartość zamówienia to {formatPLN(tenant.minOrderValue)}. Dorzuć jeszcze za {formatPLN(tenant.minOrderValue - total)}.</Alert>
          ) : null}

          <h2 style={{ fontSize: 'var(--text-lg)', margin: '22px 0 12px' }}>Dane do dostawy</h2>
          {!loggedIn ? (
            <Alert tone="info" title="Zaloguj się, aby złożyć zamówienie." icon={false}>
              <div style={{ marginTop: 10 }}><Button variant="primary" onClick={onRequireLogin}>Zaloguj się i wróć do koszyka</Button></div>
            </Alert>
          ) : (
            <>
              <Select label="Termin dostawy" value={slot} onChange={(e) => setSlot(e.target.value)}>
                <option value="">— wybierz termin —</option>
                <option>Piątek 27.06, 16:00–18:00</option>
                <option>Piątek 27.06, 18:00–20:00</option>
              </Select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <Field label="Imię" value={contact.firstName} onChange={set('firstName')} required />
                <Field label="Nazwisko" value={contact.lastName} onChange={set('lastName')} required />
                <Field label="Telefon" type="tel" value={contact.phone} onChange={set('phone')} required />
                <Field label="Ulica i numer" value={contact.addr} onChange={set('addr')} required />
                <Field label="Kod pocztowy" value={contact.code} onChange={set('code')} required />
                <Field label="Miejscowość" value={contact.city} onChange={set('city')} required />
              </div>
              <Field label="E-mail" type="email" value={contact.email} onChange={set('email')} optional hint="Wyślemy potwierdzenie zamówienia." />
              <Button variant="cta" size="lg" fullWidth disabled={belowMin || !slot} onClick={place}>
                Zamawiam — płatność gotówką przy odbiorze
              </Button>
            </>
          )}
        </>
      )}
    </main>
  )
}

window.CartScreen = CartScreen
