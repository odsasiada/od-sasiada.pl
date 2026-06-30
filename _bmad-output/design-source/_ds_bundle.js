/* @ds-bundle: {"format":3,"namespace":"OdSSiadaDesignSystem_16cae9","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"IconButton","sourcePath":"components/buttons/IconButton.jsx"},{"name":"Price","sourcePath":"components/commerce/Price.jsx"},{"name":"ProductCard","sourcePath":"components/commerce/ProductCard.jsx"},{"name":"QuantityStepper","sourcePath":"components/commerce/QuantityStepper.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"ORDER_STATUS","sourcePath":"components/feedback/Badge.jsx"},{"name":"Badge","sourcePath":"components/feedback/Badge.jsx"},{"name":"StatusBadge","sourcePath":"components/feedback/Badge.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"ShopHeader","sourcePath":"components/layout/ShopHeader.jsx"}],"sourceHashes":{"components/buttons/Button.jsx":"6e94e416c4bb","components/buttons/IconButton.jsx":"8f8361d4c03d","components/commerce/Price.jsx":"7750be142ad4","components/commerce/ProductCard.jsx":"43453deb8b3d","components/commerce/QuantityStepper.jsx":"4fb6a3b3c558","components/feedback/Alert.jsx":"f51caed34619","components/feedback/Badge.jsx":"de7b163303a8","components/forms/Field.jsx":"93b65f28b5fe","components/forms/Select.jsx":"8ca0269ecdc3","components/layout/ShopHeader.jsx":"1fd5a2f31f4d","ui_kits/shop/AccountScreen.jsx":"40ce62c13a21","ui_kits/shop/App.jsx":"a9192f4fa6a7","ui_kits/shop/CartScreen.jsx":"57a9827297c4","ui_kits/shop/CatalogScreen.jsx":"7bc0d63bdd3b","ui_kits/shop/OrdersScreen.jsx":"dea564e9fe76","ui_kits/shop/data.js":"5c6609707976"},"inlinedExternals":[],"unexposedExports":[{"name":"formatPLN","sourcePath":"components/commerce/Price.jsx"}]} */

(() => {

const __ds_ns = (window.OdSSiadaDesignSystem_16cae9 = window.OdSSiadaDesignSystem_16cae9 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
`;
let injected = false;
function useButtonStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-ods', 'button');
  el.textContent = CSS;
  document.head.appendChild(el);
}
function Button({
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
  useButtonStyles();
  const Tag = as;
  const tagProps = Tag === 'button' ? {
    type
  } : {};
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: `ods-btn ${className}`.trim(),
    "data-variant": variant,
    "data-size": size,
    "data-full": fullWidth ? 'true' : undefined
  }, tagProps, rest), leadingIcon ? /*#__PURE__*/React.createElement("span", {
    className: "ods-btn__icon",
    "aria-hidden": "true",
    style: {
      display: 'inline-flex'
    }
  }, leadingIcon) : null, children, trailingIcon ? /*#__PURE__*/React.createElement("span", {
    className: "ods-btn__icon",
    "aria-hidden": "true",
    style: {
      display: 'inline-flex'
    }
  }, trailingIcon) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/buttons/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
`;
let injected = false;
function useIconButtonStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-ods', 'iconbutton');
  el.textContent = CSS;
  document.head.appendChild(el);
}
function IconButton({
  variant = 'ghost',
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  useIconButtonStyles();
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    className: `ods-iconbtn ${className}`.trim(),
    "data-variant": variant,
    "data-size": size
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/commerce/Price.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
`;
let injected = false;
function usePriceStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-ods', 'price');
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** grosze (1000) → "10,00 zł" */
function formatPLN(grosze) {
  return `${(grosze / 100).toFixed(2).replace('.', ',')}\u00a0zł`;
}
function Price({
  value,
  unit,
  size = 'md',
  seasonal = false,
  className = '',
  ...rest
}) {
  usePriceStyles();
  if (seasonal || value == null) {
    return /*#__PURE__*/React.createElement("span", _extends({
      className: `ods-price ${className}`.trim(),
      "data-seasonal": "true"
    }, rest), "Cena sezonowa");
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `ods-price ${className}`.trim(),
    "data-size": size
  }, rest), formatPLN(value), unit ? /*#__PURE__*/React.createElement("span", {
    className: "ods-price__unit"
  }, "/ ", unit) : null);
}
Object.assign(__ds_scope, { formatPLN, Price });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/Price.jsx", error: String((e && e.message) || e) }); }

// components/commerce/QuantityStepper.jsx
try { (() => {
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
`;
let injected = false;
function useQtyStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-ods', 'qty');
  el.textContent = CSS;
  document.head.appendChild(el);
}
function QuantityStepper({
  value,
  onChange = () => {},
  min = 1,
  max = 99,
  size = 'md',
  className = ''
}) {
  useQtyStyles();
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return /*#__PURE__*/React.createElement("div", {
    className: `ods-qty ${className}`.trim(),
    "data-size": size
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ods-qty__btn",
    onClick: dec,
    disabled: value <= min,
    "aria-label": "Mniej"
  }, "\u2212"), /*#__PURE__*/React.createElement("span", {
    className: "ods-qty__val",
    "aria-live": "polite"
  }, value), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ods-qty__btn",
    onClick: inc,
    disabled: value >= max,
    "aria-label": "Wi\u0119cej"
  }, "+"));
}
Object.assign(__ds_scope, { QuantityStepper });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/QuantityStepper.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
`;
let injected = false;
function useAlertStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-ods', 'alert');
  el.textContent = CSS;
  document.head.appendChild(el);
}
const ICONS = {
  success: 'M20 6 9 17l-5-5',
  warning: 'M12 9v4 M12 17h.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  error: 'M12 9v4 M12 17h.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  info: 'M12 16v-4 M12 8h.01'
};
function Alert({
  tone = 'info',
  title,
  icon = true,
  className = '',
  children,
  ...rest
}) {
  useAlertStyles();
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `ods-alert ${className}`.trim(),
    "data-tone": tone,
    role: "status"
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    className: "ods-alert__icon",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, ICONS[tone].split(' M').map((d, i) => /*#__PURE__*/React.createElement("path", {
    key: i,
    d: (i ? 'M' : '') + d
  })), tone === 'info' ? /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }) : null)) : null, /*#__PURE__*/React.createElement("span", {
    className: "ods-alert__body"
  }, title ? /*#__PURE__*/React.createElement("span", {
    className: "ods-alert__title"
  }, title) : null, children ? /*#__PURE__*/React.createElement("span", null, children) : null));
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
`;
let injected = false;
function useBadgeStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-ods', 'badge');
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Order status value → label + tone (mirrors ecommerce/order-status.ts). */
const ORDER_STATUS = {
  new: {
    label: 'Nowe',
    tone: 'neutral'
  },
  confirmed: {
    label: 'Potwierdzone',
    tone: 'brand'
  },
  preparing: {
    label: 'W przygotowaniu',
    tone: 'warning'
  },
  out_for_delivery: {
    label: 'W dostawie',
    tone: 'accent'
  },
  delivered: {
    label: 'Dostarczone',
    tone: 'success'
  },
  cancelled: {
    label: 'Anulowane',
    tone: 'error'
  }
};
function Badge({
  tone = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  children,
  ...rest
}) {
  useBadgeStyles();
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `ods-badge ${className}`.trim(),
    "data-tone": tone,
    "data-size": size
  }, rest), dot ? /*#__PURE__*/React.createElement("span", {
    className: "ods-badge__dot",
    "aria-hidden": "true"
  }) : null, children);
}

