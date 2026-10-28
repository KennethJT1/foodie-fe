import { useParams } from 'react-router-dom';

import { Storefront } from '@/features/vendors';

export default function StorefrontPage() {
  const { vendorSlug } = useParams();
  return (
    <div className="px-4 py-6 md:px-6">
      <Storefront slug={vendorSlug} />
    </div>
  );
}
