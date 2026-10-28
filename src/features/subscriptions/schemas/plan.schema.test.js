import { planSchema, toPlanBody, toPlanForm } from './plan.schema';

describe('plan schema', () => {
  it('round-trips a plan through the form', () => {
    const plan = {
      name: 'Pro',
      monthlyPrice: 1200000,
      limits: { menuItems: null, photosPerItem: 3, staff: 3 },
      featured: 'occasional',
      analytics: 'full',
      isPopular: true,
      isRetired: false,
    };
    const values = planSchema.parse(toPlanForm(plan));
    expect(toPlanBody(values)).toEqual(plan);
  });

  it('needs an item limit unless unlimited is ticked', () => {
    const result = planSchema.safeParse({
      ...toPlanForm(null),
      name: 'Starter',
      monthlyPrice: '3000',
      menuItems: '',
    });
    expect(result.error.issues.map((i) => i.message)).toContain('At least 1, or tick unlimited');
  });
});
