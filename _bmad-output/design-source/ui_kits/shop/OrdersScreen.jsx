// od-sąsiada.pl · My orders — status + reorder.
const { StatusBadge, Button } = window.OdSSiadaDesignSystem_16cae9
const formatPLN = (g) => `${(g / 100).toFixed(2).replace('.', ',')} zł`

function OrderCard({ order, onReorder }) {
  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-xl)', padding: 22, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', whiteSpace: 'nowrap' }}>{order.number}</strong>
        <StatusBadge status={order.status} />
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 6 }}>{order.date}</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0' }}>
        {order.items.map((it, idx) => (
          <li key={idx} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)', padding: '3px 0' }}>
            {it.q} × {it.name} <span style={{ color: 'var(--text-muted)' }}>— {formatPLN(it.price * it.q)}</span>
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <strong style={{ fontFeatureSettings: 'var(--price-feature)' }}>Razem: {formatPLN(order.amount)}</strong>
        <Button variant="secondary" size="sm" onClick={() => onReorder(order)}
          leadingIcon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.4 2.6L3 8"/><path d="M3 3v5h5"/></svg>}>
          Zamów ponownie
        </Button>
      </div>
    </div>
  )
}

function OrdersScreen({ orders, customerName, onReorder, onBack }) {
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px 64px' }}>
      <Button variant="ghost" size="sm" onClick={onBack}>← Wróć do katalogu</Button>
      <h1 style={{ fontSize: 'var(--text-2xl)', letterSpacing: 'var(--tracking-tight)', margin: '14px 0 4px' }}>Moje zamówienia</h1>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 0 }}>
        Zalogowany jako {customerName}
      </p>
      {orders.length === 0
        ? <p style={{ color: 'var(--text-muted)' }}>Nie masz jeszcze żadnych zamówień.</p>
        : orders.map((o) => <OrderCard key={o.number} order={o} onReorder={onReorder} />)}
    </main>
  )
}

window.OrdersScreen = OrdersScreen
