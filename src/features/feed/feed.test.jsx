import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';

import { api } from '@/lib/api-client';
import { db } from '@/mocks/db';
import { server } from '@/mocks/server';
import { api as mockPath } from '@/mocks/utils/path';
import { fail } from '@/mocks/utils/respond';
import { useCartStore } from '@/stores/cart-store';
import { renderApp } from '@/test/utils';

const ADA = 'customer@kjtfoodie.test';
const mamaPutItem = () =>
  db.foodItems.find((f) => f.vendorId === 'ven_mama_put' && f.isAvailable && !f.isHidden);

async function allFeedItems(params = {}) {
  const items = [];
  let cursor;
  do {
    const res = await api.get('/feed', { params: { ...params, cursor, limit: 50 } });
    items.push(...res.data.data);
    cursor = res.data.meta.nextCursor;
  } while (cursor);
  return items;
}

describe('discovery and social API (phase 9)', () => {
  it('never shows hidden vendors or hidden items', async () => {
    const hidden = db.foodItems.find((f) => f.vendorId === 'ven_mama_put');
    hidden.isHidden = true;
    const items = await allFeedItems({ tab: 'newest' });
    const vendors = new Map(db.vendors.map((v) => [v.id, v]));
    expect(items.length).toBeGreaterThan(50);
    for (const item of items) {
      const v = vendors.get(item.vendorId);
      expect(v.approvalStatus).toBe('approved');
      expect(['expired', 'none']).not.toContain(v.subscriptionStatus);
    }
    expect(items.some((i) => i.id === hidden.id)).toBe(false);
    await expect(api.get('/vendors/chidi-grills')).rejects.toMatchObject({ status: 404 });
    await expect(api.get(`/food-items/${hidden.id}`)).rejects.toMatchObject({ status: 404 });
  });

  it('filters search by category, price and distance', async () => {
    const res = await api.get('/food-items', {
      params: { categoryId: 'cat-rice', maxPrice: 400000, maxDistanceKm: 10, limit: 100 },
    });
    expect(res.data.data.length).toBeGreaterThan(0);
    for (const item of res.data.data) {
      expect(item.categoryId).toBe('cat-rice');
      expect(item.price).toBeLessThanOrEqual(400000);
      expect(item.distanceM).toBeLessThanOrEqual(10000);
      expect(typeof item.vendor.isOpen).toBe('boolean');
    }
  });

  it('sorts the nearby tab by distance', async () => {
    const res = await api.get('/feed', { params: { tab: 'nearby', limit: 30 } });
    const km = res.data.data.map((i) => Math.floor(i.distanceM / 1000));
    expect(km).toEqual([...km].sort((a, b) => a - b));
  });
});

