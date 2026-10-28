import { PageHeader } from '@/components/data';
import { FoodSearch } from '@/features/catalogue';

export default function SearchPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader
        title="Search"
        description="Find food by name, vendor, price, distance or rating."
      />
      <FoodSearch />
    </div>
  );
}
