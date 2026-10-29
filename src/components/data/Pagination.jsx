import { ChevronLeft, ChevronRight } from 'lucide-react';

import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';

const pageWindow = (page, total) => {
  const pages = new Set([1, total, page - 1, page, page + 1]);
  const list = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  list.forEach((p, i) => {
    if (i > 0 && p - list[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
};

/** Page numbers + page size. `meta` is the API's pagination meta. */
export function Pagination({
  meta,
  onPageChange,
  onLimitChange,
  limits = [10, 20, 50, 100],
  className,
}) {
  if (!meta || meta.total === 0) return null;
  const { page, limit, total, totalPages } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'flex flex-col items-center justify-between gap-3 py-3 text-sm sm:flex-row',
        className,
      )}
    >
      <p className="text-ink-muted">
        Showing {formatCount(from)}–{formatCount(to)} of {formatCount(total)}
      </p>
      <div className="flex items-center gap-3">
        {onLimitChange && (
          <label className="flex items-center gap-2 text-ink-muted">
            <span className="hidden sm:inline">Rows</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="h-9 rounded-lg border-surface-border py-0 text-sm focus:border-primary focus:ring-primary"
              aria-label="Rows per page"
            >
              {limits.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex items-center gap-1">
          <IconButton
            icon={ChevronLeft}
            label="Previous page"
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          />
          {pageWindow(page, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="px-1 text-ink-muted" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Page ${p}`}
                className={cn(
                  'hidden h-9 min-w-[36px] rounded-lg px-2 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink sm:inline-block',
                  p === page ? 'bg-primary text-ink' : 'hover:bg-primary-50',
                )}
              >
                {p}
              </button>
            ),
          )}
          <span className="px-2 sm:hidden">
            {page} / {totalPages}
          </span>
          <IconButton
            icon={ChevronRight}
            label="Next page"
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          />
        </div>
      </div>
    </nav>
  );
}