/** Convenience: render an order status as a Badge. */
function StatusBadge({
  status,
  size = 'md'
}) {
  const s = ORDER_STATUS[status] || {
    label: status,
    tone: 'neutral'
  };
  return /*#__PURE__*/React.createElement(Badge, {
    tone: s.tone,
    size: size,
    dot: true
  }, s.label);
}
Object.assign(__ds_scope, { ORDER_STATUS, Badge, StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Badge.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
`;
let injected = false;
function useFieldStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-ods', 'field');
  el.textContent = CSS;
  document.head.appendChild(el);
}
let uid = 0;
function Field({
  label,
  id,
  hint,
  error,
  optional = false,
  className = '',
  ...rest
}) {
  useFieldStyles();
  const autoId = React.useMemo(() => id || `ods-field-${++uid}`, [id]);
  const describedBy = error ? `${autoId}-err` : hint ? `${autoId}-hint` : undefined;
  return /*#__PURE__*/React.createElement("div", {
    className: `ods-field ${className}`.trim(),
    "data-invalid": error ? 'true' : undefined
  }, label ? /*#__PURE__*/React.createElement("label", {
    className: "ods-field__label",
    htmlFor: autoId
  }, label, optional ? /*#__PURE__*/React.createElement("span", {
    className: "ods-field__opt"
  }, "(opcjonalnie)") : null) : null, /*#__PURE__*/React.createElement("input", _extends({
    id: autoId,
    className: "ods-field__control",
    "aria-invalid": error ? 'true' : undefined,
    "aria-describedby": describedBy
  }, rest)), error ? /*#__PURE__*/React.createElement("span", {
    id: `${autoId}-err`,
    className: "ods-field__error"
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    id: `${autoId}-hint`,
    className: "ods-field__hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
`;
let injected = false;
function useSelectStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-ods', 'select');
  el.textContent = CSS;
  document.head.appendChild(el);
}
let uid = 0;
function Select({
  label,
  id,
  className = '',
  children,
  ...rest
}) {
  useSelectStyles();
  const autoId = React.useMemo(() => id || `ods-select-${++uid}`, [id]);
  return /*#__PURE__*/React.createElement("div", {
    className: `ods-select ${className}`.trim()
  }, label ? /*#__PURE__*/React.createElement("label", {
    className: "ods-select__label",
    htmlFor: autoId
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    className: "ods-select__wrap"
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: autoId,
    className: "ods-select__control"
  }, rest), children), /*#__PURE__*/React.createElement("span", {
    className: "ods-select__chevron",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6 6 6-6"
  })))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/commerce/ProductCard.jsx
