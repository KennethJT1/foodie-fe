import { patchFoodItem } from './patch-food-item';

const like = (item) => ({ ...item, isLiked: true, likesCount: item.likesCount + 1 });

describe('patchFoodItem', () => {
  const a = { id: 'a', likesCount: 1, isLiked: false };
  const b = { id: 'b', likesCount: 5, isLiked: false };

  it('patches a single item', () => {
    expect(patchFoodItem(a, 'a', like)).toEqual({ id: 'a', likesCount: 2, isLiked: true });
    expect(patchFoodItem(b, 'a', like)).toBe(b);
  });

  it('patches a list and keeps untouched lists as they are', () => {
    const list = { data: [a, b], meta: { total: 2 } };
    const out = patchFoodItem(list, 'b', like);
    expect(out.data[1]).toMatchObject({ likesCount: 6, isLiked: true });
    expect(out.data[0]).toBe(a);
    expect(patchFoodItem(list, 'zzz', like)).toBe(list);
  });

  it('patches infinite pages', () => {
    const pages = { pages: [{ data: [a] }, { data: [b] }], pageParams: [undefined, '1'] };
    const out = patchFoodItem(pages, 'b', like);
    expect(out.pages[0]).toBe(pages.pages[0]);
    expect(out.pages[1].data[0].likesCount).toBe(6);
    expect(out.pageParams).toBe(pages.pageParams);
  });

  it('ignores empty caches', () => {
    expect(patchFoodItem(undefined, 'a', like)).toBeUndefined();
  });
});
