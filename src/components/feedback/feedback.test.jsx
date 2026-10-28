import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { OfflineBanner } from './OfflineBanner';

describe('feedback components', () => {
  it('EmptyState shows a reason and next action', () => {
    render(
      <EmptyState
        title="No orders yet"
        message="Share your store link to get your first order."
        action={<button type="button">Copy link</button>}
      />,
    );
    expect(screen.getByRole('heading', { name: 'No orders yet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
  });

  it('ErrorState shows a friendly message and retries', async () => {
    const onRetry = vi.fn();
    render(<ErrorState error={{ response: { status: 500, data: {} } }} onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/on our side/);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('ConfirmDialog uses verb labels', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        onClose={() => {}}
        onConfirm={onConfirm}
        title="Reject order?"
        confirmLabel="Reject order"
        tone="danger"
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Reject order' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('OfflineBanner appears when the browser goes offline', () => {
    const spy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    render(<OfflineBanner />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    spy.mockReturnValue(false);
    act(() => window.dispatchEvent(new Event('offline')));
    expect(screen.getByRole('status')).toHaveTextContent(/You're offline/);
    spy.mockRestore();
  });
});
