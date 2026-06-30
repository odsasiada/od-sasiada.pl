import React from 'react'

/**
 * od-sąsiada.pl · Field
 * Labelled text input with optional hint and error message. Wraps a native
 * <input> so it works in any form (checkout, account, address). Mobile-first
 * 44px target, soft border, green focus ring.
 */

const CSS = `
.ods-field{ display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
.ods-field__label{ font-size:var(--text-sm); font-weight:var(--fw-semibold); color:var(--text-muted); display:flex; gap:6px; align-items:baseline; }
.ods-field__opt{ font-size:var(--text-xs); font-weight:var(--fw-regular); color:var(--text-faint); }
.ods-field__control{
  font-family:var(--font-body); font-size:var(--text-base); color:var(--text-body);
  min-height:44px; padding:10px 12px;
  background:var(--surface-card); border:1.5px solid var(--border-hairline);
  border-radius:var(--radius-md); box-shadow:var(--shadow-inset);
  transition:border-color var(--duration-fast) var(--ease-standard),
             box-shadow var(--duration-fast) var(--ease-standard);
  width:100%;
}
.ods-field__control::placeholder{ color:var(--text-faint); }
.ods-field__control:hover{ border-color:var(--border-strong); }
.ods-field__control:focus{ outline:none; border-color:var(--border-focus); box-shadow:var(--ring-focus); }
.ods-field__control:disabled{ background:var(--surface-sunken); color:var(--text-faint); cursor:not-allowed; }
.ods-field[data-invalid="true"] .ods-field__control{ border-color:var(--state-error); }
.ods-field[data-invalid="true"] .ods-field__control:focus{ box-shadow:0 0 0 3px hsl(var(--destructive) / 0.25); }
.ods-field__hint{ font-size:var(--text-xs); color:var(--text-faint); }
.ods-field__error{ font-size:var(--text-xs); color:var(--state-error); font-weight:var(--fw-medium); }
`

let injected = false
function useFieldStyles() {
  if (typeof document === 'undefined' || injected) return
  injected = true
  const el = document.createElement('style')
  el.setAttribute('data-ods', 'field')
  el.textContent = CSS
  document.head.appendChild(el)
}

let uid = 0
export function Field({
  label,
  id,
  hint,
  error,
  optional = false,
  className = '',
  ...rest
}) {
  useFieldStyles()
  const autoId = React.useMemo(() => id || `ods-field-${++uid}`, [id])
  const describedBy = error ? `${autoId}-err` : hint ? `${autoId}-hint` : undefined
  return (
    <div className={`ods-field ${className}`.trim()} data-invalid={error ? 'true' : undefined}>
      {label ? (
        <label className="ods-field__label" htmlFor={autoId}>
          {label}
          {optional ? <span className="ods-field__opt">(opcjonalnie)</span> : null}
        </label>
      ) : null}
      <input
        id={autoId}
        className="ods-field__control"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {error ? (
        <span id={`${autoId}-err`} className="ods-field__error">{error}</span>
      ) : hint ? (
        <span id={`${autoId}-hint`} className="ods-field__hint">{hint}</span>
      ) : null}
    </div>
  )
}
