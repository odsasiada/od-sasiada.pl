import { cn } from '@/lib/utils'

const BTN =
  'inline-flex size-10 items-center justify-center text-xl leading-none text-text-body transition-colors hover:bg-[var(--stone-100)] active:bg-[var(--stone-200)] disabled:cursor-not-allowed disabled:text-text-faint focus-visible:outline-none focus-visible:[box-shadow:var(--ring-focus)]'

/** −/value/+ control. 40px targets, soft pill ends; tabular numerals. */
export const QuantityStepper = ({
  className,
  max = 99,
  min = 1,
  onChange,
  value,
}: {
  className?: string
  max?: number
  min?: number
  onChange: (next: number) => void
  value: number
}) => (
  <div
    className={cn(
      'inline-flex items-center overflow-hidden rounded-md border-[1.5px] border-border-hairline bg-surface-card',
      className,
    )}
  >
    <button
      aria-label='Mniej'
      className={BTN}
      disabled={value <= min}
      onClick={() => onChange(Math.max(min, value - 1))}
      type='button'
    >
      −
    </button>
    <span
      aria-live='polite'
      className='inline-flex h-10 min-w-10 items-center justify-center border-x-[1.5px] border-border-hairline text-base font-bold text-text-body tabular-nums'
    >
      {value}
    </span>
    <button
      aria-label='Więcej'
      className={BTN}
      disabled={value >= max}
      onClick={() => onChange(Math.min(max, value + 1))}
      type='button'
    >
      +
    </button>
  </div>
)
