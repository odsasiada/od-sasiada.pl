import React from 'react'

/**
 * od-sąsiada.pl · Alert
 * Inline message block for checkout & account flows. Tonal, soft, never an
 * aggressive alarm. Mirrors the codebase .alert-ok / .alert-error pattern.
 */

const CSS = `
.ods-alert{ display:flex; gap:10px; padding:12px 14px; border-radius:var(--radius-lg);
  font-size:var(--text-sm); line-height:var(--leading-snug); }
.ods-alert__icon{ flex-shrink:0; display:inline-flex; margin-top:1px; }
.ods-alert__body{ display:flex; flex-direction:column; gap:3px; }
.ods-alert__title{ font-weight:var(--fw-bold); }
.ods-alert[data-tone="success"]{ background:var(--state-success-bg); color:var(--green-800); }
.ods-alert[data-tone="warning"]{ background:var(--state-warning-bg); color:var(--amber-700); }
.ods-alert[data-tone="error"]{ background:var(--state-error-bg); color:var(--brick-700); }
.ods-alert[data-tone="info"]{ background:var(--stone-100); color:var(--text-body); border:1px solid var(--border-hairline); }
`

let injected = false
function useAlertStyles() {
  if (typeof document === 'undefined' || injected) return
  injected = true
  const el = document.createElement('style')
  el.setAttribute('data-ods', 'alert')
  el.textContent = CSS
  document.head.appendChild(el)
}

const ICONS = {
  success: 'M20 6 9 17l-5-5',
  warning: 'M12 9v4 M12 17h.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  error: 'M12 9v4 M12 17h.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  info: 'M12 16v-4 M12 8h.01',
}

export function Alert({ tone = 'info', title, icon = true, className = '', children, ...rest }) {
  useAlertStyles()
  return (
    <div className={`ods-alert ${className}`.trim()} data-tone={tone} role="status" {...rest}>
      {icon ? (
        <span className="ods-alert__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {ICONS[tone].split(' M').map((d, i) => <path key={i} d={(i ? 'M' : '') + d} />)}
            {tone === 'info' ? <circle cx="12" cy="12" r="10" /> : null}
          </svg>
        </span>
      ) : null}
      <span className="ods-alert__body">
        {title ? <span className="ods-alert__title">{title}</span> : null}
        {children ? <span>{children}</span> : null}
      </span>
    </div>
  )
}
