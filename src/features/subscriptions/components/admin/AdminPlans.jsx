import { Plus } from 'lucide-react';
import { useState } from 'react';

import { ErrorState, Skeleton } from '@/components/feedback';
import { Badge, Button } from '@/components/ui';

import { PlanEditorDialog } from './PlanEditorDialog';
import { useAdminPlans } from '../../hooks/useAdminSubscriptions';
import { PlanCard } from '../PlanCard';

/** Plans and prices editor (BR-SUB-07). Trial length and yearly discount live in settings. */
export function AdminPlans() {
  const { data, isLoading, isError, error, refetch } = useAdminPlans();
  const [editing, setEditing] = useState(null); // plan, or 'new'

  if (isLoading)
    return (
      <div role="status" aria-label="Loading plans" className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-96 rounded-card" />
        ))}
      </div>
    );
  if (isError)
    return <ErrorState title="We couldn't load the plans" error={error} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {data.meta.trialDays}-day free trial · yearly plans save {data.meta.yearlyDiscountPct}%.
          Change these in Settings.
        </p>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing('new')}>
          Add a plan
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.data.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            interval="monthly"
            className={plan.isRetired ? 'opacity-70' : undefined}
            action={
              <div className="space-y-2">
                <p className="flex flex-wrap gap-2 text-sm text-ink-muted">
                  {plan.vendorCount} vendors on it
                  {plan.isRetired && <Badge tone="warning">Retired</Badge>}
                </p>
                <Button fullWidth variant="outline" onClick={() => setEditing(plan)}>
                  Edit {plan.name}
                </Button>
              </div>
            }
          />
        ))}
      </div>
      {editing && (
        <PlanEditorDialog
          plan={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
