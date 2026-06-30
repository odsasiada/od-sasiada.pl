import React from 'react'

/**
 * od-sąsiada.pl · Price
 * The single most trust-critical element. Formats grosze (integer) into PLN
 * with a comma decimal and "zł" suffix, tabular lining numerals, heavy weight.
 * Pass `seasonal` for draft products with no fixed price.
 */

const CSS = `
.ods-price{ font-family:var(--font-price); font-weight:var(--fw-price); color:var(--text-price);
  font-feature-settings:var(--price-feature); line-height:1.1; display:inline-flex; align-items:baseline; gap:6px; white-space:nowrap; }
.ods-price[data-size="sm"]{ font-size:var(--text-price-sm); }
.ods-price[data-size="md"]{ font-size:var(--text-price-md); }
.ods-price[data-size="lg"]{ font-size:var(--text-price-lg); }
.ods-price__unit{ font-size:var(--text-sm); font-weight:var(--fw-medium); color:var(--text-muted); }
.ods-price[data-seasonal="true"]{ font-style:italic; font-weight:var(--fw-semibold); color:var(--text-muted); font-size:var(--text-base); }
`

let injected = false
function usePriceStyles() {
  if (typeof document === 'undefined' || injected) return
  injected = true
  const el = document.createElement('style')
  el.setAttribute('data-ods', 'price')
  el.textContent = CSS
  document.head.appendChild(el)
}

/** grosze (1000) → "10,00 zł" */
export function formatPLN(grosze) {
  return `${(grosze / 100).toFixed(2).replace('.', ',')} zł`
}

export function Price({ value, unit, size = 'md', seasonal = false, className = '', ...rest }) {
  usePriceStyles()
  if (seasonal || value == null) {
    return <span className={`ods-price ${className}`.trim()} data-seasonal="true" {...rest}>Cena sezonowa</span>
  }
  return (
    <span className={`ods-price ${className}`.trim()} data-size={size} {...rest}>
      {formatPLN(value)}
      {unit ? <span className="ods-price__unit">/ {unit}</span> : null}
    </span>
  )
}
