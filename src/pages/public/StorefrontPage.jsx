import { useParams } from 'react-router-dom';

import { VendorReviews } from '@/features/reviews';
import { Storefront } from '@/features/vendors';

export default function StorefrontPage() {
  const { vendorSlug } = useParams();
  return (
    <div className="px-4 py-6 md:px-6">
      <Storefront slug={vendorSlug}>
        {(vendor) => <VendorReviews targetId={vendor.id} />}
      </Storefront>
    </div>
  );
}
