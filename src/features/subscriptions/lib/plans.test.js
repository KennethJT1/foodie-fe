import { daysUntil, planAction, planFeatures, yearlySaving } from './plans';

const basic = {
  id: 'plan_basic',
  name: 'Basic',
  monthlyPrice: 500000,
  yearlyPrice: 5100000,
  limits: { menuItems: 20, photosPerItem: 1, staff: 1 },
  featured: 'none',
  analytics: 'basic',
};
const pro = {
  id: 'plan_pro',
  name: 'Pro',
  monthlyPrice: 1200000,
  yearlyPrice: 12240000,
  limits: { menuItems: null, photosPerItem: 3, staff: 3 },
  featured: 'priority',
  analytics: 'export',
};

const mine = (status, sub = {}) => ({
  status,
  trialAvailable: false,
  trialDays: 14,
  subscription: { planId: 'plan_pro', interval: 'monthly', plan: pro, ...sub },
});

describe('planFeatures', () => {
  it('describes limits in plain words', () => {
    expect(planFeatures(basic)).toEqual([
      'Up to 20 menu items',
      '1 photo per item',
      '1 staff login',
      'Standard placement in search',
      'Basic sales reports',
    ]);
    expect(planFeatures(pro)[0]).toBe('Unlimited menu items');
    expect(planFeatures(pro)[2]).toBe('3 staff logins');
  });

  it('works out the yearly saving', () => {
    expect(yearlySaving(basic)).toBe(900000);
  });
});

describe('planAction', () => {
  it('offers the free trial to a new approved vendor', () => {
    expect(
      planAction(basic, 'monthly', { status: 'none', trialAvailable: true, trialDays: 14 }),
    ).toEqual({
      kind: 'trial',
      label: 'Start 14-day free trial',
    });
    expect(planAction(basic, 'monthly', { status: 'none', trialAvailable: false }).kind).toBe(
      'pay',
    );
  });

  it('marks the current plan, upgrades and downgrades for an active vendor', () => {
    expect(planAction(pro, 'monthly', mine('active')).kind).toBe('current');
    expect(planAction(pro, 'yearly', mine('active')).kind).toBe('upgrade');
    expect(planAction(basic, 'monthly', mine('active')).kind).toBe('downgrade');
    expect(
      planAction(
        basic,
        'monthly',
        mine('active', { scheduledChange: { planId: 'plan_basic', interval: 'monthly' } }),
      ).kind,
    ).toBe('scheduled');
  });

  it('asks an expired or trial vendor to pay', () => {
    expect(planAction(pro, 'monthly', mine('expired')).label).toBe('Renew Pro');
    expect(planAction(pro, 'monthly', mine('trial')).label).toBe('Pay for Pro');
    expect(planAction(basic, 'monthly', mine('grace')).label).toBe('Choose Basic');
  });
});

describe('daysUntil', () => {
  it('rounds up and never goes negative', () => {
    const now = Date.parse('2026-10-28T12:00:00Z');
    expect(daysUntil('2026-10-30T00:00:00Z', now)).toBe(2);
    expect(daysUntil('2026-10-01T00:00:00Z', now)).toBe(0);
  });
});
