import { useParams } from 'react-router-dom';

import { FoodDetail } from '@/features/feed';

export default function FoodDetailPage() {
  const { foodId } = useParams();
  return (
    <div className="px-4 py-6 md:px-6">
      <FoodDetail id={foodId} />
    </div>
  );
}
