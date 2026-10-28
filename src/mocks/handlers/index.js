import { categoryHandlers } from './categories';
import { healthHandlers } from './health';

/** One file per feature; each phase adds its handlers here. */
export const handlers = [...healthHandlers, ...categoryHandlers];
