import { useParams } from 'react-router-dom';

import { AdminRiderDetail } from '@/features/riders';

export default function RiderDetailPage() {
  const { riderId } = useParams();
  return (
    <div className="px-4 py-6 md:px-6">
      <AdminRiderDetail id={riderId} />
    </div>
  );
}
