import { addressHandlers } from './addresses';
import { authHandlers } from './auth';
import { catalogueHandlers } from './catalogue';
import { categoryHandlers } from './categories';
import { checkoutHandlers } from './checkout';
import { devHandlers } from './dev';
import { healthHandlers } from './health';
import { notificationHandlers } from './notifications';
import { onboardingHandlers } from './onboarding';
import { orderHandlers } from './orders';
import { refundHandlers } from './refunds';
import { reviewHandlers } from './reviews';
import { socialHandlers } from './social';
import { subscriptionHandlers } from './subscriptions';

/** One file per feature; each phase adds its handlers here. */
export const handlers = [
  ...healthHandlers,
  ...authHandlers,
  ...categoryHandlers,
  ...catalogueHandlers,
  ...socialHandlers,
  ...addressHandlers,
  ...checkoutHandlers,
  ...orderHandlers,
  ...reviewHandlers,
  ...refundHandlers,
  ...notificationHandlers,
  ...onboardingHandlers,
  ...subscriptionHandlers,
  ...devHandlers,
];
