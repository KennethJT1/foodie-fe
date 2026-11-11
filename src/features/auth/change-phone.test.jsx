import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { db } from '@/mocks/db';
import { renderApp } from '@/test/utils';

const ADA = 'customer@kjtfoodie.test';
const ada = () => db.users.find((u) => u.email === ADA);

async function openChangePhone() {
  await renderApp('/account/profile', { as: ADA });
  await userEvent.click(await screen.findByRole('button', { name: /^(Change|Add phone)$/ }));
  return screen.findByRole('dialog');
}

describe('changing the phone number on the profile page', () => {
  it('sends a code to the new number and saves it once the code is right', async () => {
    const dialog = await openChangePhone();
    await userEvent.type(within(dialog).getByLabelText('New phone number'), '0809 111 2233');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send code' }));
    expect(await within(dialog).findByText(/\+234 809 111 2233/)).toBeInTheDocument();

    await userEvent.click(within(dialog).getByLabelText('Digit 1 of 6'));
    await userEvent.paste('123456');
    await waitFor(() => expect(ada().phone).toBe('+2348091112233'));
    expect(await screen.findByDisplayValue('+234 809 111 2233')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows the error for a wrong code and keeps the old number', async () => {
    const before = ada().phone;
    const dialog = await openChangePhone();
    await userEvent.type(within(dialog).getByLabelText('New phone number'), '0809 111 2233');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send code' }));
    await userEvent.click(await within(dialog).findByLabelText('Digit 1 of 6'));
    await userEvent.paste('000000');
    expect(await within(dialog).findByText(/isn't right/)).toBeInTheDocument();
    expect(ada().phone).toBe(before);
  });

  it("won't take a number another account uses", async () => {
    const other = db.users.find((u) => u.phone && u.email !== ADA);
    const dialog = await openChangePhone();
    await userEvent.type(
      within(dialog).getByLabelText('New phone number'),
      other.phone.replace('+234', '0'),
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send code' }));
    expect(
      (await within(dialog).findAllByText(/already used by another account/)).length,
    ).toBeGreaterThan(0);
  });
});
