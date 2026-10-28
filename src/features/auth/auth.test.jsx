import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderApp } from '@/test/utils';

const path = (router) => router.state.location.pathname;

async function loginWithEmail(email, password = 'password123') {
  await userEvent.click(await screen.findByRole('tab', { name: 'Email' }));
  await userEvent.type(screen.getByLabelText('Email'), email);
  await userEvent.type(screen.getByLabelText('Password'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
}

async function enterOtp(code = '123456') {
  await userEvent.click(await screen.findByLabelText('Digit 1 of 6'));
  await userEvent.paste(code);
}

describe('authentication (phase 8 done-when)', () => {
  it('admin logs in with email and lands on the admin dashboard', async () => {
    const { router } = await renderApp('/login', { as: 'anonymous' });
    await loginWithEmail('super@kjtfoodie.test');
    await waitFor(() => expect(path(router)).toBe('/admin'));
  });

  it('shows a clear error for a wrong password', async () => {
    await renderApp('/login', { as: 'anonymous' });
    await loginWithEmail('super@kjtfoodie.test', 'wrong-password');
    expect(await screen.findByRole('alert')).toHaveTextContent('That email or password is wrong');
  });

  it('customer logs in with phone + OTP and returns to ?next', async () => {
    const { router } = await renderApp('/login?next=%2Faccount%2Forders', { as: 'anonymous' });
    await userEvent.type(await screen.findByLabelText('Phone number'), '0803 000 0001');
    await userEvent.click(screen.getByRole('button', { name: 'Send code' }));
    await waitFor(() => expect(path(router)).toBe('/verify'));
    expect(screen.getByText(/\+234 803 000 0001/)).toBeInTheDocument();
    await enterOtp();
    await waitFor(() => expect(path(router)).toBe('/account/orders'));
  });

  it('rejects a wrong OTP', async () => {
    await renderApp('/verify?phone=%2B2348030000001&purpose=login', { as: 'anonymous' });
    await enterOtp('999999');
    expect(await screen.findByText(/That code isn't right/)).toBeInTheDocument();
  });

  it.each([
    ['vendor', '/vendor/onboarding', '08061112222'],
    ['rider', '/rider/onboarding', '08061113333'],
    ['customer', '/', '08061114444'],
  ])('a new %s signs up, verifies and reaches their area', async (role, home, phone) => {
    const { router } = await renderApp(`/signup/${role}`, { as: 'anonymous' });
    await userEvent.type(await screen.findByLabelText('First name'), 'Ngozi');
    await userEvent.type(screen.getByLabelText('Last name'), 'Eze');
    await userEvent.type(screen.getByLabelText('Phone number'), phone);
    await userEvent.type(screen.getByLabelText(/^Email/), `ngozi.${role}@example.com`);
    await userEvent.type(screen.getByLabelText('Password'), 'jollof-2026');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'jollof-2026');
    await userEvent.click(screen.getByLabelText(/I agree/));
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(path(router)).toBe('/verify'));
    await enterOtp();
    await waitFor(() => expect(path(router)).toBe(home));
  });

  it('refuses a phone number that is already registered', async () => {
    await renderApp('/signup/customer', { as: 'anonymous' });
    await userEvent.type(await screen.findByLabelText('First name'), 'Ada');
    await userEvent.type(screen.getByLabelText('Last name'), 'Okafor');
    await userEvent.type(screen.getByLabelText('Phone number'), '08030000001');
    await userEvent.type(screen.getByLabelText('Password'), 'jollof-2026');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'jollof-2026');
    await userEvent.click(screen.getByLabelText(/I agree/));
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(
      await screen.findByText('That phone number is already registered. Log in instead?'),
    ).toBeInTheDocument();
  });

  it('resets a password with the emailed code', async () => {
    const { router } = await renderApp('/forgot-password', { as: 'anonymous' });
    await userEvent.type(
      await screen.findByLabelText('Email or phone number'),
      'rider@kjtfoodie.test',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Send reset code' }));
    await waitFor(() => expect(path(router)).toBe('/reset-password'));
    await enterOtp();
    await userEvent.type(screen.getByLabelText('New password'), 'new-password-1');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'new-password-1');
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }));
    await waitFor(() => expect(path(router)).toBe('/login'));
    await loginWithEmail('rider@kjtfoodie.test', 'new-password-1');
    await waitFor(() => expect(path(router)).toBe('/rider'));
  });
});
