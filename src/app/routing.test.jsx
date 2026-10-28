import { screen, waitFor, within } from '@testing-library/react';

import { renderApp } from '@/test/utils';

const path = (router) => router.state.location.pathname;
const sidebar = () => screen.getAllByRole('navigation', { name: 'Main' })[0];

describe('routing and guards (phase 7 done-when)', () => {
  it('sends signed-out visitors to login with ?next=', async () => {
    const { router } = await renderApp('/account/orders', { as: 'anonymous' });
    await waitFor(() => expect(path(router)).toBe('/login'));
    expect(router.state.location.search).toBe('?next=%2Faccount%2Forders');
  });

  it('shows the vendor layout and menu to a vendor', async () => {
    const { router } = await renderApp('/vendor', { as: 'vendor@kjtfoodie.test' });
    await waitFor(() => expect(path(router)).toBe('/vendor'));
    const nav = await waitFor(sidebar);
    expect(within(nav).getByRole('link', { name: 'Live orders' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Menu' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument();
  });

  it('sends the wrong role to their own home', async () => {
    const { router } = await renderApp('/admin', { as: 'rider@kjtfoodie.test' });
    await waitFor(() => expect(path(router)).toBe('/rider'));
    expect(await screen.findByRole('switch', { name: 'Go online' })).toBeInTheDocument();
  });

  it('hides admin menu items without permission and shows 403 on the page', async () => {
    const { router } = await renderApp('/admin/payments', { as: 'support@kjtfoodie.test' });
    expect(await screen.findByText("You don't have access to this page")).toBeInTheDocument();
    expect(path(router)).toBe('/admin/payments');
    const nav = sidebar();
    expect(within(nav).queryByRole('link', { name: 'Payments' })).not.toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Support inbox' })).toBeInTheDocument();
  });

  it('lets a super admin see every admin page', async () => {
    await renderApp('/admin/payments', { as: 'super@kjtfoodie.test' });
    expect(await screen.findByRole('heading', { name: 'Payments' })).toBeInTheDocument();
    expect(within(sidebar()).getByRole('link', { name: 'Audit log' })).toBeInTheDocument();
  });

  it('sends an unapproved vendor to onboarding', async () => {
    const { router } = await renderApp('/vendor/menu', { as: 'new.vendor@kjtfoodie.test' });
    await waitFor(() => expect(path(router)).toBe('/vendor/onboarding'));
  });

  it('locks an expired vendor to the subscription page', async () => {
    const { router } = await renderApp('/vendor/menu', { as: 'expired.vendor@kjtfoodie.test' });
    await waitFor(() => expect(path(router)).toBe('/vendor/subscription'));
  });

  it('sends signed-in users away from login', async () => {
    const { router } = await renderApp('/login', { as: 'customer@kjtfoodie.test' });
    await waitFor(() => expect(path(router)).toBe('/'));
  });

  it('shows a 404 for unknown paths', async () => {
    await renderApp('/no-such-page', { as: 'anonymous' });
    expect(await screen.findByText("We couldn't find that page")).toBeInTheDocument();
  });
});
