import { authHandlers } from './auth';
import { catalogueHandlers } from './catalogue';
import { categoryHandlers } from './categories';
import { devHandlers } from './dev';
import { healthHandlers } from './health';
import { notificationHandlers } from './notifications';
import { socialHandlers } from './social';

/** One file per feature; each phase adds its handlers here. */
export const handlers = [
  ...healthHandlers,
  ...authHandlers,
  ...categoryHandlers,
  ...catalogueHandlers,
  ...socialHandlers,
  ...notificationHandlers,
  ...devHandlers,
];
