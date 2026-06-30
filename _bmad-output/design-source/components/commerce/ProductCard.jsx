import React from 'react'
import { Price } from './Price.jsx'
import { QuantityStepper } from './QuantityStepper.jsx'
import { Badge } from '../feedback/Badge.jsx'
import { Select } from '../forms/Select.jsx'

/**
 * od-sąsiada.pl · ProductCard
 * Editorial, minimal catalog unit. When there's no photo (the common case) the
 * tile becomes a typographic poster: a soft warm category tint with the product
 * name set large — intentional, not a "missing image". A quiet seller line
 * carries the trust signal; the circular terracotta button is the add CTA and
 * adopts the per-tenant accent inside [data-tenant].
 */

const TINTS = {
  honey: 'var(--tint-honey)', leaf: 'var(--tint-leaf)', pickle: 'var(--tint-pickle)',
  bee: 'var(--tint-bee)', stone: 'var(--tint-stone)',
}

const CSS = `
.ods-pc{ display:flex; flex-direction:column; gap:14px; }
.ods-pc__tile{ position:relative; width:100%; aspect-ratio:4/5; border-radius:var(--radius-xl);
  overflow:hidden; background:var(--tint-stone); display:flex; flex-direction:column; justify-content:flex-end;
  padding:18px; transition:transform var(--duration-base) var(--ease-standard); }
.ods-pc:hover .ods-pc__tile{ transform:translateY(-3px); }
.ods-pc__tile img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.ods-pc__cat{ position:absolute; top:16px; left:18px; font-size:var(--text-2xs); font-weight:var(--fw-bold);
  letter-spacing:var(--tracking-caps); text-transform:uppercase; color:var(--green-800); opacity:.62; }
.ods-pc__stock{ position:absolute; top:13px; right:13px; }
.ods-pc__name{ position:relative; font-family:var(--font-display); font-weight:var(--fw-bold);
  font-size:var(--text-xl); line-height:1.04; letter-spacing:var(--tracking-tight); color:var(--green-900);
  text-wrap:balance; }
.ods-pc__seller{ display:inline-flex; align-items:center; gap:7px; font-size:var(--text-xs);
  font-weight:var(--fw-semibold); color:var(--text-muted); }
.ods-pc__seller b{ width:18px; height:18px; border-radius:999px; background:var(--brand); color:#fff;
  display:inline-flex; align-items:center; justify-content:center; font-size:10px; flex-shrink:0; }
.ods-pc__foot{ display:flex; align-items:center; justify-content:space-between; gap:12px; }
.ods-pc__add{ width:46px; height:46px; flex-shrink:0; border:0; border-radius:var(--radius-full); cursor:pointer;
  background:var(--accent-cta); color:#fff; display:inline-flex; align-items:center; justify-content:center;
  transition:background var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard); }
.ods-pc__add:hover:not(:disabled){ background:var(--accent-cta-strong); }
.ods-pc__add:active:not(:disabled){ transform:scale(0.93); }
.ods-pc__add:focus-visible{ outline:none; box-shadow:var(--ring-focus); }
.ods-pc__add[data-added="true"]{ background:var(--brand); }
.ods-pc__add:disabled{ background:var(--surface-sunken); color:var(--text-faint); cursor:not-allowed; }
.ods-pc__ask{ font-size:var(--text-sm); font-weight:var(--fw-semibold); color:var(--brand-strong);
  background:none; border:0; cursor:pointer; padding:0; text-decoration:underline; text-underline-offset:3px; }
`

let injected = false
function usePcStyles() {
  if (typeof document === 'undefined' || injected) return
  injected = true
  const el = document.createElement('style')
  el.setAttribute('data-ods', 'productcard')
  el.textContent = CSS
  document.head.appendChild(el)
}

export function ProductCard({
  title, description, price, unit, seller, image, imageAlt = '',
  category, tone = 'stone', seasonal = false, lowStock = null,
  variants, variantValue, onVariantChange,
  onAdd = () => {}, added = false, className = '',
}) {
  usePcStyles()
  const tint = TINTS[tone] || TINTS.stone
  const initial = seller ? seller.trim().charAt(0).toUpperCase() : '🌱'
  return (
    <div className={`ods-pc ${className}`.trim()}>
      <div className="ods-pc__tile" style={{ background: image ? 'var(--stone-200)' : tint }}>
        {image ? <img src={image} alt={imageAlt} /> : null}
        {category ? <span className="ods-pc__cat">{category}</span> : null}
        {lowStock != null ? (
          <span className="ods-pc__stock"><Badge tone="warning" size="sm">Zostało {lowStock}</Badge></span>
        ) : seasonal ? (
          <span className="ods-pc__stock"><Badge tone="accent" size="sm">Sezonowe</Badge></span>
        ) : null}
        {!image ? <span className="ods-pc__name">{title}</span> : null}
      </div>

      {image ? <h3 className="ods-pc__name" style={{ fontSize: 'var(--text-lg)' }}>{title}</h3> : null}

      {seller ? (
        <span className="ods-pc__seller"><b aria-hidden="true">{initial}</b>{seller}</span>
      ) : null}

      {variants && variants.length ? (
        <Select value={variantValue} onChange={onVariantChange} style={{ marginBottom: 0 }} aria-label={`Wariant — ${title}`}>
          {variants.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
        </Select>
      ) : null}

      <div className="ods-pc__foot">
        {seasonal ? (
          <>
            <Price seasonal />
            <button type="button" className="ods-pc__ask" onClick={onAdd}>Zapytaj o cenę →</button>
          </>
        ) : (
          <>
            <Price value={price} unit={unit} size="lg" />
            <button type="button" className="ods-pc__add" data-added={added ? 'true' : undefined}
              onClick={onAdd} aria-label={`Dodaj ${title} do koszyka`}>
              {added ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
