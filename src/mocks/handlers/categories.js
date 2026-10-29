import { http } from 'msw';

import { db } from '../db';
import { applyListQuery, listResponse } from '../utils/list';
import { api } from '../utils/path';
import { chaos, latency } from '../utils/respond';

export const categoryHandlers = [
  http.get(api('/categories'), async ({ request }) => {
    await latency();
    const failure = chaos();
    if (failure) return failure;
    const params = new URL(request.url).searchParams;
    const rows = db.categories.map((c) => ({
      ...c,
      itemCount: db.foodItems.filter((f) => f.categoryId === c.id && !f.isHidden).length,
    }));
    return listResponse(
      applyListQuery(rows, params, { searchFields: ['name'], defaultSort: 'sortOrder' }),
    );
  }),
];
