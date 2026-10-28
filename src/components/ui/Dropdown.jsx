import { useId, useRef, useState } from 'react';

import { useClickOutside } from '@/hooks/useClickOutside';
import { cn } from '@/lib/cn';

/**
 * Menu of actions. `trigger` is a render function `(props) => <button {...props} />` or an element.
 * `items`: [{ label, onSelect, icon?, danger?, disabled?, hidden? } | 'separator'].
 */
export function Dropdown({
  trigger,
  items = [],
  align = 'end',
  className,
  label = 'More actions',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef(null);
  const itemRefs = useRef([]);
  const menuId = useId();
  const visible = items.filter((i) => i === 'separator' || !i.hidden);
  const actionable = visible.filter((i) => i !== 'separator');

  useClickOutside(wrapRef, () => setIsOpen(false), isOpen);

  const open = () => {
    setIsOpen(true);
    requestAnimationFrame(() => itemRefs.current[0]?.focus());
  };

  const onMenuKey = (e) => {
    const index = itemRefs.current.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      itemRefs.current[(index + 1) % actionable.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      itemRefs.current[(index - 1 + actionable.length) % actionable.length]?.focus();
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  const triggerProps = {
    'aria-haspopup': 'menu',
    'aria-expanded': isOpen,
    'aria-controls': menuId,
    'aria-label': label,
    onClick: () => (isOpen ? setIsOpen(false) : open()),
  };

  let actionIndex = -1;
  return (
    <div ref={wrapRef} className={cn('relative inline-block', className)}>
      {typeof trigger === 'function' ? trigger(triggerProps) : trigger}
      {isOpen && (
        <div
          id={menuId}
          role="menu"
          tabIndex={-1}
          onKeyDown={onMenuKey}
          className={cn(
            'absolute z-40 mt-1 min-w-[180px] rounded-lg border border-surface-border bg-surface py-1 shadow-lg',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {visible.map((item, i) => {
            if (item === 'separator')
              return <hr key={`sep-${i}`} className="my-1 border-surface-border" />;
            actionIndex += 1;
            const idx = actionIndex;
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                ref={(el) => (itemRefs.current[idx] = el)}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setIsOpen(false);
                  item.onSelect?.();
                }}
                className={cn(
                  'flex min-h-[40px] w-full items-center gap-2 px-3 text-left text-sm hover:bg-primary-50 focus:bg-primary-50 focus:outline-none disabled:opacity-50',
                  item.danger ? 'text-danger' : 'text-ink',
                )}
              >
                {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
