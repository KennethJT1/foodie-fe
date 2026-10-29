import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Plus } from 'lucide-react';

import { Button } from './Button';
import { IconButton } from './IconButton';

describe('Button', () => {
  it('calls onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Add to cart</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled and busy while loading', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Place order
      </Button>,
    );
    const btn = screen.getByRole('button', { name: /place order/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('defaults to type="button" so it never submits forms by accident', () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('renders its child with asChild', () => {
    render(
      <Button asChild variant="outline">
        <a href="/menu">See menu</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'See menu' });
    expect(link).toHaveAttribute('href', '/menu');
    expect(link.className).toMatch(/border/);
  });

  it('merges className', () => {
    render(<Button className="mt-4">X</Button>);
    expect(screen.getByRole('button').className).toMatch(/mt-4/);
  });
});

describe('IconButton', () => {
  it('uses its label as the accessible name', () => {
    render(<IconButton icon={Plus} label="Add item" />);
    expect(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument();
  });
});
