import { settingsSchema, toSettingsBody, toSettingsForm } from './settings.schema';
import { previewDeliveryFee } from '../lib/delivery-fee';

const api = {
  deliveryBaseFee: 50000,
  deliveryPerKm: 15000,
  deliveryMaxFee: 300000,
  riderPayoutPct: 70,
  riderOfferTimeoutSec: 30,
  vendorAcceptTimeoutSec: 300,
  trialDays: 14,
  graceDays: 3,
  yearlyDiscountPct: 15,
  refundDeadlineHours: 48,
  refundMissedAction: 'escalate',
  serviceAreas: ['Lagos'],
  notificationTemplates: [
    { key: 'order_paid', channel: 'email', subject: 'Hi', body: 'Hello {{name}}' },
  ],
};

describe('settings form', () => {
  it('round-trips naira and minutes back to kobo and seconds', () => {
    const body = toSettingsBody(settingsSchema.parse(toSettingsForm(api)));
    expect(body).toMatchObject({
      deliveryBaseFee: 50000,
      deliveryMaxFee: 300000,
      vendorAcceptTimeoutSec: 300,
    });
  });

  it('keeps the maximum fee above the base fee', () => {
    const result = settingsSchema.safeParse({ ...toSettingsForm(api), deliveryMaxFee: '100' });
    expect(result.error.issues[0].message).toBe('The maximum fee must be at least the base fee');
  });

  it('previews the delivery fee with the same formula as the server', () => {
    expect(previewDeliveryFee({ base: 50000, perKm: 15000, max: 300000 }, 4.2)).toBe(125000);
    expect(previewDeliveryFee({ base: 50000, perKm: 15000, max: 300000 }, 40)).toBe(300000);
  });
});
