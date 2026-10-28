import { menuItemSchema, toMenuBody, toMenuForm } from './menu-item.schema';

const valid = {
  ...toMenuForm(null),
  name: 'Party jollof rice',
  categoryId: 'cat-rice',
  price: '3500',
  photos: ['data:image/png;base64,AA'],
};

describe('menu item schema', () => {
  it('accepts a complete item', () => {
    expect(menuItemSchema(1).safeParse(valid).success).toBe(true);
  });

  it('keeps photos within the plan limit', () => {
    const result = menuItemSchema(1).safeParse({ ...valid, photos: ['a', 'b'] });
    expect(result.error.issues[0].message).toBe('Your plan allows 1 photo per item');
  });

  it('checks the serving hours when they are limited', () => {
    const result = menuItemSchema(3).safeParse({
      ...valid,
      limitHours: true,
      availableFrom: '14:00',
      availableTo: '09:00',
    });
    expect(result.error.issues[0].message).toBe('The end time must be after the start time');
  });

  it('sends kobo to the API and drops hours that are not limited', () => {
    const body = toMenuBody(
      menuItemSchema(1).parse({
        ...valid,
        availableFrom: '09:00',
        optionGroups: [
          {
            name: 'Protein',
            required: true,
            max: 1,
            options: [{ name: 'Chicken', price: '1500' }],
          },
        ],
      }),
    );
    expect(body.price).toBe(350000);
    expect(body.availableFrom).toBeNull();
    expect(body.optionGroups[0].options[0].price).toBe(150000);
  });

  it('turns an API item into form values', () => {
    expect(toMenuForm({ price: 250000, availableFrom: '08:00', optionGroups: [] })).toMatchObject({
      price: '2500',
      limitHours: true,
    });
  });
});
