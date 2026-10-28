import { Construction } from 'lucide-react';

import { EmptyState } from '@/components/feedback';

/** Temporary screen for routes whose feature is built in a later phase. */
export function ComingSoon({ title, phase }) {
  return (
    <div className="px-4 py-6 md:px-6">
      <h1 className="mb-4 text-xl font-semibold md:text-2xl">{title}</h1>
      <EmptyState
        icon={Construction}
        title="Coming soon"
        message={`This screen is built in phase ${phase} of the build plan.`}
      />
    </div>
  );
}
