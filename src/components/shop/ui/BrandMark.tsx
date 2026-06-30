/** od-sąsiada.pl mark — inline SVG so it inherits theme colours via var(--brand). */
export const BrandMark = ({ className, size = 34 }: { className?: string; size?: number }) => (
  <svg aria-hidden='true' className={className} height={size} viewBox='0 0 56 56' width={size}>
    <circle cx='28' cy='28' fill='var(--brand)' r='28' />
    <path d='M28 45c0-7-1.5-11.5-5.5-15' stroke='#fff' strokeLinecap='round' strokeWidth='2.6' />
    <path d='M28 33c-9 0-14.5-5-13.5-13C23 19 28 25 28 33Z' fill='#fff' />
    <path d='M29 30c0-8 4.5-13.5 13-13.5C42.5 25 37 30 29 30Z' fill='#cfe6d4' />
  </svg>
)
