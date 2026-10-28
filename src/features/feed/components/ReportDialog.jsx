import { useState } from 'react';

import { toast } from '@/components/feedback';
import { Button, Modal, RadioGroup } from '@/components/ui';

import { useReport } from '../hooks/useFeed';
import { REPORT_REASONS } from '../schemas/comment.schema';

/** Report a comment or a food post to the moderation queue (FR-SOC-04, FR-SOC-08). */
export function ReportDialog({ open, onClose, targetType, targetId, what = 'comment' }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const report = useReport();

  const close = () => {
    setReason('');
    setError(null);
    onClose();
  };

  const submit = () => {
    if (!reason) {
      setError('Pick a reason');
      return;
    }
    report.mutate(
      { targetType, targetId, reason },
      {
        onSuccess: () => {
          toast.success("Thanks for telling us. We'll review it.");
          close();
        },
        onError: (e) => toast.error(e),
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Report this ${what}`}
      description="Our team checks every report. The person won't know who reported them."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button variant="danger" loading={report.isPending} onClick={submit}>
            Send report
          </Button>
        </>
      }
    >
      <RadioGroup
        label="What's wrong?"
        options={REPORT_REASONS.map((r) => ({ value: r, label: r }))}
        value={reason}
        onChange={(v) => {
          setReason(v);
          setError(null);
        }}
        error={error}
      />
    </Modal>
  );
}
