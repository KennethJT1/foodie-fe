import { lazy, Suspense } from 'react';

// Lazy so the vendor and rider features stay out of the first download for customers
const VendorParts = lazy(() => import('./VendorBanner').then((m) => ({ default: m.VendorBanner })));
const RiderParts = lazy(() => import('./RiderBanner').then((m) => ({ default: m.RiderBanner })));

export function VendorBannerSlot() {
  return (
    <Suspense fallback={null}>
      <VendorParts />
    </Suspense>
  );
}

export function RiderBannerSlot() {
  return (
    <Suspense fallback={null}>
      <RiderParts />
    </Suspense>
  );
}
