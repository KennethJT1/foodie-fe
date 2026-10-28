import { PageHeader } from '@/components/data';
import { ROUTES } from '@/constants/routes';
import { AddressBook } from '@/features/auth';

export default function AddressesPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader title="Addresses" backTo={ROUTES.account.root} backLabel="Account" />
      <AddressBook />
    </div>
  );
}
