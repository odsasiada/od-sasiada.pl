import React from 'react'

/**
 * od-sąsiada.pl · Button
 * Token-driven, tenant-aware. The `cta` variant reads --accent-cta so it
 * adopts the per-tenant accent automatically (terracotta by default).
 */

const CSS = `
.ods-btn{
  --_bg:var(--brand); --_bgh:var(--brand-strong); --_fg:var(--text-on-brand);
  --_bd:transparent; --_pad:10px 16px; --_fs:var(--text-sm); --_h:44px;
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  font-family:var(--font-body); font-weight:var(--fw-bold); font-size:var(--_fs);
  line-height:1; min-height:var(--_h); padding:var(--_pad);
  color:var(--_fg); background:var(--_bg); border:1.5px solid var(--_bd);
  border-radius:var(--radius-md); cursor:pointer; text-decoration:none;
  transition:background var(--duration-fast) var(--ease-standard),
             transform var(--duration-fast) var(--ease-standard),
             border-color var(--duration-fast) var(--ease-standard);
  white-space:nowrap; user-select:none;
}
.ods-btn:hover:not(:disabled){ background:var(--_bgh); }
.ods-btn:active:not(:disabled){ transform:scale(var(--press-scale)); }
.ods-btn:focus-visible{ outline:none; box-shadow:var(--ring-focus); }
.ods-btn[data-full="true"]{ width:100%; }

.ods-btn[data-size="sm"]{ --_pad:7px 12px; --_fs:var(--text-xs); --_h:36px; }
.ods-btn[data-size="lg"]{ --_pad:14px 22px; --_fs:var(--text-base); --_h:52px; }

.ods-btn[data-variant="cta"]{ --_bg:var(--accent-cta); --_bgh:var(--accent-cta-strong); --_fg:#fff; }
.ods-btn[data-variant="secondary"]{ --_bg:var(--surface-card); --_bgh:var(--stone-100); --_fg:var(--text-body); --_bd:var(--border-hairline); }
.ods-btn[data-variant="secondary"]:hover:not(:disabled){ border-color:var(--border-strong); }
.ods-btn[data-variant="ghost"]{ --_bg:transparent; --_bgh:var(--stone-200); --_fg:var(--text-body); }
.ods-btn[data-variant="danger"]{ --_bg:var(--state-error); --_bgh:var(--brick-700); --_fg:#fff; }
.ods-btn[data-variant="link"]{ --_bg:transparent; --_bgh:transparent; --_fg:var(--brand-strong); --_h:auto; --_pad:0; text-decoration:underline; text-underline-offset:3px; }
.ods-btn[data-variant="link"]:active:not(:disabled){ transform:none; }

.ods-btn:disabled{ cursor:not-allowed; background:var(--surface-sunken); color:var(--text-faint); border-color:transparent; }
`

let injected = false
function useButtonStyles() {
  if (typeof document === 'undefined' || injected) return
  injected = true
  const el = document.createElement('style')
  el.setAttribute('data-ods', 'button')
  el.textContent = CSS
  document.head.appendChild(el)
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  type = 'button',
  as = 'button',
  leadingIcon,
  trailingIcon,
  className = '',
  children,
  ...rest
}) {
  useButtonStyles()
  const Tag = as
  const tagProps = Tag === 'button' ? { type } : {}
  return (
    <Tag
      className={`ods-btn ${className}`.trim()}
      data-variant={variant}
      data-size={size}
      data-full={fullWidth ? 'true' : undefined}
      {...tagProps}
      {...rest}
    >
      {leadingIcon ? <span className="ods-btn__icon" aria-hidden="true" style={{ display: 'inline-flex' }}>{leadingIcon}</span> : null}
      {children}
      {trailingIcon ? <span className="ods-btn__icon" aria-hidden="true" style={{ display: 'inline-flex' }}>{trailingIcon}</span> : null}
    </Tag>
  )
}
