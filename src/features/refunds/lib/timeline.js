import { formatDateTime } from '@/lib/format';

import { REFUND_STEP_LABELS } from '../constants';

const ENDS_BADLY = ['rejected', 'disputed', 'escalated'];

/** Refund timeline → Timeline items (BR-REF-04: every step time-stamped). */
export function refundTimeline(refund) {
  const steps = refund.timeline ?? [];
  return steps.map((s, i) => {
    const last = i === steps.length - 1;
    let state = 'done';
    if (last && ENDS_BADLY.includes(s.status)) state = 'danger';
    else if (last && s.status !== 'confirmed') state = 'current';
    return {
      id: `${s.status}-${i}`,
      title: REFUND_STEP_LABELS[s.status] ?? s.status,
      description: s.note ?? undefined,
      time: formatDateTime(s.at),
      state,
    };
  });
}
