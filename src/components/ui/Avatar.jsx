import { cva } from 'class-variance-authority';
import { useState } from 'react';

import { cn } from '@/lib/cn';

const avatarVariants = cva(
  'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 font-semibold text-primary-700',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-[10px]',
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-14 w-14 text-lg',
        xl: 'h-20 w-20 text-2xl',
      },
      shape: { circle: 'rounded-full', square: 'rounded-xl' },
    },
    defaultVariants: { size: 'md', shape: 'circle' },
  },
);

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';

/** Image avatar that falls back to initials (never a broken image). */
export function Avatar({ src, name, size, shape, className }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={cn(avatarVariants({ size, shape }), className)}>
      {src && !failed ? (
        <img
          src={src}
          alt={name ?? ''}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden={!name}>{initials(name)}</span>
      )}
      {!src && name && <span className="sr-only">{name}</span>}
    </span>
  );
}
