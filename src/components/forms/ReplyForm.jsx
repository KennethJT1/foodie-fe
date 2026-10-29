import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { getErrorMessage } from '@/lib/api-error';

/** A short reply box. `onSubmit(text)` returns a promise; the box clears when it resolves. */
export function ReplyForm({
  label = 'Your reply',
  submitLabel = 'Send reply',
  maxLength = 500,
  onSubmit,
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const [isSending, setSending] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return setError('Write a reply first');
    setSending(true);
    try {
      await onSubmit(text.trim());
      setText('');
      setError(null);
    } catch (err) {
      setError(err?.fieldErrors?.body ?? getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={send} className="space-y-2" noValidate>
      <Textarea
        label={label}
        rows={2}
        maxLength={maxLength}
        value={text}
        error={error}
        onChange={(e) => setText(e.target.value)}
      />
      <Button type="submit" size="sm" loading={isSending}>
        {submitLabel}
      </Button>
    </form>
  );
}
