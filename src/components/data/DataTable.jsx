import { ArrowDown, ArrowUp, ArrowUpDown, MoreVertical } from 'lucide-react';

import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { Dropdown } from '@/components/ui/Dropdown';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';

/**
 * Column: { key, header, cell?(row), sortKey?, align?, className?, hideOnMobile?, primary? }.
 * `primary` columns lead each card on phones. `sort` is "-field" or "field".
 */
export function DataTable({
  columns,
  rows,
  loading = false,
  error,
  onRetry,
  sort,
  onSortChange,
  rowActions,
  onRowClick,
  getRowId = (row) => row.id,
  emptyState,
  caption,
  className,
  selectable = false,
  selected = [],
  onSelectedChange,
}) {
  const sortField = sort?.replace(/^-/, '');
  const sortDir = sort?.startsWith('-') ? 'desc' : 'asc';
  const allIds = (rows ?? []).map(getRowId);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.includes(id));

  const toggleSort = (key) => {
    if (!onSortChange) return;
    if (sortField !== key) onSortChange(`-${key}`);
    else onSortChange(sortDir === 'desc' ? key : `-${key}`);
  };

  const toggleRow = (id) =>
    onSelectedChange?.(
      selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id],
    );

  const cellValue = (col, row) => (col.cell ? col.cell(row) : row[col.key]);

  if (error) {
    return (
      <div className={cn('rounded-card bg-surface shadow-card', className)}>
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    );
  }

  const isEmpty = !loading && (!rows || rows.length === 0);

  return (
    <div className={cn('overflow-hidden rounded-card bg-surface shadow-card', className)}>
      {/* Table from md up */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="border-b border-surface-border bg-gray-50/60 text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              {selectable && (
                <th scope="col" className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={allSelected}
                    onChange={() => onSelectedChange?.(allSelected ? [] : allIds)}
                    className="h-4 w-4 rounded border-surface-border text-primary focus:ring-primary"
                  />
                </th>
              )}
              {columns.map((col) => {
                const key = col.sortKey ?? (col.sortable ? col.key : null);
                const active = key && sortField === key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={
                      active ? (sortDir === 'desc' ? 'descending' : 'ascending') : undefined
                    }
                    className={cn(
                      'whitespace-nowrap px-4 py-3 font-medium',
                      col.align === 'right' && 'text-right',
                      col.headerClassName,
                    )}
                  >
                    {key ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className={cn(
                          'inline-flex items-center gap-1 uppercase hover:text-ink',
                          active && 'text-ink',
                        )}
                      >
                        {col.header}
                        {active ? (
                          sortDir === 'desc' ? (
                            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
              {rowActions && (
                <th scope="col" className="w-12 px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {loading &&
              Array.from({ length: 6 }, (_, i) => (
                <tr key={`sk-${i}`}>
                  {selectable && <td className="px-4 py-3" />}
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3">
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                  {rowActions && <td />}
                </tr>
              ))}
            {!loading &&
              rows?.map((row) => {
                const id = getRowId(row);
                return (
                  <tr
                    key={id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      onRowClick && 'cursor-pointer hover:bg-primary-50/40',
                      selected.includes(id) && 'bg-primary-50/60',
                    )}
                  >
                    {selectable && (
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          aria-label="Select row"
                          checked={selected.includes(id)}
                          onChange={() => toggleRow(id)}
                          className="h-4 w-4 rounded border-surface-border text-primary focus:ring-primary"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-3 align-middle',
                          col.align === 'right' && 'text-right',
                          col.className,
                        )}
                      >
                        {cellValue(col, row)}
                      </td>
                    ))}
                    {rowActions && (
                      <td
                        className="px-2 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <RowActions items={rowActions(row)} />
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Cards on phones */}
      <ul className="divide-y divide-surface-border md:hidden">
        {loading &&
          Array.from({ length: 4 }, (_, i) => (
            <li key={`sk-${i}`} className="space-y-2 p-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </li>
          ))}
        {!loading &&
          rows?.map((row) => {
            const id = getRowId(row);
            const primary = columns.filter((c) => c.primary);
            const rest = columns.filter((c) => !c.primary && !c.hideOnMobile);
            const content = (
              <>
                {primary.length > 0 && (
                  <div className="mb-2 space-y-0.5 font-medium">
                    {primary.map((c) => (
                      <div key={c.key}>{cellValue(c, row)}</div>
                    ))}
                  </div>
                )}
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                  {rest.map((c) => (
                    <div key={c.key} className="contents">
                      <dt className="text-ink-muted">{c.header}</dt>
                      <dd className="text-right">{cellValue(c, row)}</dd>
                    </div>
                  ))}
                </dl>
              </>
            );
            return (
              <li
                key={id}
                className={cn('relative p-4', selected.includes(id) && 'bg-primary-50/60')}
              >
                <div className="flex items-start gap-3">
                  {selectable && (
                    <input
                      type="checkbox"
                      aria-label="Select row"
                      checked={selected.includes(id)}
                      onChange={() => toggleRow(id)}
                      className="mt-1 h-5 w-5 rounded border-surface-border text-primary focus:ring-primary"
                    />
                  )}
                  {onRowClick ? (
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => onRowClick(row)}
                    >
                      {content}
                    </button>
                  ) : (
                    <div className="min-w-0 flex-1">{content}</div>
                  )}
                  {rowActions && <RowActions items={rowActions(row)} />}
                </div>
              </li>
            );
          })}
      </ul>

      {isEmpty &&
        (emptyState ?? (
          <EmptyState
            title="Nothing here yet"
            message="When there is something to show, it will appear here."
          />
        ))}
    </div>
  );
}

function RowActions({ items }) {
  if (!items?.length) return null;
  return (
    <Dropdown
      label="Row actions"
      trigger={(p) => <IconButton icon={MoreVertical} size="sm" {...p} label="Row actions" />}
      items={items}
    />
  );
}
