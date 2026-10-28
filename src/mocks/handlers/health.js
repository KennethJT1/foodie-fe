import { http } from 'msw';

import { api } from '../utils/path';
import { ok } from '../utils/respond';

export const healthHandlers = [
  http.get(api('/health'), () =>
    ok({ status: 'ok', mode: 'mock', time: new Date().toISOString() }),
  ),
];
