// od-sąsiada.pl · UI-kit app shell — routes between catalog, cart, orders, account.
const { ShopHeader } = window.OdSSiadaDesignSystem_16cae9

function App() {
  const data = window.SHOP_DATA
  const [route, setRoute] = React.useState('catalog')
  const [cart, setCart] = React.useState([])
  const [customer, setCustomer] = React.useState(null) // name or null
  const [orders, setOrders] = React.useState(data.orders)
  const [pendingCheckout, setPendingCheckout] = React.useState(false)

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)

  const addToCart = (item) => setCart((c) => {
    const ex = c.find((x) => x.id === item.id)
    if (ex) return c.map((x) => x.id === item.id ? { ...x, qty: x.qty + 1 } : x)
    return [...c, { ...item, qty: 1 }]
  })
  const setQty = (id, n) => setCart((c) => n <= 0 ? c.filter((x) => x.id !== id) : c.map((x) => x.id === id ? { ...x, qty: n } : x))
  const removeItem = (id) => setCart((c) => c.filter((x) => x.id !== id))

  const login = (name) => {
    setCustomer(name)
    setRoute(pendingCheckout ? 'cart' : 'orders')
    setPendingCheckout(false)
  }
  const requireLogin = () => { setPendingCheckout(true); setRoute('account') }

  const onPlaced = ({ number, total, items }) => {
    setOrders((o) => [{ number, status: 'new', date: 'przed chwilą', amount: total,
      items: items.map((i) => ({ q: i.qty, name: i.title, price: i.price })) }, ...o])
    setCart([])
  }
  const reorder = (order) => {
    setCart(order.items.map((it, idx) => ({ id: 'reorder-' + order.number + '-' + idx, title: it.name, price: it.price, qty: it.q, variantLabel: null })))
    setRoute('cart')
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--surface-page)' }}>
      <ShopHeader tenantName={data.tenant.name} customerName={customer}
        cartCount={cartCount} cartTotal={cartTotal}
        onCart={() => setRoute('cart')}
        onAccount={() => setRoute(customer ? 'orders' : 'account')} />

      {route === 'catalog' ? <window.CatalogScreen data={data} onAdd={addToCart} /> : null}
      {route === 'cart' ? (
        <window.CartScreen items={cart} setQty={setQty} removeItem={removeItem} tenant={data.tenant}
          loggedIn={!!customer} onRequireLogin={requireLogin} onPlaced={onPlaced} onBack={() => setRoute('catalog')} />
      ) : null}
      {route === 'orders' ? (
        <window.OrdersScreen orders={orders} customerName={customer || 'Gość'} onReorder={reorder} onBack={() => setRoute('catalog')} />
      ) : null}
      {route === 'account' ? <window.AccountScreen onLogin={login} onBack={() => setRoute('catalog')} /> : null}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
