import { useParams } from 'react-router-dom';

import { MenuItemForm } from '@/features/catalogue';

export default function MenuItemFormPage() {
  const { itemId } = useParams();
  return (
    <div className="px-4 py-6 md:px-6">
      <MenuItemForm id={itemId} />
    </div>
  );
}
