import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useLayoutEffect, useRef, useState } from 'react';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';

/**
 * Window-scrolled virtual list for long feeds: only the rows on screen are in the DOM.
 * `columns` = { sm, lg } splits items into grid rows at those breakpoints.
 */
export function VirtualRows({
  items,
  renderItem,
  getKey,
  columns = {},
  estimateRowHeight = 480,
  gapClassName = 'gap-5',
  className,
}) {
  const isSm = useMediaQuery('(min-width: 640px)');
  const isLg = useMediaQuery('(min-width: 1024px)');
  const perRow = (isLg && columns.lg) || (isSm && columns.sm) || 1;
  const rows = [];
  for (let i = 0; i < items.length; i += perRow) rows.push(items.slice(i, i + perRow));

  const listRef = useRef(null);
  const [offset, setOffset] = useState(0);
  useLayoutEffect(() => {
    setOffset(listRef.current?.getBoundingClientRect().top + window.scrollY || 0);
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => estimateRowHeight,
    overscan: 3,
    scrollMargin: offset,
  });

  return (
    <div
      ref={listRef}
      role="list"
      className={cn('relative', className)}
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map((row) => (
        <div
          key={row.key}
          data-index={row.index}
          ref={(el) => {
            // Rows that have not laid out yet (or jsdom) report 0; keep the estimate for those
            if (el && el.getBoundingClientRect().height > 0) virtualizer.measureElement(el);
          }}
          role="presentation"
          className={cn('absolute inset-x-0 top-0 grid pb-5', gapClassName)}
          style={{
            transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
            gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))`,
          }}
        >
          {rows[row.index].map((item, i) => (
            <div key={getKey(item)} role="listitem">
              {renderItem(item, row.index * perRow + i)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
