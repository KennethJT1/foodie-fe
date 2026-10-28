import { useParams } from 'react-router-dom';

import { RefundDetail } from '@/features/refunds';

export default function RefundDetailPage() {
  const { refundId } = useParams();
  return (
    <div className="px-4 py-6 md:px-6">
      <RefundDetail id={refundId} />
    </div>
  );
}
