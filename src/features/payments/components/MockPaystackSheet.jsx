import { ShieldCheck } from 'lucide-react';

import { Button, Modal } from '@/components/ui';
import { formatNaira } from '@/lib/format';

import { useMockPaystackStore } from '../lib/mock-paystack-store';

/** Stands in for the Paystack popup on mocks. Mounted once near the app root. */
export function MockPaystackSheet() {
  const request = useMockPaystackStore((s) => s.request);
  const finish = useMockPaystackStore((s) => s.finish);
  if (!request) return null;
  return (
    <Modal
      open
      size="sm"
      onClose={() => finish({ status: 'cancelled' })}
      title="Paystack (test mode)"
      description="Simulated payment. No real money moves."
    >
      <div className="space-y-4 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-secondary" aria-hidden="true" />
        <div>
          <p className="text-sm text-ink-muted">{request.email}</p>
          <p className="text-2xl font-semibold">{formatNaira(request.amount)}</p>
          <p className="text-xs text-ink-muted">Reference {request.reference}</p>
        </div>
        <Button fullWidth size="lg" onClick={() => finish({ status: 'success' })}>
          Pay {formatNaira(request.amount)}
        </Button>
        <Button fullWidth variant="outline" onClick={() => finish({ status: 'failed' })}>
          Simulate a failed payment
        </Button>
      </div>
    </Modal>
  );
}
