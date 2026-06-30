import React from 'react'

/**
 * od-sąsiada.pl · Select
 * Labelled native <select> styled to match Field. Used for product variants
 * ("Porcja"), saved addresses, and delivery slots.
 */

const CSS = `
.ods-select{ display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
.ods-select__label{ font-size:var(--text-sm); font-weight:var(--fw-semibold); color:var(--text-muted); }
.ods-select__wrap{ position:relative; display:flex; }
.ods-select__control{
  appearance:none; -webkit-appearance:none;
  font-family:var(--font-body); font-size:var(--text-base); color:var(--text-body);
  min-height:44px; padding:10px 40px 10px 12px; width:100%;
  background:var(--surface-card); border:1.5px solid var(--border-hairline);
  border-radius:var(--radius-md); cursor:pointer;
  transition:border-color var(--duration-fast) var(--ease-standard),
             box-shadow var(--duration-fast) var(--ease-standard);
}
.ods-select__control:hover{ border-color:var(--border-strong); }
.ods-select__control:focus{ outline:none; border-color:var(--border-focus); box-shadow:var(--ring-focus); }
.ods-select__control:disabled{ background:var(--surface-sunken); color:var(--text-faint); cursor:not-allowed; }
.ods-select__chevron{ position:absolute; right:12px; top:50%; transform:translateY(-50%); pointer-events:none; color:var(--text-muted); display:inline-flex; }
`

let injected = false
function useSelectStyles() {
  if (typeof document === 'undefined' || injected) return
  injected = true
  const el = document.createElement('style')
  el.setAttribute('data-ods', 'select')
  el.textContent = CSS
  document.head.appendChild(el)
}

let uid = 0
export function Select({ label, id, className = '', children, ...rest }) {
  useSelectStyles()
  const autoId = React.useMemo(() => id || `ods-select-${++uid}`, [id])
  return (
    <div className={`ods-select ${className}`.trim()}>
      {label ? <label className="ods-select__label" htmlFor={autoId}>{label}</label> : null}
      <div className="ods-select__wrap">
        <select id={autoId} className="ods-select__control" {...rest}>
          {children}
        </select>
        <span className="ods-select__chevron" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </span>
      </div>
    </div>
  )
}
