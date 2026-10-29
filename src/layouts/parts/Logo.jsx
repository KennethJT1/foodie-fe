import { Link } from 'react-router-dom';

import { cn } from '@/lib/cn';

export function Logo({ to = '/', className, showText = true, subtitle }) {
  return (
    <Link
      to={to}
      className={cn('inline-flex items-center gap-2 rounded-lg', className)}
      aria-label="KJT Foodie home"
    >
      <img src="/logo.webp" alt="" width="40" height="40" className="h-10 w-10 shrink-0" />
      {showText && (
        <span className="leading-tight">
          <span className="block font-heading text-lg font-bold text-ink">
            KJT <span className="text-primary">Foodie</span>
          </span>
          {subtitle && (
            <span className="block text-[11px] font-medium uppercase tracking-wide text-ink-muted">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}
