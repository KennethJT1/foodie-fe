import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/cn';

/**
 * Builds filter controls from a config. `value` is the current filters, `onChange(partial)`
 * receives only what changed. Field types:
 *  { type: 'search', name, placeholder }
 *  { type: 'select', name, label, options, placeholder? }
 *  { type: 'chips', name, label?, options, multiple? }   comma-separated values
 *  { type: 'dateRange', name: ['from', 'to'], label? }
 */
export function FilterBar({ fields = [], value = {}, onChange, className, onReset }) {
  const hasActive = fields.some((f) =>
    Array.isArray(f.name)
      ? f.name.some((n) => value[n])
      : value[f.name] != null && value[f.name] !== '',
  );

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
        {fields
          .filter((f) => f.type !== 'chips')
          .map((f) => (
            <FilterField
              key={Array.isArray(f.name) ? f.name.join('-') : f.name}
              field={f}
              value={value}
              onChange={onChange}
            />
          ))}
        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<X className="h-4 w-4" />}
            onClick={() => {
              const cleared = {};
              fields.forEach((f) =>
                (Array.isArray(f.name) ? f.name : [f.name]).forEach((n) => (cleared[n] = null)),
              );
              onChange(cleared);
              onReset?.();
            }}
          >
            Clear filters
          </Button>
        )}
      </div>
      {fields
        .filter((f) => f.type === 'chips')
        .map((f) => (
          <ChipsField
            key={f.name}
            field={f}
            value={value[f.name]}
            onChange={(v) => onChange({ [f.name]: v })}
          />
        ))}
    </div>
  );
}

function FilterField({ field, value, onChange }) {
  if (field.type === 'search') {
    return (
      <SearchField
        field={field}
        value={value[field.name] ?? ''}
        onChange={(v) => onChange({ [field.name]: v })}
      />
    );
  }
  if (field.type === 'select') {
    return (
      <Select
        label={field.label}
        labelHidden={!field.showLabel}
        aria-label={field.label}
        className="md:w-48"
        placeholder={field.placeholder ?? `All ${field.label?.toLowerCase() ?? ''}`.trim()}
        options={field.options}
        value={value[field.name] ?? ''}
        onValueChange={(v) => onChange({ [field.name]: v })}
      />
    );
  }
  if (field.type === 'dateRange') {
    const [fromKey, toKey] = field.name;
    return (
      <div className="flex gap-2">
        <Input
          type="date"
          label={`${field.label ?? 'Date'} from`}
          labelHidden={!field.showLabel}
          className="md:w-40"
          value={value[fromKey] ?? ''}
          max={value[toKey] || undefined}
          onChange={(e) => onChange({ [fromKey]: e.target.value })}
        />
        <Input
          type="date"
          label={`${field.label ?? 'Date'} to`}
          labelHidden={!field.showLabel}
          className="md:w-40"
          value={value[toKey] ?? ''}
          min={value[fromKey] || undefined}
          onChange={(e) => onChange({ [toKey]: e.target.value })}
        />
      </div>
    );
  }
  return null;
}

/** Search box debounced by 400 ms. */
function SearchField({ field, value, onChange }) {
  const [text, setText] = useState(value);
  const debounced = useDebounce(text, 400);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Follow outside changes (e.g. "Clear filters" or back button)
  useEffect(() => setText(value), [value]);

  useEffect(() => {
    if (debounced !== value) onChangeRef.current(debounced.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <Input
      type="search"
      label={field.label ?? 'Search'}
      labelHidden
      className="md:w-72"
      placeholder={field.placeholder ?? 'Search'}
      leftIcon={<Search />}
      value={text}
      onChange={(e) => setText(e.target.value)}
    />
  );
}

function ChipsField({ field, value, onChange }) {
  const selected = value ? String(value).split(',') : [];
  const multiple = field.multiple ?? true;
  const toggle = (v) => {
    if (!multiple) return onChange(selected[0] === v ? null : v);
    const next = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v];
    return onChange(next.length ? next.join(',') : null);
  };
  return (
    <div
      role="group"
      aria-label={field.label ?? field.name}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
    >
      {field.options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(o.value)}
            className={cn(
              'inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
              on
                ? 'border-primary bg-primary text-ink'
                : 'border-surface-border bg-surface text-ink hover:border-primary',
            )}
          >
            {o.icon && <span aria-hidden="true">{o.icon}</span>}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
