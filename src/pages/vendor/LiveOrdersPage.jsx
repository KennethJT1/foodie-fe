import { VendorOrderQueue } from '@/features/orders';

export default function LiveOrdersPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <VendorOrderQueue />
    </div>
  );
}
