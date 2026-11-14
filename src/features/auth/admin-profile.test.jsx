import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { api } from '@/lib/api-client';
import { renderApp } from '@/test/utils';

const SUPER = 'super@kjtfoodie.test';
const ONBOARDING = 'onboarding@kjtfoodie.test';

describe('admin own profile (super admin only)', () => {
  it('an onboarding admin sees no account details and is sent away from the profile page', async () => {
    const { router } = await renderApp('/admin/profile', { as: ONBOARDING });
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin'));
    const menu = await screen.findByRole('button', { name: 'Account menu' });
    expect(menu).not.toHaveTextContent(/onboarding/i);
    await userEvent.click(menu);
    expect(await screen.findByRole('menuitem', { name: 'Log out' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Profile' })).not.toBeInTheDocument();
    await expect(api.patch('/me', { firstName: 'Hacked' })).rejects.toMatchObject({ status: 403 });
  });

  it('a super admin opens their profile from the account menu', async () => {
    const { router } = await renderApp('/admin', { as: SUPER });
    const menu = await screen.findByRole('button', { name: 'Account menu' });
    expect(menu).toHaveTextContent(/super admin/i);
    await userEvent.click(menu);
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Profile' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/profile'));
    expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument();
  });
});
