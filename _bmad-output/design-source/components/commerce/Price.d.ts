import * as React from 'react'

/**
 * Trust-critical price display. Formats grosze (integer PLN cents) as
 * "40,00 zł" with tabular lining numerals.
 */
export interface PriceProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Price in grosze (e.g. 4000 → "40,00 zł"). Null/undefined → seasonal. */
  value?: number | null
  /** Unit suffix, e.g. "kg", "szt.", "1 L". */
  unit?: string
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg'
  /** Render "Cena sezonowa" instead of a number. @default false */
  seasonal?: boolean
}

/** grosze → "10,00 zł" */
export declare function formatPLN(grosze: number): string
export declare function Price(props: PriceProps): React.JSX.Element
