import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { db, persist } from '@/mocks/db';
import { renderApp } from '@/test/utils';

const NEW_VENDOR = 'new.vendor@kjtfoodie.test';
const path = (router) => router.state.location.pathname;
const vendor = () => db.vendors.find((v) => v.id === 'ven_new');
const next = () => userEvent.click(screen.getByRole('button', { name: 'Continue' }));

describe('vendor onboarding (phase 12 done-when)', () => {
  it('onboards a new vendor, waits for approval and starts a free trial', async () => {
    const { router } = await renderApp('/vendor', { as: NEW_VENDOR });
    expect(
      await screen.findByRole('heading', { name: 'Set up your store' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(path(router)).toBe('/vendor/onboarding');

    // 1. Vendor type
    await next();
    expect(await screen.findByText('Pick what kind of vendor you are')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: /Home cook/ }));
    await next();

    // 2. Business details
    const name = await screen.findByLabelText('Business name');
    await userEvent.clear(name);
    await userEvent.type(name, "Tolu's Pot Yaba");
    await next();

    // 3. Location: picking the city drops a pin at its centre; then the delivery radius
    await screen.findByRole('heading', { name: 'Where do riders pick up your food?' });
    await next();
    expect(await screen.findByText('Enter the street address')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Street address'), '4 Herbert Macaulay Way');
    await userEvent.type(screen.getByLabelText('Area'), 'Yaba');
    await userEvent.selectOptions(screen.getByLabelText('City'), 'Lagos');
    await userEvent.selectOptions(screen.getByLabelText('Delivery radius'), '10');
    await next();

    // 4. Documents: a home cook only needs a government ID
    await screen.findByRole('heading', { name: 'Upload your documents' });
    await next();
    expect(await screen.findByText('Upload your Government ID')).toBeInTheDocument();
    await userEvent.upload(
      screen.getByLabelText(/^Government ID/),
      new File(['id'], 'nin.png', { type: 'image/png' }),
    );
    expect(await screen.findByRole('img', { name: 'Government ID 1' })).toBeInTheDocument();
    await next();

    // 5. Bank account: the account name is looked up before Continue unlocks
    await screen.findByRole('heading', { name: 'Where should we send your money?' });
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    await userEvent.selectOptions(screen.getByLabelText('Bank'), 'Guaranty Trust Bank');
    await userEvent.type(screen.getByLabelText('Account number'), '0123450000');
    expect(await screen.findByText(/couldn't find that account/)).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Account number'));
    await userEvent.type(screen.getByLabelText('Account number'), '0123456789');
    expect(await screen.findByText('TOLU OGUNLEYE')).toBeInTheDocument();
    await next();

    // 6. Review and submit
    await screen.findByRole('heading', { name: 'Check your details' });
    expect(screen.getByText("Tolu's Pot Yaba")).toBeInTheDocument();
    expect(
      screen.getByText(/^Delivers within 10 km · usually ready in \d+ min$/),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Submit for review' }));
    expect(
      await screen.findByRole('heading', { name: "We're checking your documents" }),
    ).toBeInTheDocument();
    expect(path(router)).toBe('/vendor/status');
    expect(vendor()).toMatchObject({
      approvalStatus: 'pending',
      type: 'home_cook',
      deliveryRadiusKm: 10,
      bank: expect.objectContaining({ accountName: 'TOLU OGUNLEYE', verified: true }),
    });

    // Pending vendors can't open the dashboard yet
    router.navigate('/vendor/plans');
    await waitFor(() => expect(path(router)).toBe('/vendor/status'));

    // An admin approves the store (phase 15 builds that screen)
    vendor().approvalStatus = 'approved';
    vendor().approvedAt = new Date().toISOString();
    persist();
    await userEvent.click(screen.getByRole('button', { name: 'Check again' }));
    await userEvent.click(await screen.findByRole('link', { name: 'Pick a plan to go live' }));

    // Plans: monthly / yearly toggle and the free trial
    expect(await screen.findByRole('heading', { name: 'Choose your plan' })).toBeInTheDocument();
    const pro = screen.getByRole('article', { name: 'Pro' });
    expect(within(pro).getByText('₦12,000')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: /^Yearly/ }));
    expect(within(pro).getByText('₦122,400')).toBeInTheDocument();
    await userEvent.click(within(pro).getByRole('button', { name: 'Start 14-day free trial' }));

    await waitFor(() => expect(path(router)).toBe('/vendor'));
    expect(vendor()).toMatchObject({
      subscriptionStatus: 'trial',
      planId: 'plan_pro',
      trialUsed: true,
    });
  });

  it('shows the rejection reason and lets the vendor resubmit', async () => {
    const v = vendor();
    Object.assign(v, {
      approvalStatus: 'rejected',
      rejectionReason: 'Your ID photo is blurry. Upload a clearer one.',
      onboardingStep: 'submitted',
      type: 'home_cook',
      address: { line1: '4 Herbert Macaulay Way', area: 'Yaba', city: 'Lagos', state: 'Lagos' },
      lat: 6.5,
      lng: 3.37,
      bank: {
        bankCode: '058',
        bankName: 'Guaranty Trust Bank',
        accountNumber: '0123456789',
        accountName: 'TOLU OGUNLEYE',
        verified: true,
      },
      documents: [
        {
          id: 'doc_x',
          type: 'government_id',
          label: 'Government ID',
          url: 'data:image/png;base64,AA',
          uploadedAt: new Date().toISOString(),
        },
      ],
    });
    persist();
    const { router } = await renderApp('/vendor/status', { as: NEW_VENDOR });
    expect(await screen.findByText(v.rejectionReason, {}, { timeout: 5000 })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Fix and resubmit' }));
    expect(await screen.findByRole('heading', { name: 'Check your details' })).toBeInTheDocument();
    expect(screen.getByText(v.rejectionReason)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Submit for review' }));
    await waitFor(() => expect(path(router)).toBe('/vendor/status'));
    expect(v.approvalStatus).toBe('pending');
  });
});
