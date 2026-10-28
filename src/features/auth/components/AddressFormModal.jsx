import { useState } from 'react';

import { toast } from '@/components/feedback';
import { AddressPicker } from '@/components/maps';
import { Button, Input, Modal, RadioGroup } from '@/components/ui';

import { useSaveAddress } from '../hooks/useAddresses';
import { addressErrors } from '../lib/address';

const LABELS = ['Home', 'Work', 'Other'].map((l) => ({ value: l, label: l }));

/** Add or edit a saved delivery address. */
export function AddressFormModal({ open, onClose, address }) {
  const [value, setValue] = useState(() => address ?? { label: 'Home', city: 'Lagos' });
  const [errors, setErrors] = useState({});
  const save = useSaveAddress();

  const submit = () => {
    const found = addressErrors(value);
    setErrors(found);
    if (Object.keys(found).length) return;
    save.mutate(value, {
      onSuccess: () => {
        toast.success(address ? 'Address updated' : 'Address saved');
        onClose();
      },
      onError: (e) => {
        if (Object.keys(e.fieldErrors ?? {}).length) setErrors(e.fieldErrors);
        else toast.error(e);
      },
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={address ? 'Edit address' : 'Add an address'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} onClick={submit}>
            Save address
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <RadioGroup
          label="Label"
          options={LABELS}
          value={value.label}
          onChange={(label) => setValue((v) => ({ ...v, label }))}
          className="[&>div]:flex [&>div]:gap-4 [&>div]:space-y-0"
        />
        <AddressPicker value={value} onChange={setValue} errors={errors} />
        <Input
          label="Directions for the rider (optional)"
          placeholder="Blue gate opposite the church"
          maxLength={120}
          value={value.directions ?? ''}
          onChange={(e) => setValue((v) => ({ ...v, directions: e.target.value }))}
        />
      </div>
    </Modal>
  );
}
