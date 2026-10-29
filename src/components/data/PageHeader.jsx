import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/cn';

/** Page title row with optional back link and actions. */
export function PageHeader({
  title,
  description,
  actions,
  backTo,
  backLabel = 'Back',
  className,
  children,
}) {
  return (
    <header className={cn('mb-4 space-y-2 md:mb-6', className)}>
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex min-h-[36px] items-center gap-1 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold md:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
