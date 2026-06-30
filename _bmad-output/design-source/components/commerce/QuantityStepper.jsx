import React from 'react'

/**
 * od-sąsiada.pl · QuantityStepper
 * The −/value/+ control from the cart. 44px targets, soft pill ends.
 */

const CSS = `
.ods-qty{ display:inline-flex; align-items:center; gap:0; border:1.5px solid var(--border-hairline);
  border-radius:var(--radius-md); background:var(--surface-card); overflow:hidden; }
.ods-qty__btn{ width:40px; height:40px; display:inline-flex; align-items:center; justify-content:center;
  font-size:20px; line-height:1; color:var(--text-body); background:transparent; border:0; cursor:pointer;
  transition:background var(--duration-fast) var(--ease-standard); }
.ods-qty__btn:hover:not(:disabled){ background:var(--stone-100); }
.ods-qty__btn:active:not(:disabled){ background:var(--stone-200); }
.ods-qty__btn:focus-visible{ outline:none; box-shadow:var(--ring-focus); border-radius:var(--radius-sm); }
.ods-qty__btn:disabled{ color:var(--text-faint); cursor:not-allowed; }
.ods-qty__val{ min-width:40px; text-align:center; font-family:var(--font-body); font-weight:var(--fw-bold);
  font-size:var(--text-base); color:var(--text-body); font-feature-settings:var(--price-feature);
  border-left:1.5px solid var(--border-hairline); border-right:1.5px solid var(--border-hairline); height:40px;
  display:inline-flex; align-items:center; justify-content:center; }
.ods-qty[data-size="sm"] .ods-qty__btn{ width:32px; height:32px; font-size:17px; }
.ods-qty[data-size="sm"] .ods-qty__val{ min-width:34px; height:32px; }
`

let injected = false
function useQtyStyles() {
  if (typeof document === 'undefined' || injected) return
  injected = true
  const el = document.createElement('style')
  el.setAttribute('data-ods', 'qty')
  el.textContent = CSS
  document.head.appendChild(el)
}

export function QuantityStepper({ value, onChange = () => {}, min = 1, max = 99, size = 'md', className = '' }) {
  useQtyStyles()
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(Math.min(max, value + 1))
  return (
    <div className={`ods-qty ${className}`.trim()} data-size={size}>
      <button type="button" className="ods-qty__btn" onClick={dec} disabled={value <= min} aria-label="Mniej">−</button>
      <span className="ods-qty__val" aria-live="polite">{value}</span>
      <button type="button" className="ods-qty__btn" onClick={inc} disabled={value >= max} aria-label="Więcej">+</button>
    </div>
  )
}
