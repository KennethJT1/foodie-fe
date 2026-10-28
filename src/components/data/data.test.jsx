import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DevFormPage from '@/pages/dev/DevFormPage';
import DevTablePage from '@/pages/dev/DevTablePage';
import { renderWithProviders } from '@/test/utils';

import { Pagination } from './Pagination';
import { StatCard } from './StatCard';
import { Timeline } from './Timeline';

describe('Pagination', () => {
  it('shows the range and moves pages', async () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        meta={{ page: 2, limit: 20, total: 95, totalPages: 5 }}
        onPageChange={onPageChange}
      />,
    );
    expect(screen.getByText('Showing 21–40 of 95')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
  });
});

describe('StatCard and Timeline', () => {
  it('shows a KPI with change', () => {
    render(<StatCard label="Orders today" value="128" change={12.5} />);
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText(/\+12\.5%/)).toBeInTheDocument();
  });

  it('lists timeline steps in order', () => {
    render(
      <Timeline
        items={[
          { id: 1, title: 'Paid', state: 'done' },
          { id: 2, title: 'Preparing', state: 'current' },
          { id: 3, title: 'Delivered', state: 'upcoming' },
        ]}
      />,
    );
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Paid',
      'Preparing',
      'Delivered',
    ]);
  });
});

describe('demo list on mocks (phase 6 done-when)', () => {
  it('filters, sorts and paginates through the URL', async () => {
    const { location } = renderWithProviders(<DevTablePage />, { route: '/dev/table' });
    const table = await screen.findByRole('table');
    await waitFor(() => expect(within(table).getAllByRole('row').length).toBeGreaterThan(5));

    await userEvent.selectOptions(screen.getByLabelText('Roles'), 'rider');
    await waitFor(() => expect(location().search).toContain('role=rider'));
    await waitFor(() => {
      const roles = within(table)
        .getAllByRole('row')
        .slice(1)
        .map((r) => r.cells[2].textContent);
      expect(roles.every((r) => r === 'rider')).toBe(true);
    });

    await userEvent.click(within(table).getByRole('button', { name: /name/i }));
    await waitFor(() => expect(location().search).toContain('sort=-name'));

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(location().search).toContain('page=2'));

    await userEvent.click(screen.getByRole('button', { name: 'Suspended' }));
    await waitFor(() => expect(location().search).toContain('status=suspended'));
    expect(location().search).not.toContain('page=2');
  });
});

describe('demo form on mocks (phase 6 done-when)', () => {
  it('shows server field errors from the mock API', async () => {
    renderWithProviders(<DevFormPage />, { route: '/dev/form' });
    await userEvent.type(screen.getByLabelText('Food name'), 'Party jollof');
    await userEvent.type(screen.getByLabelText('Email'), 'customer@kjtfoodie.test');
    await userEvent.type(screen.getByLabelText('Phone number'), '08031234567');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'cat-rice');
    await userEvent.type(screen.getByLabelText('Price'), '2500');
    await userEvent.upload(
      screen.getByLabelText('Photos'),
      new File(['x'], 'a.png', { type: 'image/png' }),
    );
    await screen.findByRole('img', { name: 'photo 1' });
    await userEvent.click(screen.getByLabelText('Digit 1 of 6'));
    await userEvent.paste('123456');
    await userEvent.click(screen.getByRole('button', { name: 'Save item' }));
    expect(
      await screen.findByText('That email is already registered. Log in instead?'),
    ).toBeInTheDocument();
    expect(screen.getByText('That price looks too high for one plate')).toBeInTheDocument();
  });
});
