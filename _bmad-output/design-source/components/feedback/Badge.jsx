import React from 'react'

/**
 * od-sąsiada.pl · Badge
 * Small pill for status and stock signals. Soft tonal fills (light bg + dark
 * text) so it reads calm — including order statuses and "mało sztuk".
 */

const CSS = `
.ods-badge{ display:inline-flex; align-items:center; gap:5px; font-family:var(--font-body);
  font-weight:var(--fw-semibold); font-size:var(--text-xs); line-height:1; padding:5px 10px;
  border-radius:var(--radius-pill); white-space:nowrap; }
.ods-badge[data-size="sm"]{ font-size:var(--text-2xs); padding:3px 8px; }
.ods-badge__dot{ width:7px; height:7px; border-radius:999px; background:currentColor; opacity:.9; }
.ods-badge[data-tone="neutral"]{ background:var(--stone-200); color:var(--stone-800); }
.ods-badge[data-tone="brand"]{ background:var(--green-50); color:var(--green-700); }
.ods-badge[data-tone="success"]{ background:var(--state-success-bg); color:var(--green-700); }
.ods-badge[data-tone="warning"]{ background:var(--state-warning-bg); color:var(--amber-700); }
.ods-badge[data-tone="error"]{ background:var(--state-error-bg); color:var(--brick-700); }
.ods-badge[data-tone="accent"]{ background:var(--terracotta-50); color:var(--terracotta-700); }
`

let injected = false
function useBadgeStyles() {
  if (typeof document === 'undefined' || injected) return
  injected = true
  const el = document.createElement('style')
  el.setAttribute('data-ods', 'badge')
  el.textContent = CSS
  document.head.appendChild(el)
}

/** Order status value → label + tone (mirrors ecommerce/order-status.ts). */
export const ORDER_STATUS = {
  new: { label: 'Nowe', tone: 'neutral' },
  confirmed: { label: 'Potwierdzone', tone: 'brand' },
  preparing: { label: 'W przygotowaniu', tone: 'warning' },
  out_for_delivery: { label: 'W dostawie', tone: 'accent' },
  delivered: { label: 'Dostarczone', tone: 'success' },
  cancelled: { label: 'Anulowane', tone: 'error' },
}

export function Badge({ tone = 'neutral', size = 'md', dot = false, className = '', children, ...rest }) {
  useBadgeStyles()
  return (
    <span className={`ods-badge ${className}`.trim()} data-tone={tone} data-size={size} {...rest}>
      {dot ? <span className="ods-badge__dot" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}

/** Convenience: render an order status as a Badge. */
export function StatusBadge({ status, size = 'md' }) {
  const s = ORDER_STATUS[status] || { label: status, tone: 'neutral' }
  return <Badge tone={s.tone} size={size} dot>{s.label}</Badge>
}
