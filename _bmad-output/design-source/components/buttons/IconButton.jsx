import React from 'react'

/**
 * od-sąsiada.pl · IconButton
 * Square, icon-only action. Used for cart remove (🗑 → trash), close, etc.
 * Always pass an `aria-label`.
 */

const CSS = `
.ods-iconbtn{
  --_bg:transparent; --_bgh:var(--stone-200); --_fg:var(--text-muted); --_sz:44px; --_bd:transparent;
  display:inline-flex; align-items:center; justify-content:center;
  width:var(--_sz); height:var(--_sz); flex-shrink:0;
  color:var(--_fg); background:var(--_bg); border:1.5px solid var(--_bd);
  border-radius:var(--radius-md); cursor:pointer;
  transition:background var(--duration-fast) var(--ease-standard),
             color var(--duration-fast) var(--ease-standard),
             transform var(--duration-fast) var(--ease-standard);
}
.ods-iconbtn:hover:not(:disabled){ background:var(--_bgh); color:var(--text-body); }
.ods-iconbtn:active:not(:disabled){ transform:scale(var(--press-scale)); }
.ods-iconbtn:focus-visible{ outline:none; box-shadow:var(--ring-focus); }
.ods-iconbtn[data-size="sm"]{ --_sz:36px; }
.ods-iconbtn[data-size="lg"]{ --_sz:52px; }
.ods-iconbtn[data-variant="outline"]{ --_bd:var(--border-hairline); --_bg:var(--surface-card); }
.ods-iconbtn[data-variant="danger"]:hover:not(:disabled){ background:var(--state-error-bg); color:var(--state-error); }
.ods-iconbtn:disabled{ cursor:not-allowed; color:var(--text-faint); background:transparent; }
`

let injected = false
function useIconButtonStyles() {
  if (typeof document === 'undefined' || injected) return
  injected = true
  const el = document.createElement('style')
  el.setAttribute('data-ods', 'iconbutton')
  el.textContent = CSS
  document.head.appendChild(el)
}

export function IconButton({
  variant = 'ghost',
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  useIconButtonStyles()
  return (
    <button
      type={type}
      className={`ods-iconbtn ${className}`.trim()}
      data-variant={variant}
      data-size={size}
      {...rest}
    >
      {children}
    </button>
  )
}
