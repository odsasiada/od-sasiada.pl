// od-sąsiada.pl · Account — login / register / forgot, all on Ty.
const { Field, Button, Alert } = window.OdSSiadaDesignSystem_16cae9

function AccountScreen({ onLogin, onBack }) {
  const [mode, setMode] = React.useState('login')
  const [form, setForm] = React.useState({ firstName: '', lastName: '', phone: '', email: 'krystyna@example.com', password: 'sasiedzi' })
  const [info, setInfo] = React.useState(null)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    if (mode === 'forgot') { setInfo('Jeśli konto istnieje, wysłaliśmy e-mail z linkiem do zmiany hasła.'); return }
    onLogin(form.firstName || 'Krystyna')
  }

  const Tab = ({ id, children }) => (
    <button type="button" onClick={() => { setMode(id); setInfo(null) }}
      style={{ flex: 1, padding: 10, fontWeight: 700, fontSize: 'var(--text-sm)', cursor: 'pointer',
        borderRadius: 'var(--radius-md)', border: '1.5px solid ' + (mode === id ? 'var(--brand)' : 'var(--border-hairline)'),
        background: mode === id ? 'var(--brand)' : 'var(--surface-page)', color: mode === id ? '#fff' : 'var(--text-muted)' }}>
      {children}
    </button>
  )

  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: '40px 24px 64px' }}>
      <Button variant="ghost" size="sm" onClick={onBack}>← Wróć do katalogu</Button>
      <h1 style={{ fontSize: 'var(--text-xl)', letterSpacing: 'var(--tracking-tight)', margin: '14px 0 18px' }}>Miło Cię widzieć</h1>
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-xl)', padding: 22, boxShadow: 'var(--shadow-sm)' }}>
        <p style={{ margin: '0 0 18px', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
          Zaloguj się, żeby zamówić u sąsiada i śledzić swoje zamówienia.
        </p>
        {mode !== 'forgot' ? (
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <Tab id="login">Logowanie</Tab>
            <Tab id="register">Załóż konto</Tab>
          </div>
        ) : null}

        {info ? <Alert tone="success">{info}</Alert> : null}

        <form onSubmit={submit}>
          {mode === 'register' ? (
            <>
              <Field label="Imię" value={form.firstName} onChange={set('firstName')} required />
              <Field label="Nazwisko" value={form.lastName} onChange={set('lastName')} required />
              <Field label="Telefon" type="tel" value={form.phone} onChange={set('phone')} required />
            </>
          ) : null}
          <Field label="E-mail" type="email" value={form.email} onChange={set('email')} required />
          {mode !== 'forgot' ? (
            <Field label="Hasło" type="password" value={form.password} onChange={set('password')} required />
          ) : null}
          <Button variant="primary" fullWidth type="submit">
            {mode === 'login' ? 'Zaloguj się' : mode === 'register' ? 'Załóż konto' : 'Wyślij link'}
          </Button>
        </form>

        {mode === 'login' ? (
          <div style={{ marginTop: 12 }}><Button variant="link" onClick={() => setMode('forgot')}>Nie pamiętasz hasła?</Button></div>
        ) : null}
        {mode === 'forgot' ? (
          <div style={{ marginTop: 12 }}><Button variant="link" onClick={() => setMode('login')}>← Wróć do logowania</Button></div>
        ) : null}
      </div>
    </main>
  )
}

window.AccountScreen = AccountScreen
