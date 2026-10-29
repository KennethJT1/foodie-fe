import { useState } from 'react';

import { toast } from '@/components/feedback';
import { Button } from '@/components/ui';
import {
  chosenOptions,
  defaultSelection,
  OptionGroupsPicker,
  priceWithOptions,
  selectionErrors,
} from '@/features/catalogue';
import { formatNaira } from '@/lib/format';
import { useUiStore } from '@/stores/ui-store';

import { NewCartDialog } from './NewCartDialog';
import { QuantityStepper } from './QuantityStepper';
import { useAddToCart } from '../hooks/useAddToCart';

/** Options, quantity and "Add to cart – ₦X" for one food item. */
export function AddToCartForm({ item }) {
  const [selection, setSelection] = useState(() => defaultSelection(item.optionGroups));
  const [quantity, setQuantity] = useState(1);
  const [showErrors, setShowErrors] = useState(false);
  const { add, dialog } = useAddToCart();
  const openCart = useUiStore((s) => s.openCart);

  const options = chosenOptions(item.optionGroups, selection);
  const errors = selectionErrors(item.optionGroups, selection);
  const total = priceWithOptions(item.price, options) * quantity;

  const submit = () => {
    if (Object.keys(errors).length) {
      setShowErrors(true);
      return;
    }
    add(
      item.vendor,
      [
        {
          foodItemId: item.id,
          name: item.name,
          photo: item.photos?.[0] ?? null,
          unitPrice: item.price,
          quantity,
          options,
        },
      ],
      {
        onAdded: () => {
          toast.success(`Added ${item.name} to your cart`, {
            action: { label: 'View cart', onClick: openCart },
          });
          setQuantity(1);
        },
      },
    );
  };

  if (!item.isAvailable) {
    return (
      <Button fullWidth size="lg" disabled>
        Sold out
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <OptionGroupsPicker
        groups={item.optionGroups}
        value={selection}
        onChange={setSelection}
        errors={showErrors ? errors : {}}
      />
      {item.vendor && !item.vendor.isOpen && (
        <p className="rounded-lg bg-warning-50 p-3 text-sm text-amber-800">
          {item.vendor.name} is closed right now. You can still order and pick a later delivery time
          at checkout.
        </p>
      )}
      <div className="flex items-center gap-3">
        <QuantityStepper value={quantity} onChange={setQuantity} label={item.name} />
        <Button size="lg" className="flex-1" onClick={submit}>
          Add to cart – {formatNaira(total)}
        </Button>
      </div>
      <NewCartDialog {...dialog} />
    </div>
  );
}
