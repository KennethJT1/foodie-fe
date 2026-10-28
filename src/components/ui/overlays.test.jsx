import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { Button } from './Button';
import { Drawer } from './Drawer';
import { Dropdown } from './Dropdown';
import { Modal } from './Modal';
import { Tabs } from './Tabs';

function ModalDemo({ onClose = () => {} }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          onClose();
        }}
        title="Reject order"
        footer={<Button>Reject order</Button>}
      >
        <input aria-label="Reason" />
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('opens as a labelled dialog, traps focus and closes on Esc', async () => {
    render(<ModalDemo />);
    const opener = screen.getByRole('button', { name: 'Open' });
    await userEvent.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'Reject order' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByLabelText('Reason')).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Reject order' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByLabelText('Reason')).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('closes from the close button', async () => {
    const onClose = vi.fn();
    render(<ModalDemo onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('Drawer', () => {
  it('renders a dialog and closes on Esc', async () => {
    const onClose = vi.fn();
    render(
      <Drawer open onClose={onClose} title="Your cart">
        <button type="button">Checkout</button>
      </Drawer>,
    );
    expect(screen.getByRole('dialog', { name: 'Your cart' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});

describe('Dropdown', () => {
  it('opens, moves with arrows and runs the action', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <Dropdown
        trigger={(p) => (
          <button type="button" {...p}>
            Actions
          </button>
        )}
        items={[
          { label: 'Edit', onSelect: onEdit },
          'separator',
          { label: 'Delete', onSelect: onDelete, danger: true },
          { label: 'Hidden', hidden: true },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }));
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onDelete).toHaveBeenCalled();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

describe('Tabs', () => {
  it('switches with click and arrow keys', async () => {
    function T() {
      const [v, setV] = useState('new');
      return (
        <Tabs
          aria-label="Orders"
          value={v}
          onChange={setV}
          items={[
            { value: 'new', label: 'New', count: 2 },
            { value: 'preparing', label: 'Preparing' },
            { value: 'ready', label: 'Ready' },
          ]}
        />
      );
    }
    render(<T />);
    await userEvent.click(screen.getByRole('tab', { name: 'Preparing' }));
    expect(screen.getByRole('tab', { name: 'Preparing' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Ready' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Ready' })).toHaveFocus();
  });
});
