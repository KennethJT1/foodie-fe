import { UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/cn';

/** 4:3 food photo that falls back to a placeholder, never a broken image. */
export function FoodImage({ src, alt, className, eager = false }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex aspect-[4/3] w-full items-center justify-center bg-primary-50 text-primary-600',
          className,
        )}
      >
        <UtensilsCrossed className="h-8 w-8" aria-hidden="true" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      width={400}
      height={300}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
      className={cn('aspect-[4/3] w-full bg-gray-100 object-cover', className)}
    />
  );
}
