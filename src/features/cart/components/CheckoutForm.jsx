import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Skeleton, toast } from '@/components/feedback';
import { AddressPicker } from '@/components/maps';
import { Button, Card, Checkbox, Input, RadioGroup, Textarea } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { addressErrors, formatAddress, useAddresses, useSaveAddress } from '@/features/auth';
import { usePayAndPlaceOrder } from '@/features/payments';
import { getErrorMessage } from '@/lib/api-error';
import { formatNaira } from '@/lib/format';
import { useCartStore } from '@/stores/cart-store';

import { CartView } from './CartView';
import { CheckoutSummary } from './CheckoutSummary';
import { useCheckoutQuote } from '../hooks/useCheckout';
import { lagosLocalMin, lagosLocalToIso, toQuoteItems } from '../lib/checkout';

const NEW = 'new';

/** Address, delivery note, optional scheduled time, summary and payment. */
export function CheckoutForm() {
  const navigate = useNavigate();
  const vendor = useCartStore((s) => s.vendor);
  const lines = useCartStore((s) => s.lines);
  const addresses = useAddresses();
  const saveAddress = useSaveAddress();
  const pay = usePayAndPlaceOrder();

  const [choice, setChoice] = useState(null);
  const [newAddress, setNewAddress] = useState({ label: 'Home', city: 'Lagos' });
  const [saveNew, setSaveNew] = useState(true);
  const [note, setNote] = useState('');
  const [when, setWhen] = useState('now');
  const [scheduledLocal, setScheduledLocal] = useState('');
  const [payError, setPayError] = useState(null);

  const saved = addresses.data ?? [];
  const selected =
    choice ??
    (saved.find((a) => a.isDefault) ?? saved[0])?.id ??
    (addresses.isSuccess ? NEW : null);
  const newErrors = addressErrors(newAddress);
  const addressPart =
    selected && selected !== NEW
      ? { addressId: selected }
      : selected === NEW && !Object.keys(newErrors).length
        ? { address: newAddress }
        : null;
  const scheduledFor = when === 'later' ? lagosLocalToIso(scheduledLocal) : null;
  const input =
    lines.length && vendor && addressPart && (when === 'now' || scheduledFor)
      ? { vendorId: vendor.id, items: toQuoteItems(lines), ...addressPart, scheduledFor }
      : null;
  const quote = useCheckoutQuote(input);
  const isClosed = quote.error?.code === 'VENDOR_CLOSED';

  if (!lines.length) return <CartView />;

  const placeOrder = async () => {
    setPayError(null);
    try {
      let body = { ...input, deliveryNote: note };
      if (selected === NEW && saveNew) {
        const created = await saveAddress.mutateAsync(newAddress);
        body = { ...body, address: undefined, addressId: created.id };
      }
      const result = await pay.mutateAsync(body);
      useCartStore.getState().clear();
      navigate(ROUTES.account.orderConfirmed(result.order.id), { replace: true });
    } catch (error) {
      if (error.paymentStatus === 'cancelled') {
        toast.info('Payment cancelled. Your cart is still here.');
      } else if (error.paymentStatus === 'failed') {
        setPayError("We couldn't take that payment. Try another card or bank.");
      } else {
        setPayError(getErrorMessage(error));
      }
    }
  };

  const addressOptions = [
    ...saved.map((a) => ({ value: a.id, label: a.label, description: formatAddress(a) })),
    { value: NEW, label: 'New address', description: 'Drop a pin on the map' },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-base font-semibold">Delivery address</h2>
          {addresses.isLoading ? (
            <div role="status" aria-label="Loading addresses" className="space-y-2">
              <Skeleton className="h-16 rounded-card" />
              <Skeleton className="h-16 rounded-card" />
            </div>
          ) : (
            <RadioGroup
              name="address"
              label="Deliver to"
              variant="cards"
              options={addressOptions}
              value={selected}
              onChange={setChoice}
            />
          )}
          {selected === NEW && (
            <div className="space-y-3">
              <AddressPicker value={newAddress} onChange={setNewAddress} errors={{}} />
              <Checkbox
                label="Save this address for next time"
                checked={saveNew}
                onChange={(e) => setSaveNew(e.target.checked)}
              />
            </div>
          )}
          <Textarea
            label="Delivery note (optional)"
            placeholder="Call when you get to the gate"
            rows={2}
            maxLength={200}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base font-semibold">When</h2>
          {isClosed && when === 'now' && (
            <p className="rounded-lg bg-warning-50 p-3 text-sm text-amber-800">
              {vendor.name} is closed right now. Schedule your order for when they open.
            </p>
          )}
          <RadioGroup
            name="when"
            label="Delivery time"
            options={[
              { value: 'now', label: 'As soon as possible' },
              { value: 'later', label: 'Schedule for later' },
            ]}
            value={when}
            onChange={setWhen}
          />
          {when === 'later' && (
            <Input
              type="datetime-local"
              label="Deliver at (Lagos time)"
              min={lagosLocalMin(30)}
              value={scheduledLocal}
              onChange={(e) => setScheduledLocal(e.target.value)}
              hint="At least 30 minutes from now, up to 7 days ahead."
            />
          )}
        </Card>

        <Card padding="sm">
          <details>
            <summary className="cursor-pointer text-sm font-medium">Edit cart</summary>
            <div className="pt-3">
              <CartView />
            </div>
          </details>
        </Card>
      </div>

      <div className="space-y-3 lg:sticky lg:top-20">
        <CheckoutSummary
          quote={quote.data && !quote.error ? quote.data : null}
          isLoading={quote.isLoading}
          isUpdating={quote.isFetching}
          error={isClosed && when === 'now' ? null : quote.error}
        />
        {payError && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-sm text-red-700">
            {payError}
          </p>
        )}
        <Button
          fullWidth
          size="lg"
          loading={pay.isPending || saveAddress.isPending}
          disabled={!quote.data || Boolean(quote.error) || quote.isFetching}
          onClick={placeOrder}
        >
          {quote.data && !quote.error ? `Pay ${formatNaira(quote.data.total)}` : 'Pay'}
        </Button>
        <p className="text-center text-xs text-ink-muted">
          Secure payment by Paystack: card, bank transfer or USSD.
        </p>
      </div>
    </div>
  );
}
