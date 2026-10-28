import { authHandlers } from './auth';
import { categoryHandlers } from './categories';
import { devHandlers } from './dev';
import { healthHandlers } from './health';
import { notificationHandlers } from './notifications';

/** One file per feature; each phase adds its handlers here. */
export const handlers = [
  ...healthHandlers,
  ...authHandlers,
  ...categoryHandlers,
  ...notificationHandlers,
  ...devHandlers,
];
