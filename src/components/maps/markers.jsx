import { Bike, Home, Store } from 'lucide-react';

import { cn } from '@/lib/cn';

const KIND = {
  rider: { icon: Bike, className: 'bg-primary-600 text-white', label: 'Rider' },
  vendor: { icon: Store, className: 'bg-secondary text-white', label: 'Vendor' },
  customer: { icon: Home, className: 'bg-info text-white', label: 'Delivery address' },
  pin: { icon: null, className: 'bg-danger text-white', label: 'Pin' },
};

/** Round marker for a rider, vendor or customer. Used by both map renderers. */
export function RiderMarker({ kind = 'rider', label, isActive = false, heading }) {
  const k = KIND[kind] ?? KIND.pin;
  const Icon = k.icon;
  return (
    <span
      className={cn(
        'relative flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white shadow-md',
        k.className,
        isActive && 'ring-4 ring-primary-100',
      )}
      title={label ?? k.label}
    >
      {kind === 'rider' && (
        <span
          className="absolute inset-0 animate-ping rounded-full bg-primary-600 opacity-30"
          aria-hidden="true"
        />
      )}
      {Icon ? (
        <Icon
          className="relative h-4 w-4"
          aria-hidden="true"
          style={heading != null ? { transform: `rotate(${heading}deg)` } : undefined}
        />
      ) : (
        <span className="h-2 w-2 rounded-full bg-white" />
      )}
      <span className="sr-only">{label ?? k.label}</span>
    </span>
  );
}
