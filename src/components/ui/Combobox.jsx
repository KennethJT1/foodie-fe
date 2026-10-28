import { Check, ChevronsUpDown } from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';

import { useClickOutside } from '@/hooks/useClickOutside';
import { cn } from '@/lib/cn';

import { Field, controlClasses } from './Field';

/**
 * Searchable single select. `options`: [{ value, label, description? }].
 * Keyboard: ↑/↓ to move, Enter to choose, Esc to close.
 */
export function Combobox({
  id: idProp,
  label,
  hint,
  error,
  options = [],
  value,
  onChange,
  placeholder = 'Search…',
  emptyText = 'No matches',
  className,
  required,
  disabled,
}) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const listId = `${id}-list`;
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  useClickOutside(wrapRef, () => setIsOpen(false), isOpen);

  const choose = (option) => {
    onChange?.(option.value, option);
    setQuery('');
    setIsOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && isOpen && filtered[active]) {
      e.preventDefault();
      choose(filtered[active]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <div ref={wrapRef} className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={isOpen && filtered[active] ? `${id}-opt-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          disabled={disabled}
          className={cn(controlClasses(error), 'h-11 pr-9')}
          placeholder={selected?.label ?? placeholder}
          value={isOpen ? query : (selected?.label ?? '')}
          onFocus={() => {
            setIsOpen(true);
            setActive(0);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
        <ChevronsUpDown
          className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-ink-muted"
          aria-hidden="true"
        />
        {isOpen && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-surface-border bg-surface py-1 shadow-lg"
          >
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-ink-muted">{emptyText}</li>
            )}
            {filtered.map((o, i) => (
              // Keyboard selection happens on the input (aria-activedescendant pattern).
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <li
                key={o.value}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={o.value === value}
                className={cn(
                  'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm',
                  i === active && 'bg-primary-50',
                )}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => choose(o)}
                onMouseEnter={() => setActive(i)}
              >
                <Check
                  className={cn('h-4 w-4 text-primary-600', o.value !== value && 'invisible')}
                  aria-hidden="true"
                />
                <span>
                  {o.label}
                  {o.description && (
                    <span className="block text-xs text-ink-muted">{o.description}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Field>
  );
}
