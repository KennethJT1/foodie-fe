import { useState } from 'react';

import { toast } from '@/components/feedback';
import { Button, Rating, Textarea } from '@/components/ui';

import { useRateOrder } from '../hooks/useReviews';

/** Stars + optional comment for one target (vendor or rider). */
export function RateTarget({ orderId, targetType, name }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const rate = useRateOrder();
  const label = targetType === 'vendor' ? `Rate ${name}` : `Rate your rider, ${name}`;

  const submit = () => {
    if (!rating) {
      setError('Pick 1 to 5 stars');
      return;
    }
    rate.mutate(
      { orderId, targetType, rating, comment },
      {
        onSuccess: () => toast.success('Thanks for your rating'),
        onError: (e) => toast.error(e),
      },
    );
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold">{label}</legend>
      <Rating
        value={rating}
        size="lg"
        label={label}
        onChange={(v) => {
          setRating(v);
          setError(null);
        }}
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Textarea
        label={`Comment for ${targetType === 'vendor' ? 'the vendor' : 'the rider'} (optional)`}
        rows={2}
        maxLength={500}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <Button size="sm" loading={rate.isPending} onClick={submit}>
        Submit rating
      </Button>
    </fieldset>
  );
}
