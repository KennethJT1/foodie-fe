import {
  chosenOptions,
  defaultSelection,
  groupHint,
  priceWithOptions,
  selectionErrors,
  toggleOption,
} from './options';

const size = {
  id: 'size',
  name: 'Portion size',
  required: true,
  max: 1,
  options: [
    { id: 'reg', name: 'Regular', price: 0 },
    { id: 'lg', name: 'Large', price: 100000 },
  ],
};
const protein = {
  id: 'protein',
  name: 'Extra protein',
  required: false,
  max: 2,
  options: [
    { id: 'chk', name: 'Chicken', price: 100000 },
    { id: 'bf', name: 'Beef', price: 70000 },
    { id: 'egg', name: 'Boiled egg', price: 30000 },
  ],
};
const groups = [size, protein];

describe('food option rules', () => {
  it('pre-selects required single-choice groups', () => {
    expect(defaultSelection(groups)).toEqual({ size: ['reg'], protein: [] });
  });

  it('swaps single choices and keeps required groups filled', () => {
    let s = defaultSelection(groups);
    s = toggleOption(s, size, 'lg');
    expect(s.size).toEqual(['lg']);
    s = toggleOption(s, size, 'lg');
    expect(s.size).toEqual(['lg']);
  });

  it('stops at the group maximum', () => {
    let s = defaultSelection(groups);
    s = toggleOption(s, protein, 'chk');
    s = toggleOption(s, protein, 'bf');
    s = toggleOption(s, protein, 'egg');
    expect(s.protein).toEqual(['chk', 'bf']);
    s = toggleOption(s, protein, 'chk');
    expect(s.protein).toEqual(['bf']);
  });

  it('reports missing required choices', () => {
    expect(selectionErrors(groups, { size: [], protein: [] })).toEqual({
      size: 'Choose portion size',
    });
    expect(selectionErrors(groups, defaultSelection(groups))).toEqual({});
  });

  it('builds cart options and prices them in kobo', () => {
    const chosen = chosenOptions(groups, { size: ['lg'], protein: ['chk'] });
    expect(chosen).toEqual([
      { groupId: 'size', groupName: 'Portion size', optionId: 'lg', name: 'Large', price: 100000 },
      {
        groupId: 'protein',
        groupName: 'Extra protein',
        optionId: 'chk',
        name: 'Chicken',
        price: 100000,
      },
    ]);
    expect(priceWithOptions(250000, chosen)).toBe(450000);
  });

  it('describes each group', () => {
    expect(groupHint(size)).toBe('Choose 1 · Required');
    expect(groupHint(protein)).toBe('Choose up to 2 · Optional');
  });
});