try { (() => {
/**
 * od-sąsiada.pl · ProductCard
 * Editorial, minimal catalog unit. When there's no photo (the common case) the
 * tile becomes a typographic poster: a soft warm category tint with the product
 * name set large — intentional, not a "missing image". A quiet seller line
 * carries the trust signal; the circular terracotta button is the add CTA and
 * adopts the per-tenant accent inside [data-tenant].
 */

const TINTS = {
  honey: 'var(--tint-honey)',
  leaf: 'var(--tint-leaf)',
  pickle: 'var(--tint-pickle)',
  bee: 'var(--tint-bee)',
  stone: 'var(--tint-stone)'
};
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
`;
let injected = false;
function usePcStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-ods', 'productcard');
  el.textContent = CSS;
  document.head.appendChild(el);
}
function ProductCard({
  title,
  description,
  price,
  unit,
  seller,
  image,
  imageAlt = '',
  category,
  tone = 'stone',
  seasonal = false,
  lowStock = null,
  variants,
  variantValue,
  onVariantChange,
  onAdd = () => {},
  added = false,
  className = ''
}) {
  usePcStyles();
  const tint = TINTS[tone] || TINTS.stone;
  const initial = seller ? seller.trim().charAt(0).toUpperCase() : '🌱';
  return /*#__PURE__*/React.createElement("div", {
    className: `ods-pc ${className}`.trim()
  }, /*#__PURE__*/React.createElement("div", {
    className: "ods-pc__tile",
    style: {
      background: image ? 'var(--stone-200)' : tint
    }
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: imageAlt
  }) : null, category ? /*#__PURE__*/React.createElement("span", {
    className: "ods-pc__cat"
  }, category) : null, lowStock != null ? /*#__PURE__*/React.createElement("span", {
    className: "ods-pc__stock"
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "warning",
    size: "sm"
  }, "Zosta\u0142o ", lowStock)) : seasonal ? /*#__PURE__*/React.createElement("span", {
    className: "ods-pc__stock"
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "accent",
    size: "sm"
  }, "Sezonowe")) : null, !image ? /*#__PURE__*/React.createElement("span", {
    className: "ods-pc__name"
  }, title) : null), image ? /*#__PURE__*/React.createElement("h3", {
    className: "ods-pc__name",
    style: {
      fontSize: 'var(--text-lg)'
    }
  }, title) : null, seller ? /*#__PURE__*/React.createElement("span", {
    className: "ods-pc__seller"
  }, /*#__PURE__*/React.createElement("b", {
    "aria-hidden": "true"
  }, initial), seller) : null, variants && variants.length ? /*#__PURE__*/React.createElement(__ds_scope.Select, {
    value: variantValue,
    onChange: onVariantChange,
    style: {
      marginBottom: 0
    },
    "aria-label": `Wariant — ${title}`
  }, variants.map(v => /*#__PURE__*/React.createElement("option", {
    key: v.value,
    value: v.value
  }, v.label))) : null, /*#__PURE__*/React.createElement("div", {
    className: "ods-pc__foot"
  }, seasonal ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(__ds_scope.Price, {
    seasonal: true
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ods-pc__ask",
    onClick: onAdd
  }, "Zapytaj o cen\u0119 \u2192")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(__ds_scope.Price, {
    value: price,
    unit: unit,
    size: "lg"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ods-pc__add",
    "data-added": added ? 'true' : undefined,
    onClick: onAdd,
    "aria-label": `Dodaj ${title} do koszyka`
  }, added ? /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 6 9 17l-5-5"
  })) : /*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "22",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14"
  }))))));
}
Object.assign(__ds_scope, { ProductCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/ProductCard.jsx", error: String((e && e.message) || e) }); }

// components/layout/ShopHeader.jsx
try { (() => {
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
`;
let injected = false;
function useHeaderStyles() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-ods', 'header');
  el.textContent = CSS;
  document.head.appendChild(el);
}
const Mark = () => /*#__PURE__*/React.createElement("svg", {
  width: "34",
  height: "34",
  viewBox: "0 0 56 56",
  "aria-hidden": "true",
  style: {
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement("circle", {
  cx: "28",
  cy: "28",
  r: "28",
  fill: "var(--brand)"
}), /*#__PURE__*/React.createElement("path", {
  d: "M28 45c0-7-1.5-11.5-5.5-15",
  stroke: "#fff",
  strokeWidth: "2.6",
  strokeLinecap: "round"
}), /*#__PURE__*/React.createElement("path", {
  d: "M28 33c-9 0-14.5-5-13.5-13C23 19 28 25 28 33Z",
  fill: "#fff"
}), /*#__PURE__*/React.createElement("path", {
  d: "M29 30c0-8 4.5-13.5 13-13.5C42.5 25 37 30 29 30Z",
  fill: "#cfe6d4"
}));
function ShopHeader({
  tenantName = 'Świeże z Kaszub',
  customerName = null,
  cartCount = 0,
  cartTotal = 0,
  onCart = () => {},
  onAccount = () => {},
  className = ''
}) {
  useHeaderStyles();
  return /*#__PURE__*/React.createElement("header", {
    className: `ods-hd ${className}`.trim()
  }, /*#__PURE__*/React.createElement("a", {
    className: "ods-hd__brand",
    onClick: onAccount
  }, /*#__PURE__*/React.createElement(Mark, null), /*#__PURE__*/React.createElement("span", {
    className: "ods-hd__names"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ods-hd__eyebrow"
  }, "od-s\u0105siada.pl"), /*#__PURE__*/React.createElement("span", {
    className: "ods-hd__shop"
  }, tenantName))), /*#__PURE__*/React.createElement("nav", {
    className: "ods-hd__nav"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ods-hd__link",
    onClick: onAccount
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "8",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5.5 21a8.38 8.38 0 0 1 13 0"
  })), /*#__PURE__*/React.createElement("span", {
    className: "ods-hd__hideSm"
  }, customerName || 'Zaloguj się')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ods-hd__link ods-hd__cart",
    onClick: onCart
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "20",
    r: "1.4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "20",
    r: "1.4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 2h2.2l2.3 13a1.6 1.6 0 0 0 1.6 1.3h8.7a1.6 1.6 0 0 0 1.6-1.3L21 6H5.3"
  })), /*#__PURE__*/React.createElement("span", {
    className: "ods-hd__hideSm"
  }, "Koszyk"), cartCount > 0 ? /*#__PURE__*/React.createElement("span", {
    className: "ods-hd__count"
  }, cartCount, " \xB7 ", __ds_scope.formatPLN(cartTotal)) : null)));
}
Object.assign(__ds_scope, { ShopHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/ShopHeader.jsx", error: String((e && e.message) || e) }); }

// ui_kits/shop/AccountScreen.jsx
try { (() => {
// od-sąsiada.pl · Account — login / register / forgot, all on Ty.
const {
  Field,
  Button,
  Alert
} = window.OdSSiadaDesignSystem_16cae9;
function AccountScreen({
  onLogin,
  onBack
}) {
  const [mode, setMode] = React.useState('login');
  const [form, setForm] = React.useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: 'krystyna@example.com',
    password: 'sasiedzi'
  });
  const [info, setInfo] = React.useState(null);
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.value
  }));
  const submit = e => {
    e.preventDefault();
    if (mode === 'forgot') {
      setInfo('Jeśli konto istnieje, wysłaliśmy e-mail z linkiem do zmiany hasła.');
      return;
    }
    onLogin(form.firstName || 'Krystyna');
  };
  const Tab = ({
    id,
    children
  }) => /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      setMode(id);
      setInfo(null);
    },
    style: {
      flex: 1,
      padding: 10,
      fontWeight: 700,
      fontSize: 'var(--text-sm)',
      cursor: 'pointer',
      borderRadius: 'var(--radius-md)',
      border: '1.5px solid ' + (mode === id ? 'var(--brand)' : 'var(--border-hairline)'),
      background: mode === id ? 'var(--brand)' : 'var(--surface-page)',
      color: mode === id ? '#fff' : 'var(--text-muted)'
    }
  }, children);
  return /*#__PURE__*/React.createElement("main", {
    style: {
      maxWidth: 420,
      margin: '0 auto',
      padding: '40px 24px 64px'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    onClick: onBack
  }, "\u2190 Wr\xF3\u0107 do katalogu"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--text-xl)',
      letterSpacing: 'var(--tracking-tight)',
      margin: '14px 0 18px'
    }
  }, "Mi\u0142o Ci\u0119 widzie\u0107"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-xl)',
      padding: 22,
      boxShadow: 'var(--shadow-sm)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 18px',
      color: 'var(--text-muted)',
      fontSize: 'var(--text-sm)'
    }
  }, "Zaloguj si\u0119, \u017Ceby zam\xF3wi\u0107 u s\u0105siada i \u015Bledzi\u0107 swoje zam\xF3wienia."), mode !== 'forgot' ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Tab, {
    id: "login"
  }, "Logowanie"), /*#__PURE__*/React.createElement(Tab, {
    id: "register"
  }, "Za\u0142\xF3\u017C konto")) : null, info ? /*#__PURE__*/React.createElement(Alert, {
    tone: "success"
  }, info) : null, /*#__PURE__*/React.createElement("form", {
    onSubmit: submit
  }, mode === 'register' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Field, {
    label: "Imi\u0119",
    value: form.firstName,
    onChange: set('firstName'),
    required: true
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Nazwisko",
    value: form.lastName,
    onChange: set('lastName'),
    required: true
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Telefon",
    type: "tel",
    value: form.phone,
    onChange: set('phone'),
    required: true
  })) : null, /*#__PURE__*/React.createElement(Field, {
    label: "E-mail",
    type: "email",
    value: form.email,
    onChange: set('email'),
    required: true
  }), mode !== 'forgot' ? /*#__PURE__*/React.createElement(Field, {
    label: "Has\u0142o",
    type: "password",
    value: form.password,
    onChange: set('password'),
    required: true
  }) : null, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    fullWidth: true,
    type: "submit"
  }, mode === 'login' ? 'Zaloguj się' : mode === 'register' ? 'Załóż konto' : 'Wyślij link')), mode === 'login' ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "link",
    onClick: () => setMode('forgot')
  }, "Nie pami\u0119tasz has\u0142a?")) : null, mode === 'forgot' ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "link",
    onClick: () => setMode('login')
  }, "\u2190 Wr\xF3\u0107 do logowania")) : null));
}
window.AccountScreen = AccountScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/shop/AccountScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/shop/App.jsx
try { (() => {
// od-sąsiada.pl · UI-kit app shell — routes between catalog, cart, orders, account.
const {
  ShopHeader
} = window.OdSSiadaDesignSystem_16cae9;
function App() {
  const data = window.SHOP_DATA;
  const [route, setRoute] = React.useState('catalog');
  const [cart, setCart] = React.useState([]);
  const [customer, setCustomer] = React.useState(null); // name or null
  const [orders, setOrders] = React.useState(data.orders);
  const [pendingCheckout, setPendingCheckout] = React.useState(false);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const addToCart = item => setCart(c => {
    const ex = c.find(x => x.id === item.id);
    if (ex) return c.map(x => x.id === item.id ? {
      ...x,
      qty: x.qty + 1
    } : x);
    return [...c, {
      ...item,
      qty: 1
    }];
  });
  const setQty = (id, n) => setCart(c => n <= 0 ? c.filter(x => x.id !== id) : c.map(x => x.id === id ? {
    ...x,
    qty: n
  } : x));
  const removeItem = id => setCart(c => c.filter(x => x.id !== id));
  const login = name => {
    setCustomer(name);
    setRoute(pendingCheckout ? 'cart' : 'orders');
    setPendingCheckout(false);
  };
  const requireLogin = () => {
    setPendingCheckout(true);
    setRoute('account');
  };
  const onPlaced = ({
    number,
    total,
    items
  }) => {
    setOrders(o => [{
      number,
      status: 'new',
      date: 'przed chwilą',
      amount: total,
      items: items.map(i => ({
        q: i.qty,
        name: i.title,
        price: i.price
      }))
    }, ...o]);
    setCart([]);
  };
  const reorder = order => {
    setCart(order.items.map((it, idx) => ({
      id: 'reorder-' + order.number + '-' + idx,
      title: it.name,
      price: it.price,
      qty: it.q,
      variantLabel: null
    })));
    setRoute('cart');
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100%',
      background: 'var(--surface-page)'
    }
  }, /*#__PURE__*/React.createElement(ShopHeader, {
    tenantName: data.tenant.name,
    customerName: customer,
    cartCount: cartCount,
    cartTotal: cartTotal,
    onCart: () => setRoute('cart'),
    onAccount: () => setRoute(customer ? 'orders' : 'account')
  }), route === 'catalog' ? /*#__PURE__*/React.createElement(window.CatalogScreen, {
    data: data,
    onAdd: addToCart
  }) : null, route === 'cart' ? /*#__PURE__*/React.createElement(window.CartScreen, {
    items: cart,
    setQty: setQty,
    removeItem: removeItem,
    tenant: data.tenant,
    loggedIn: !!customer,
    onRequireLogin: requireLogin,
    onPlaced: onPlaced,
    onBack: () => setRoute('catalog')
  }) : null, route === 'orders' ? /*#__PURE__*/React.createElement(window.OrdersScreen, {
    orders: orders,
    customerName: customer || 'Gość',
    onReorder: reorder,
    onBack: () => setRoute('catalog')
  }) : null, route === 'account' ? /*#__PURE__*/React.createElement(window.AccountScreen, {
    onLogin: login,
    onBack: () => setRoute('catalog')
  }) : null);
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/shop/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/shop/CartScreen.jsx
try { (() => {
// od-sąsiada.pl · Cart + cash-on-delivery checkout. Minimum friction.
const {
  Field,
  Select,
  Button,
  Alert,
  QuantityStepper,
  Price
} = window.OdSSiadaDesignSystem_16cae9;
const formatPLN = g => `${(g / 100).toFixed(2).replace('.', ',')}\u00a0zł`;
function CartScreen({
  items,
  setQty,
  removeItem,
  tenant,
  loggedIn,
  onRequireLogin,
  onPlaced,
  onBack
}) {
  const [contact, setContact] = React.useState({
    firstName: 'Krystyna',
    lastName: 'Nowak',
    phone: '601 234 567',
    addr: '',
    code: '',
    city: 'Kościerzyna',
    email: ''
  });
  const [slot, setSlot] = React.useState('');
  const [placed, setPlaced] = React.useState(null);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const belowMin = total < tenant.minOrderValue;
  const set = k => e => setContact(c => ({
    ...c,
    [k]: e.target.value
  }));
  if (placed) {
    return /*#__PURE__*/React.createElement("main", {
      style: {
        maxWidth: 560,
        margin: '0 auto',
        padding: '56px 24px 64px'
      }
    }, /*#__PURE__*/React.createElement(Alert, {
      tone: "success",
      title: `Dziękujemy! Zamówienie ${placed} przyjęte.`
    }, "Zadzwonimy, \u017Ceby potwierdzi\u0107 dostaw\u0119. P\u0142acisz got\xF3wk\u0105 przy odbiorze \u2014 bez \u017Cadnych zaliczek."), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 16
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: onBack
    }, "\u2190 Wr\xF3\u0107 do katalogu")));
  }
  const place = () => {
    if (!loggedIn) {
      onRequireLogin();
      return;
    }
    const num = '2024-' + Math.floor(120 + Math.random() * 80);
    setPlaced(num);
    onPlaced({
      number: num,
      total,
      items
    });
  };
  return /*#__PURE__*/React.createElement("main", {
    style: {
      maxWidth: 560,
      margin: '0 auto',
      padding: '40px 24px 64px'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    onClick: onBack,
    className: "cart-back"
  }, "\u2190 Wr\xF3\u0107 do katalogu"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--text-2xl)',
      letterSpacing: 'var(--tracking-tight)',
      margin: '14px 0 20px'
    }
  }, "Tw\xF3j koszyk"), items.length === 0 ? /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)'
    }
  }, "Koszyk jest pusty. Zajrzyj do katalogu s\u0105siada.") : /*#__PURE__*/React.createElement(React.Fragment, null, items.map(i => /*#__PURE__*/React.createElement("div", {
    key: i.id,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '14px 0',
      borderBottom: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      lineHeight: 1.2
    }
  }, i.title), i.variantLabel ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, i.variantLabel) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-faint)'
    }
  }, formatPLN(i.price), " / szt.")), /*#__PURE__*/React.createElement(QuantityStepper, {
    value: i.qty,
    onChange: n => setQty(i.id, n),
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      minWidth: 96,
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFeatureSettings: 'var(--price-feature)'
    }
  }, formatPLN(i.price * i.qty)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => removeItem(i.id),
    "aria-label": "Usu\u0144",
    style: {
      border: 0,
      background: 'transparent',
      color: 'var(--text-faint)',
      cursor: 'pointer',
      display: 'inline-flex',
      padding: 4
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 6h18"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      margin: '18px 0'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-lg)',
      fontWeight: 700
    }
  }, "Razem"), /*#__PURE__*/React.createElement(Price, {
    value: total,
    size: "lg"
  })), belowMin ? /*#__PURE__*/React.createElement(Alert, {
    tone: "error"
  }, "Minimalna warto\u015B\u0107 zam\xF3wienia to ", formatPLN(tenant.minOrderValue), ". Dorzu\u0107 jeszcze za ", formatPLN(tenant.minOrderValue - total), ".") : null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'var(--text-lg)',
      margin: '22px 0 12px'
    }
  }, "Dane do dostawy"), !loggedIn ? /*#__PURE__*/React.createElement(Alert, {
    tone: "info",
    title: "Zaloguj si\u0119, aby z\u0142o\u017Cy\u0107 zam\xF3wienie.",
    icon: false
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    onClick: onRequireLogin
  }, "Zaloguj si\u0119 i wr\xF3\u0107 do koszyka"))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Select, {
    label: "Termin dostawy",
    value: slot,
    onChange: e => setSlot(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 wybierz termin \u2014"), /*#__PURE__*/React.createElement("option", null, "Pi\u0105tek 27.06, 16:00\u201318:00"), /*#__PURE__*/React.createElement("option", null, "Pi\u0105tek 27.06, 18:00\u201320:00")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0 16px'
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Imi\u0119",
    value: contact.firstName,
    onChange: set('firstName'),
    required: true
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Nazwisko",
    value: contact.lastName,
    onChange: set('lastName'),
    required: true
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Telefon",
    type: "tel",
    value: contact.phone,
    onChange: set('phone'),
    required: true
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Ulica i numer",
    value: contact.addr,
    onChange: set('addr'),
    required: true
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Kod pocztowy",
    value: contact.code,
    onChange: set('code'),
    required: true
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Miejscowo\u015B\u0107",
    value: contact.city,
    onChange: set('city'),
    required: true
  })), /*#__PURE__*/React.createElement(Field, {
    label: "E-mail",
    type: "email",
    value: contact.email,
    onChange: set('email'),
    optional: true,
    hint: "Wy\u015Blemy potwierdzenie zam\xF3wienia."
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "cta",
    size: "lg",
    fullWidth: true,
    disabled: belowMin || !slot,
    onClick: place
  }, "Zamawiam \u2014 p\u0142atno\u015B\u0107 got\xF3wk\u0105 przy odbiorze"))));
}
window.CartScreen = CartScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/shop/CartScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/shop/CatalogScreen.jsx
try { (() => {
// od-sąsiada.pl · Catalog screen — editorial, minimal seller home.
const {
  ProductCard
} = window.OdSSiadaDesignSystem_16cae9;
const TONE_BY_CAT = {
  'Miody': 'honey',
  'Warzywa': 'leaf',
  'Kiszonki': 'pickle',
  'Od pszczół': 'bee'
};
function CategoryNav({
  cats,
  active,
  onPick
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      flexWrap: 'wrap',
      borderBottom: '1px solid var(--border-hairline)',
      marginBottom: 32
    }
  }, cats.map(c => {
    const on = c === active;
    return /*#__PURE__*/React.createElement("button", {
      key: c,
      type: "button",
      onClick: () => onPick(c),
      style: {
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: 'var(--text-sm)',
        padding: '0 0 12px',
        background: 'none',
        border: 0,
        cursor: 'pointer',
        color: on ? 'var(--text-body)' : 'var(--text-faint)',
        borderBottom: '2px solid ' + (on ? 'var(--brand)' : 'transparent'),
        marginBottom: -1,
        transition: 'color var(--duration-fast) var(--ease-standard)'
      }
    }, c);
  }));
}
function Hero({
  tenant
}) {
  const meta = [`Min. ${(tenant.minOrderValue / 100).toFixed(2).replace('.', ',')} zł`, 'Dostawa w piątki', 'Płatność gotówką', `tel. ${tenant.contactPhone}`];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      maxWidth: 680,
      margin: '0 0 44px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 'var(--text-xs)',
      fontWeight: 700,
      letterSpacing: 'var(--tracking-caps)',
      textTransform: 'uppercase',
      color: 'var(--brand)',
      marginBottom: 16,
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: 'var(--brand)'
    }
  }), "Prosto od s\u0105siada"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--text-2xl)',
      lineHeight: 1.02,
      letterSpacing: 'var(--tracking-tight)',
      margin: '0 0 14px'
    }
  }, tenant.name), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-md)',
      color: 'var(--text-muted)',
      margin: '0 0 20px',
      maxWidth: 540,
      lineHeight: 1.5
    }
  }, "Mi\xF3d, jaja i domowe kiszonki prosto od ludzi z Twojej okolicy. Zamawiasz online, p\u0142acisz got\xF3wk\u0105 przy odbiorze."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px 0',
      alignItems: 'center',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, meta.map((m, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: m
  }, i > 0 ? /*#__PURE__*/React.createElement("span", {
    style: {
      margin: '0 12px',
      width: 3,
      height: 3,
      borderRadius: 999,
      background: 'var(--stone-400)',
      display: 'inline-block'
    }
  }) : null, /*#__PURE__*/React.createElement("span", null, m)))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-xs)',
      fontStyle: 'italic',
      color: 'var(--text-faint)',
      margin: '14px 0 0',
      maxWidth: 540
    }
  }, tenant.priceNotice));
}
function CatalogScreen({
  data,
  onAdd
}) {
  const [cat, setCat] = React.useState('Wszystko');
  const [variants, setVariants] = React.useState({});
  const [addedId, setAddedId] = React.useState(null);
  const products = cat === 'Wszystko' ? data.products : data.products.filter(p => p.cat === cat);
  const add = p => {
    if (p.seasonal) return;
    const vv = variants[p.id] ?? (p.variants ? p.variants[0].value : undefined);
    const v = p.variants && p.variants.find(x => x.value === vv);
    onAdd({
      id: p.id + (vv ? ':' + vv : ''),
      title: p.title,
      variantLabel: v ? v.label.split(' — ')[0] : null,
      price: v ? v.price : p.price
    });
    setAddedId(p.id);
    setTimeout(() => setAddedId(c => c === p.id ? null : c), 1100);
  };
  return /*#__PURE__*/React.createElement("main", {
    style: {
      maxWidth: 1040,
      margin: '0 auto',
      padding: '40px 24px 64px'
    }
  }, /*#__PURE__*/React.createElement(Hero, {
    tenant: data.tenant
  }), /*#__PURE__*/React.createElement(CategoryNav, {
    cats: data.categories,
    active: cat,
    onPick: setCat
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(232px, 1fr))',
      gap: '36px 24px'
    }
  }, products.map(p => {
    const vv = variants[p.id] ?? (p.variants ? p.variants[0].value : undefined);
    const selV = p.variants && p.variants.find(x => x.value === vv);
    const shownPrice = p.variants ? selV ? selV.price : null : p.price;
    return /*#__PURE__*/React.createElement(ProductCard, {
      key: p.id,
      title: p.title,
      category: p.cat,
      tone: TONE_BY_CAT[p.cat] || 'stone',
      price: shownPrice,
      unit: p.unit,
      seller: "\u015Awie\u017Ce z Kaszub",
      seasonal: p.seasonal,
      lowStock: p.lowStock ?? null,
      variants: p.variants,
      variantValue: vv,
      onVariantChange: e => setVariants(s => ({
        ...s,
        [p.id]: e.target.value
      })),
      added: addedId === p.id,
      onAdd: () => add(p)
    });
  })));
}
window.CatalogScreen = CatalogScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/shop/CatalogScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/shop/OrdersScreen.jsx
try { (() => {
// od-sąsiada.pl · My orders — status + reorder.
const {
  StatusBadge,
  Button
} = window.OdSSiadaDesignSystem_16cae9;
const formatPLN = g => `${(g / 100).toFixed(2).replace('.', ',')}\u00a0zł`;
function OrderCard({
  order,
  onReorder
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-xl)',
      padding: 22,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-lg)',
      whiteSpace: 'nowrap'
    }
  }, order.number), /*#__PURE__*/React.createElement(StatusBadge, {
    status: order.status
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)',
      marginTop: 6
    }
  }, order.date), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      padding: 0,
      margin: '12px 0'
    }
  }, order.items.map((it, idx) => /*#__PURE__*/React.createElement("li", {
    key: idx,
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-body)',
      padding: '3px 0'
    }
  }, it.q, " \xD7 ", it.name, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, "\u2014 ", formatPLN(it.price * it.q))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFeatureSettings: 'var(--price-feature)'
    }
  }, "Razem: ", formatPLN(order.amount)), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    onClick: () => onReorder(order),
    leadingIcon: /*#__PURE__*/React.createElement("svg", {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.4 2.6L3 8"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M3 3v5h5"
    }))
  }, "Zam\xF3w ponownie")));
}
function OrdersScreen({
  orders,
  customerName,
  onReorder,
  onBack
}) {
  return /*#__PURE__*/React.createElement("main", {
    style: {
      maxWidth: 560,
      margin: '0 auto',
      padding: '40px 24px 64px'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    onClick: onBack
  }, "\u2190 Wr\xF3\u0107 do katalogu"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--text-2xl)',
      letterSpacing: 'var(--tracking-tight)',
      margin: '14px 0 4px'
    }
  }, "Moje zam\xF3wienia"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)',
      marginTop: 0
    }
  }, "Zalogowany jako ", customerName), orders.length === 0 ? /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)'
    }
  }, "Nie masz jeszcze \u017Cadnych zam\xF3wie\u0144.") : orders.map(o => /*#__PURE__*/React.createElement(OrderCard, {
    key: o.number,
    order: o,
    onReorder: onReorder
  })));
}
window.OrdersScreen = OrdersScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/shop/OrdersScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/shop/data.js
try { (() => {
/* od-sąsiada.pl · UI-kit sample data (from the repo seed — Świeże z Kaszub).
   Prices in grosze (4000 = 40,00 zł). */
window.SHOP_DATA = {
  tenant: {
    name: 'Świeże z Kaszub',
    slug: 'swieze-z-kaszub',
    contactPhone: '791 647 500',
    minOrderValue: 3000,
    priceNotice: 'Ceny mogą ulec zmianie. W razie pytań napisz SMS — podeślę aktualny cennik.'
  },
  categories: ['Wszystko', 'Miody', 'Warzywa', 'Kiszonki', 'Od pszczół'],
  products: [{
    id: 1,
    title: 'Miód rzepakowy',
    cat: 'Miody',
    price: 4000,
    unit: '1 L',
    desc: 'Jasny, łagodny, szybko się krystalizuje.'
  }, {
    id: 2,
    title: 'Miód wielokwiatowy',
    cat: 'Miody',
    price: 4200,
    unit: '1 L',
    desc: 'Z łąk wokół gospodarstwa.'
  }, {
    id: 3,
    title: 'Miód gryczany',
    cat: 'Miody',
    price: 4400,
    unit: '1 L',
    desc: 'Ciemny, mocny w smaku.'
  }, {
    id: 4,
    title: 'Miód lipowy',
    cat: 'Miody',
    price: 4500,
    unit: '1 L',
    desc: 'Aromatyczny, na rozgrzewkę.'
  }, {
    id: 5,
    title: 'Jaja wiejskie',
    cat: 'Warzywa',
    price: 130,
    unit: 'szt.',
    desc: 'Od kur z wybiegu.',
    lowStock: 6
  }, {
    id: 6,
    title: 'Jabłka',
    cat: 'Warzywa',
    price: 500,
    unit: 'kg',
    desc: 'Odmiana sezonowa.'
  }, {
    id: 7,
    title: 'Gruszki konferencje',
    cat: 'Warzywa',
    price: 750,
    unit: 'kg',
    desc: 'Soczyste, prosto z sadu.'
  }, {
    id: 8,
    title: 'Sałata masłowa',
    cat: 'Warzywa',
    price: 400,
    unit: 'szt.',
    desc: 'Zrywana rano.',
    lowStock: 3
  }, {
    id: 9,
    title: 'Ziemniaki',
    cat: 'Warzywa',
    desc: 'Luzem na wagę lub w worku.',
    variants: [{
      value: 'luzem',
      label: 'luzem — 1,80 zł / kg',
      price: 180
    }, {
      value: 'worek',
      label: 'worek 15 kg — 25,00 zł',
      price: 2500
    }]
  }, {
    id: 10,
    title: 'Kapusta kiszona',
    cat: 'Kiszonki',
    desc: 'Własnej roboty.',
    variants: [{
      value: '1kg',
      label: '1 kg — 8,50 zł',
      price: 850
    }, {
      value: '5kg',
      label: '5 kg — 32,00 zł',
      price: 3200
    }]
  }, {
    id: 11,
    title: 'Ogórki kiszone',
    cat: 'Kiszonki',
    desc: 'Własnej roboty, z koprem.',
    variants: [{
      value: '0.5kg',
      label: '0,5 kg — 11,00 zł',
      price: 1100
    }, {
      value: '3kg',
      label: '3 kg — 48,00 zł',
      price: 4800
    }]
  }, {
    id: 12,
    title: 'Sok z kapusty kiszonej',
    cat: 'Kiszonki',
    price: 450,
    unit: '0,5 L',
    desc: 'Na odporność.'
  }, {
    id: 13,
    title: 'Pyłek pszczeli',
    cat: 'Od pszczół',
    price: 2800,
    unit: '300 g',
    desc: 'Suszony, sypki.'
  }, {
    id: 14,
    title: 'Propolis',
    cat: 'Od pszczół',
    price: 3500,
    unit: '50 g',
    desc: 'Nalewka domowa.'
  }, {
    id: 15,
    title: 'Pomidory malinowe',
    cat: 'Warzywa',
    seasonal: true,
    desc: 'Cena sezonowa — ustalana indywidualnie.'
  }, {
    id: 16,
    title: 'Koper',
    cat: 'Warzywa',
    seasonal: true,
    desc: 'Cena sezonowa — z ogródka.'
  }],
  orders: [{
    number: '2024-118',
    status: 'out_for_delivery',
    date: '24 czerwca 2025, 18:32',
    amount: 8600,
    items: [{
      q: 2,
      name: 'Miód rzepakowy',
      price: 4000
    }, {
      q: 4,
      name: 'Jaja wiejskie',
      price: 130
    }]
  }, {
    number: '2024-101',
    status: 'delivered',
    date: '13 czerwca 2025, 09:14',
    amount: 4500,
    items: [{
      q: 1,
      name: 'Miód lipowy',
      price: 4500
    }]
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/shop/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Price = __ds_scope.Price;

__ds_ns.ProductCard = __ds_scope.ProductCard;

__ds_ns.QuantityStepper = __ds_scope.QuantityStepper;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.ORDER_STATUS = __ds_scope.ORDER_STATUS;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.ShopHeader = __ds_scope.ShopHeader;

})();
