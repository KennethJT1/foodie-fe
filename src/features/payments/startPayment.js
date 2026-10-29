import { env } from '@/lib/env';

import { useMockPaystackStore } from './lib/mock-paystack-store';

/**
 * Opens the Paystack popup for a transaction the backend initialised.
 * Resolves `{ status: 'success' | 'failed' | 'cancelled', reference, message? }`; never rejects
 * for a declined card, so callers handle every outcome in one place.
 * In mock mode (or without a public key) a simulated sheet is shown instead of Paystack.
 *
 * @param {{ accessCode: string, reference: string, amount: number, email?: string }} tx
 */
export async function startPayment(tx) {
  if (env.useMocks || !env.paystackPublicKey) {
    return useMockPaystackStore.getState().open(tx);
  }
  const { default: PaystackPop } = await import('@paystack/inline-js');
  return new Promise((resolve) => {
    const popup = new PaystackPop();
    popup.resumeTransaction(tx.accessCode, {
      onSuccess: (t) => resolve({ status: 'success', reference: t?.reference ?? tx.reference }),
      onCancel: () => resolve({ status: 'cancelled', reference: tx.reference }),
      onError: (e) =>
        resolve({ status: 'failed', reference: tx.reference, message: e?.message ?? null }),
    });
  });
}
