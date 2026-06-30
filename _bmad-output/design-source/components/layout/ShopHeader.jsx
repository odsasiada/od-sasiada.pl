import React from 'react'
import { formatPLN } from '../commerce/Price.jsx'

/**
 * od-sąsiada.pl · ShopHeader
 * Minimal, editorial header. Light surface with a single hairline — green is
 * carried by the mark and the wordmark eyebrow, not a heavy slab — so the brand
 * stays present while the catalog below does the talking. Account + cart are
 * quiet entry points; the cart total appears only when there's something in it.
 */

const CSS = `
.ods-hd{ position:sticky; top:0; z-index:20; display:flex; align-items:center; justify-content:space-between;
  gap:16px; padding:16px 24px; background:color-mix(in srgb, var(--surface-page) 86%, transparent);
  -webkit-backdrop-filter:saturate(1.1) blur(8px); backdrop-filter:saturate(1.1) blur(8px);
  border-bottom:1px solid var(--border-hairline); }
.ods-hd__brand{ display:inline-flex; align-items:center; gap:12px; min-width:0; cursor:pointer; }
.ods-hd__names{ display:flex; flex-direction:column; line-height:1.05; min-width:0; }
.ods-hd__eyebrow{ font-size:10px; font-weight:var(--fw-bold); letter-spacing:var(--tracking-caps);
  text-transform:uppercase; color:var(--text-faint); }
.ods-hd__shop{ font-family:var(--font-display); font-weight:var(--fw-bold); font-size:var(--text-md);
  color:var(--text-body); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:var(--tracking-snug); }
.ods-hd__nav{ display:flex; align-items:center; gap:6px; }
.ods-hd__link{ display:inline-flex; align-items:center; gap:7px; padding:9px 12px; border-radius:var(--radius-pill);
  font-weight:var(--fw-semibold); font-size:var(--text-sm); color:var(--text-muted); cursor:pointer; white-space:nowrap;
  background:transparent; border:0; transition:background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
.ods-hd__link:hover{ background:var(--stone-200); color:var(--text-body); }
.ods-hd__cart{ background:var(--text-body); color:var(--surface-card); }
.ods-hd__cart:hover{ background:#000; color:var(--surface-card); }
.ods-hd__count{ display:inline-flex; align-items:center; padding:1px 8px; margin-left:2px; border-radius:var(--radius-pill);
  font-size:var(--text-xs); font-weight:var(--fw-bold); color:var(--text-body); background:var(--accent-cta);
  color:#fff; font-feature-settings:var(--price-feature); }
@media (max-width:560px){ .ods-hd__hideSm{ display:none; } .ods-hd{ padding:14px 18px; } }
`

let injected = false
function useHeaderStyles() {
  if (typeof document === 'undefined' || injected) return
  injected = true
  const el = document.createElement('style')
  el.setAttribute('data-ods', 'header')
  el.textContent = CSS
  document.head.appendChild(el)
}

const Mark = () => (
  <svg width="34" height="34" viewBox="0 0 56 56" aria-hidden="true" style={{ flexShrink: 0 }}>
    <circle cx="28" cy="28" r="28" fill="var(--brand)" />
    <path d="M28 45c0-7-1.5-11.5-5.5-15" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M28 33c-9 0-14.5-5-13.5-13C23 19 28 25 28 33Z" fill="#fff" />
    <path d="M29 30c0-8 4.5-13.5 13-13.5C42.5 25 37 30 29 30Z" fill="#cfe6d4" />
  </svg>
)

export function ShopHeader({
  tenantName = 'Świeże z Kaszub', customerName = null,
  cartCount = 0, cartTotal = 0, onCart = () => {}, onAccount = () => {}, className = '',
}) {
  useHeaderStyles()
  return (
    <header className={`ods-hd ${className}`.trim()}>
      <a className="ods-hd__brand" onClick={onAccount}>
        <Mark />
        <span className="ods-hd__names">
          <span className="ods-hd__eyebrow">od-sąsiada.pl</span>
          <span className="ods-hd__shop">{tenantName}</span>
        </span>
      </a>
      <nav className="ods-hd__nav">
        <button type="button" className="ods-hd__link" onClick={onAccount}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M5.5 21a8.38 8.38 0 0 1 13 0"/></svg>
          <span className="ods-hd__hideSm">{customerName || 'Zaloguj się'}</span>
        </button>
        <button type="button" className="ods-hd__link ods-hd__cart" onClick={onCart}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 2h2.2l2.3 13a1.6 1.6 0 0 0 1.6 1.3h8.7a1.6 1.6 0 0 0 1.6-1.3L21 6H5.3"/></svg>
          <span className="ods-hd__hideSm">Koszyk</span>
          {cartCount > 0 ? <span className="ods-hd__count">{cartCount} · {formatPLN(cartTotal)}</span> : null}
        </button>
      </nav>
    </header>
  )
}
