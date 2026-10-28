import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Avatar } from './Avatar';
import { Badge, StatusBadge } from './Badge';
import { Card } from './Card';
import { PriceTag } from './PriceTag';
import { Rating } from './Rating';
import { Tooltip } from './Tooltip';

describe('Badge', () => {
  it('shows a status from a meta map', () => {
    render(<StatusBadge status="paid" meta={{ paid: { label: 'Paid', tone: 'info' } }} />);
    expect(screen.getByText('Paid').className).toMatch(/text-blue-700/);
  });

  it('falls back to the raw status', () => {
    render(<StatusBadge status="weird" meta={{}} />);
    expect(screen.getByText('weird')).toBeInTheDocument();
  });

  it('applies tones', () => {
    render(<Badge tone="success">Delivered</Badge>);
    expect(screen.getByText('Delivered').className).toMatch(/secondary/);
  });
});

describe('Avatar', () => {
  it('falls back to initials', () => {
    render(<Avatar name="Ada Okafor" />);
    expect(screen.getByText('AO')).toBeInTheDocument();
  });

  it('shows the image with the name as alt text', () => {
    render(<Avatar src="/a.png" name="Ada Okafor" />);
    expect(screen.getByRole('img', { name: 'Ada Okafor' })).toBeInTheDocument();
  });
});

describe('Card', () => {
  it('renders header and footer', () => {
    render(
      <Card header="Today" footer="See all">
        Body
      </Card>,
    );
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('See all')).toBeInTheDocument();
  });
});

describe('PriceTag', () => {
  it('formats kobo as naira', () => {
    render(<PriceTag amount={850000} compareAt={1000000} />);
    expect(screen.getByText('₦8,500')).toBeInTheDocument();
    expect(screen.getByText('₦10,000')).toBeInTheDocument();
  });
});

describe('Rating', () => {
  it('reads out a read-only value', () => {
    render(<Rating value={4.3} readOnly count={12} />);
    expect(screen.getByText('4.3 out of 5')).toBeInTheDocument();
    expect(screen.getByText('(12)')).toBeInTheDocument();
  });

  it('lets a person pick stars', async () => {
    const onChange = vi.fn();
    render(<Rating onChange={onChange} label="Rate the vendor" />);
    await userEvent.click(screen.getByRole('radio', { name: '4 stars' }));
    expect(onChange).toHaveBeenCalledWith(4);
  });
});

describe('Tooltip', () => {
  it('shows on focus', async () => {
    render(
      <Tooltip content="Copied!">
        <button type="button">Copy</button>
      </Tooltip>,
    );
    await userEvent.tab();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Copied!');
  });
});
