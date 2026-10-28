import { selectCartCount, selectCartSubtotal, useCartStore } from './cart-store';

const mamaPut = { id: 'v1', name: 'Mama Put Kitchen', slug: 'mama-put' };
const sukaSpot = { id: 'v2', name: 'Suya Spot', slug: 'suya-spot' };
const jollof = { foodItemId: 'f1', name: 'Jollof rice', unitPrice: 250000, options: [] };
const chicken = {
  groupId: 'g1',
  groupName: 'Protein',
  optionId: 'o1',
  name: 'Chicken',
  price: 100000,
};

describe('cart store', () => {
  beforeEach(() => useCartStore.getState().clear());

  it('adds items and merges identical lines', () => {
    const { addItem } = useCartStore.getState();
    addItem(mamaPut, jollof);
    addItem(mamaPut, jollof);
    const state = useCartStore.getState();
    expect(state.lines).toHaveLength(1);
    expect(selectCartCount(state)).toBe(2);
    expect(selectCartSubtotal(state)).toBe(500000);
  });

  it('keeps lines with different options apart and prices options in', () => {
    const { addItem } = useCartStore.getState();
    addItem(mamaPut, jollof);
    addItem(mamaPut, { ...jollof, options: [chicken] });
    const state = useCartStore.getState();
    expect(state.lines).toHaveLength(2);
    expect(selectCartSubtotal(state)).toBe(600000);
  });

  it('refuses items from a second vendor until the cart is replaced', () => {
    const { addItem, replaceWith } = useCartStore.getState();
    addItem(mamaPut, jollof);
    const result = addItem(sukaSpot, { ...jollof, foodItemId: 'f9' });
    expect(result).toEqual({ conflict: true, currentVendor: mamaPut });
    expect(useCartStore.getState().vendor).toEqual(mamaPut);

    replaceWith(sukaSpot, { ...jollof, foodItemId: 'f9' });
    expect(useCartStore.getState().vendor).toEqual(sukaSpot);
    expect(useCartStore.getState().lines).toHaveLength(1);
  });

  it('clears the vendor when the last line goes', () => {
    const { addItem } = useCartStore.getState();
    addItem(mamaPut, jollof);
    const { key } = useCartStore.getState().lines[0];
    useCartStore.getState().setQuantity(key, 0);
    expect(useCartStore.getState()).toMatchObject({ vendor: null, lines: [] });
  });
});
