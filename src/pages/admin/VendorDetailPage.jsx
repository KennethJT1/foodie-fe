import { useParams } from 'react-router-dom';

import { AdminVendorDetail } from '@/features/vendors';

export default function VendorDetailPage() {
  const { vendorId } = useParams();
  return (
    <div className="px-4 py-6 md:px-6">
      <AdminVendorDetail id={vendorId} />
    </div>
  );
}
