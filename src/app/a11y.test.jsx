import { appendFileSync } from 'node:fs';

import { screen } from '@testing-library/react';

import { db } from '@/mocks/db';
import { axeViolations } from '@/test/axe';
import { renderApp } from '@/test/utils';

const ada = () =>
  db.orders.find((o) => o.customerId === 'usr_customer_ada' && o.status === 'picked_up');

/** One main screen per role; each must have no axe violations (contrast is checked in the browser). */
const SCREENS = [
  [
    'home feed',
    '/',
    'anonymous',
    { role: 'heading', name: /Feast Your Senses|food near you|Good food/i },
  ],
  ['log in', '/login', 'anonymous', { role: 'heading', name: 'Welcome back' }],
  ['customer orders', '/account/orders', 'customer@kjtfoodie.test', { role: 'table' }],
  [
    'order tracking',
    () => `/account/orders/${ada().id}`,
    'customer@kjtfoodie.test',
    { role: 'region', name: 'Live delivery map' },
  ],
  [
    'vendor live orders',
    '/vendor/orders',
    'vendor@kjtfoodie.test',
    { role: 'heading', name: 'Live orders' },
  ],
  [
    'vendor menu item form',
    '/vendor/menu/new',
    'vendor@kjtfoodie.test',
    { role: 'heading', name: 'Add new item' },
  ],
  [
    'vendor onboarding',
    '/vendor/onboarding',
    'new.vendor@kjtfoodie.test',
    { role: 'heading', name: 'Set up your store' },
  ],
  ['rider home', '/rider', 'rider@kjtfoodie.test', { role: 'switch', name: 'Go online' }],
  ['admin overview', '/admin', 'super@kjtfoodie.test', { role: 'heading', name: 'Overview' }],
  ['admin vendors', '/admin/vendors', 'super@kjtfoodie.test', { role: 'table' }],
  [
    'admin settings',
    '/admin/settings',
    'super@kjtfoodie.test',
    { role: 'button', name: 'Save settings' },
  ],
];

describe('accessibility (axe) on each role’s main screens', () => {
  it.each(SCREENS)('%s', async (name, route, as, ready) => {
    await renderApp(typeof route === 'function' ? route() : route, { as });
    await screen.findAllByRole(ready.role, ready.name ? { name: ready.name } : {}, {
      timeout: 8000,
    });
    const found = await axeViolations();
    if (found.length && process.env.AXE_OUT)
      appendFileSync(process.env.AXE_OUT, `${JSON.stringify({ screen: name, found }, null, 1)}\n`);
    expect(found).toEqual([]);
  });
});
