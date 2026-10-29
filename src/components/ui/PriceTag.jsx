import { cn } from '@/lib/cn';
import { formatNaira } from '@/lib/format';

/** Money in kobo, always shown as ₦. `compareAt` shows a struck-through old price. */
export function PriceTag({ amount, compareAt, size = 'md', className }) {
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' };
  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-2 font-semibold text-ink',
        sizes[size],
        className,
      )}
    >
      {formatNaira(amount)}
      {compareAt != null && compareAt > amount && (
        <s className="text-sm font-normal text-ink-muted">{formatNaira(compareAt)}</s>
      )}
    </span>
  );
}
