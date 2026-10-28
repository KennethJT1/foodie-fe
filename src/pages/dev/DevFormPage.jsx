import { useState } from 'react';
import { z } from 'zod';

import { PageHeader } from '@/components/data';
import { toast } from '@/components/feedback';
import {
  Form,
  FormInput,
  FormSelect,
  FormSubmit,
  FormSwitch,
  FormTextarea,
  ImageUpload,
  MoneyInput,
  OtpInput,
  PhoneInput,
} from '@/components/forms';
import { MapView, AddressPicker } from '@/components/maps';
import { Card } from '@/components/ui';
import { api } from '@/lib/api-client';
import { nairaToKobo } from '@/lib/format';
import { v } from '@/lib/validation';

/** Demo form (phase 6): client validation plus server field errors from the mock API. */

const schema = z.object({
  name: v.name('food name'),
  email: v.email(),
  phone: v.phone(),
  categoryId: v.requiredString('Pick a category'),
  price: v.naira('Price'),
  description: z.string().max(500, 'Keep it under 500 characters').optional(),
  isAvailable: z.boolean(),
  photos: z.array(z.string()).min(1, 'Add at least one photo'),
  otp: v.otp(),
});

export default function DevFormPage() {
  const [address, setAddress] = useState({ city: 'Lagos' });
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-6">
      <PageHeader
        title="Demo form"
        description="Try customer@kjtfoodie.test as the email, or a price above ₦1,000 to see server errors."
        backTo="/dev/table"
        backLabel="Demo list"
      />
      <Card>
        <Form
          schema={schema}
          defaultValues={{
            name: '',
            email: '',
            phone: '',
            categoryId: '',
            price: '',
            description: '',
            isAvailable: true,
            photos: [],
            otp: '',
          }}
          onSubmit={async (values) => {
            await api.post('/dev/demo-form', { ...values, price: nairaToKobo(values.price) });
            toast.success('Saved');
          }}
        >
          <FormInput name="name" label="Food name" placeholder="Party jollof rice" />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput name="email" label="Email" type="email" autoComplete="email" />
            <PhoneInput name="phone" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect
              name="categoryId"
              label="Category"
              placeholder="Pick a category"
              options={[
                { value: 'cat-rice', label: 'Rice dishes' },
                { value: 'cat-grills', label: 'Grills and suya' },
              ]}
            />
            <MoneyInput name="price" label="Price" placeholder="2,500" />
          </div>
          <FormTextarea name="description" label="Description" maxLength={500} />
          <FormSwitch
            name="isAvailable"
            label="Available now"
            description="Customers can order it today"
          />
          <ImageUpload
            name="photos"
            label="Photos"
            max={3}
            hint="4:3, at least 800 × 600 px, under 2 MB"
          />
          <OtpInput name="otp" label="Code we sent you (any 6 digits)" />
          <FormSubmit>Save item</FormSubmit>
        </Form>
      </Card>
      <Card>
        <AddressPicker value={address} onChange={setAddress} />
      </Card>
      <Card>
        <h2 className="mb-3 text-base font-semibold">Tracking map</h2>
        <MapView
          route={[
            { lat: 6.5158, lng: 3.3794 },
            { lat: 6.512, lng: 3.376 },
            { lat: 6.5095, lng: 3.3711 },
          ]}
          markers={[
            {
              id: 'v',
              kind: 'vendor',
              label: 'Mama Put Kitchen',
              position: { lat: 6.5158, lng: 3.3794 },
            },
            { id: 'r', kind: 'rider', label: 'Rider', position: { lat: 6.512, lng: 3.376 } },
            { id: 'c', kind: 'customer', label: 'You', position: { lat: 6.5095, lng: 3.3711 } },
          ]}
        />
      </Card>
    </main>
  );
}