describe('discovery and social screens (phase 9 done-when)', () => {
  it('shows food near the customer and switches tabs and categories', async () => {
    await renderApp('/', { as: ADA });
    expect(await screen.findByRole('status', { name: 'Loading food' })).toBeInTheDocument();
    expect(await screen.findAllByRole('article')).toHaveLength(10);
    await userEvent.click(screen.getByRole('tab', { name: 'Popular' }));
    await userEvent.click(await screen.findByRole('button', { name: /^Rice dishes/ }));
    expect(screen.getByRole('button', { name: /^Rice dishes/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await waitFor(() => expect(screen.getAllByRole('article').length).toBeGreaterThan(0));
  });

  it('shows an error with retry when the feed fails', async () => {
    server.use(http.get(mockPath('/feed'), () => fail(500)));
    await renderApp('/', { as: 'anonymous' });
    expect(await screen.findByText("We couldn't load this")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('likes a post straight away (optimistic) and saves it', async () => {
    await renderApp('/?tab=newest', { as: ADA });
    const [first] = await screen.findAllByRole('article');
    const like = within(first).getByRole('button', { name: /^Like / });
    const wasLiked = like.getAttribute('aria-pressed') === 'true';
    await userEvent.click(like);
    expect(like).toHaveAttribute('aria-pressed', String(!wasLiked));
    const href = within(first)
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
      .find((h) => h.startsWith('/food/'));
    const item = db.foodItems.find((f) => f.id === href.split('/')[2].split('#')[0]);
    await waitFor(() =>
      expect(
        db.likes.some((l) => l.userId === 'usr_customer_ada' && l.foodItemId === item.id),
      ).toBe(!wasLiked),
    );
  });

  it('sends signed-out visitors to log in before liking', async () => {
    const { router } = await renderApp('/', { as: 'anonymous' });
    const [first] = await screen.findAllByRole('article');
    await userEvent.click(within(first).getByRole('button', { name: /^Like / }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });

  it('comments, edits with "Edited" and reports a comment', async () => {
    const item = db.foodItems.find(
      (f) =>
        f.vendorId === 'ven_mama_put' &&
        db.comments.some((c) => c.foodItemId === f.id && !c.parentId && !c.isVendorReply),
    );
    await renderApp(`/food/${item.id}`, { as: ADA });
    await userEvent.type(await screen.findByLabelText('Add a comment'), 'Best jollof in Yaba');
    await userEvent.click(screen.getByRole('button', { name: 'Post comment' }));
    const mine = await screen.findByRole('article', { name: 'Comment by Ada Okafor' });
    expect(within(mine).getByText('Best jollof in Yaba')).toBeInTheDocument();

    await userEvent.click(within(mine).getByRole('button', { name: 'Comment actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    const box = within(mine).getByLabelText('Edit your comment');
    await userEvent.clear(box);
    await userEvent.type(box, 'Best jollof in Lagos');
    await userEvent.click(within(mine).getByRole('button', { name: 'Save' }));
    expect(await within(mine).findByText('Best jollof in Lagos')).toBeInTheDocument();
    expect(within(mine).getByText('Edited')).toBeInTheDocument();

    const others = screen
      .getAllByRole('article')
      .filter((a) => a !== mine && a.getAttribute('aria-label').startsWith('Comment by'));
    await userEvent.click(within(others[0]).getByRole('button', { name: 'Comment actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Report' }));
    await userEvent.click(await screen.findByLabelText('Spam'));
    await userEvent.click(screen.getByRole('button', { name: 'Send report' }));
    await waitFor(() =>
      expect(
        db.reports.some((r) => r.reporterId === 'usr_customer_ada' && r.reason === 'Spam'),
      ).toBe(true),
    );
  });

  it('lets the vendor reply to a comment on their dish', async () => {
    const item = db.foodItems.find(
      (f) =>
        f.vendorId === 'ven_mama_put' &&
        db.comments.some((c) => c.foodItemId === f.id && !c.parentId && !c.removed),
    );
    await renderApp(`/food/${item.id}`, { as: 'vendor@kjtfoodie.test' });
    const [reply] = await screen.findAllByRole('button', { name: 'Reply' });
    await userEvent.click(reply);
    await userEvent.type(screen.getByLabelText(/^Reply to/), 'Thank you, come again!');
    await userEvent.click(screen.getByRole('button', { name: 'Post reply' }));
    const posted = await screen.findByText('Thank you, come again!');
    expect(within(posted.closest('article')).getByText('Vendor')).toBeInTheDocument();
  });

  it('follows a vendor from the storefront and lists them under Following', async () => {
    db.follows = db.follows.filter((f) => f.userId !== 'usr_customer_ada');
    const { router } = await renderApp('/v/mama-put-kitchen', { as: ADA });
    expect(
      await screen.findByRole('heading', { name: 'Mama Put Kitchen', level: 1 }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /All offers from/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Follow' }));
    expect(await screen.findByRole('button', { name: 'Following' })).toBeInTheDocument();
    await router.navigate('/account/following');
    expect(await screen.findByRole('link', { name: 'Mama Put Kitchen' })).toBeInTheDocument();
  });

  it('shows an empty state when the customer follows nobody', async () => {
    db.follows = db.follows.filter((f) => f.userId !== 'usr_customer_ada');
    await renderApp('/account/following', { as: ADA });
    expect(await screen.findByText("You're not following anyone yet")).toBeInTheDocument();
  });

  it('lists liked food under /account/liked', async () => {
    await renderApp('/account/liked', { as: ADA });
    expect(await screen.findByRole('heading', { name: 'Liked food' })).toBeInTheDocument();
    expect((await screen.findAllByRole('button', { name: /^Like / })).length).toBeGreaterThan(0);
  });

  it('searches food and shows an empty state with no match', async () => {
    const { router } = await renderApp('/search?search=jollof', { as: 'anonymous' });
    expect((await screen.findAllByText(/jollof/i)).length).toBeGreaterThan(0);
    await router.navigate('/search?search=zzzzqqq');
    expect(await screen.findByText('No dishes match that')).toBeInTheDocument();
  });

  it('asks "Start a new cart?" when adding food from a second vendor', async () => {
    const first = mamaPutItem();
    const other = db.foodItems.find(
      (f) =>
        f.vendorId !== 'ven_mama_put' &&
        f.isAvailable &&
        db.vendors.find((v) => v.id === f.vendorId)?.subscriptionStatus === 'active',
    );
    const { router } = await renderApp(`/food/${first.id}`, { as: 'anonymous' });
    await userEvent.click(await screen.findByRole('button', { name: /^Add to cart/ }));
    expect(useCartStore.getState().vendor.id).toBe('ven_mama_put');

    await router.navigate(`/food/${other.id}`);
    await screen.findByRole('heading', { name: other.name, level: 1 });
    await userEvent.click(screen.getByRole('button', { name: /^Add to cart/ }));
    expect(await screen.findByRole('dialog', { name: 'Start a new cart?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Start new cart' }));
    expect(useCartStore.getState().vendor.id).toBe(other.vendorId);
    expect(useCartStore.getState().lines).toHaveLength(1);
  });
});
