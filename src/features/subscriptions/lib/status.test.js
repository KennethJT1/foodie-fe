import { bannerFor, statusLine } from './status';

const NOW = Date.parse('2026-10-28T12:00:00Z');
const inDays = (n) => new Date(NOW + n * 86400000).toISOString();

describe('subscription status', () => {
  it('shows no banner for a healthy plan or a trial with weeks left', () => {
    expect(
      bannerFor({ status: 'active', subscription: { cancelAtPeriodEnd: false } }, NOW),
    ).toBeNull();
    expect(
      bannerFor({ status: 'trial', subscription: { trialEndsAt: inDays(12) } }, NOW),
    ).toBeNull();
    expect(bannerFor({ status: 'none', subscription: null }, NOW)).toBeNull();
  });

  it('warns when the trial ends soon, payment failed or the plan expired', () => {
    expect(
      bannerFor({ status: 'trial', subscription: { trialEndsAt: inDays(5) } }, NOW),
    ).toMatchObject({
      tone: 'info',
      cta: { to: '/vendor/plans' },
    });
    expect(bannerFor({ status: 'trial', subscription: { trialEndsAt: inDays(1) } }, NOW).tone).toBe(
      'warning',
    );
    expect(
      bannerFor({ status: 'grace', subscription: { graceEndsAt: inDays(2) } }, NOW).message,
    ).toMatch(/^We couldn't take your plan payment/);
    expect(bannerFor({ status: 'expired', subscription: {} }, NOW)).toMatchObject({
      tone: 'danger',
      cta: { label: 'Renew plan' },
    });
    expect(
      bannerFor(
        {
          status: 'active',
          subscription: { cancelAtPeriodEnd: true, currentPeriodEnd: inDays(3) },
        },
        NOW,
      ).cta.label,
    ).toBe('Keep my plan');
  });

  it('describes the plan in one sentence', () => {
    expect(statusLine({ status: 'none', subscription: null })).toBe("You don't have a plan yet.");
    expect(
      statusLine({ status: 'active', subscription: { currentPeriodEnd: '2026-11-14T10:00:00Z' } }),
    ).toBe('Renews on 14 Nov 2026.');
  });
});
