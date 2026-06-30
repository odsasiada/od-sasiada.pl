// od-sąsiada.pl · Catalog screen — editorial, minimal seller home.
const { ProductCard } = window.OdSSiadaDesignSystem_16cae9

const TONE_BY_CAT = { 'Miody': 'honey', 'Warzywa': 'leaf', 'Kiszonki': 'pickle', 'Od pszczół': 'bee' }

function CategoryNav({ cats, active, onPick }) {
  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', borderBottom: '1px solid var(--border-hairline)', marginBottom: 32 }}>
      {cats.map((c) => {
        const on = c === active
        return (
          <button key={c} type="button" onClick={() => onPick(c)}
            style={{
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 'var(--text-sm)',
              padding: '0 0 12px', background: 'none', border: 0, cursor: 'pointer',
              color: on ? 'var(--text-body)' : 'var(--text-faint)',
              borderBottom: '2px solid ' + (on ? 'var(--brand)' : 'transparent'), marginBottom: -1,
              transition: 'color var(--duration-fast) var(--ease-standard)',
            }}>
            {c}
          </button>
        )
      })}
    </div>
  )
}

function Hero({ tenant }) {
  const meta = [
    `Min. ${(tenant.minOrderValue/100).toFixed(2).replace('.', ',')} zł`,
    'Dostawa w piątki',
    'Płatność gotówką',
    `tel. ${tenant.contactPhone}`,
  ]
  return (
    <header style={{ maxWidth: 680, margin: '0 0 44px' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-xs)',
        fontWeight: 700, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 16, whiteSpace: 'nowrap' }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--brand)' }}></span>
        Prosto od sąsiada
      </span>
      <h1 style={{ fontSize: 'var(--text-2xl)', lineHeight: 1.02, letterSpacing: 'var(--tracking-tight)', margin: '0 0 14px' }}>
        {tenant.name}
      </h1>
      <p style={{ fontSize: 'var(--text-md)', color: 'var(--text-muted)', margin: '0 0 20px', maxWidth: 540, lineHeight: 1.5 }}>
        Miód, jaja i domowe kiszonki prosto od ludzi z Twojej okolicy. Zamawiasz online, płacisz gotówką przy odbiorze.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 0', alignItems: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
        {meta.map((m, i) => (
          <React.Fragment key={m}>
            {i > 0 ? <span style={{ margin: '0 12px', width: 3, height: 3, borderRadius: 999, background: 'var(--stone-400)', display: 'inline-block' }}></span> : null}
            <span>{m}</span>
          </React.Fragment>
        ))}
      </div>
      <p style={{ fontSize: 'var(--text-xs)', fontStyle: 'italic', color: 'var(--text-faint)', margin: '14px 0 0', maxWidth: 540 }}>
        {tenant.priceNotice}
      </p>
    </header>
  )
}

function CatalogScreen({ data, onAdd }) {
  const [cat, setCat] = React.useState('Wszystko')
  const [variants, setVariants] = React.useState({})
  const [addedId, setAddedId] = React.useState(null)
  const products = cat === 'Wszystko' ? data.products : data.products.filter((p) => p.cat === cat)

  const add = (p) => {
    if (p.seasonal) return
    const vv = variants[p.id] ?? (p.variants ? p.variants[0].value : undefined)
    const v = p.variants && p.variants.find((x) => x.value === vv)
    onAdd({ id: p.id + (vv ? ':' + vv : ''), title: p.title,
      variantLabel: v ? v.label.split(' — ')[0] : null, price: v ? v.price : p.price })
    setAddedId(p.id)
    setTimeout(() => setAddedId((c) => (c === p.id ? null : c)), 1100)
  }

  return (
    <main style={{ maxWidth: 1040, margin: '0 auto', padding: '40px 24px 64px' }}>
      <Hero tenant={data.tenant} />
      <CategoryNav cats={data.categories} active={cat} onPick={setCat} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(232px, 1fr))', gap: '36px 24px' }}>
        {products.map((p) => {
          const vv = variants[p.id] ?? (p.variants ? p.variants[0].value : undefined)
          const selV = p.variants && p.variants.find((x) => x.value === vv)
          const shownPrice = p.variants ? (selV ? selV.price : null) : p.price
          return (
            <ProductCard key={p.id} title={p.title} category={p.cat}
              tone={TONE_BY_CAT[p.cat] || 'stone'}
              price={shownPrice} unit={p.unit} seller="Świeże z Kaszub" seasonal={p.seasonal}
              lowStock={p.lowStock ?? null}
              variants={p.variants} variantValue={vv}
              onVariantChange={(e) => setVariants((s) => ({ ...s, [p.id]: e.target.value }))}
              added={addedId === p.id} onAdd={() => add(p)} />
          )
        })}
      </div>
    </main>
  )
}

window.CatalogScreen = CatalogScreen
