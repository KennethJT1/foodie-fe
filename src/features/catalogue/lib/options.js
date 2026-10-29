/**
 * Option groups on a food item (FR-FOOD-02): `{ id, name, required, max, options: [{ id, name, price }] }`.
 * A selection is `{ [groupId]: optionId[] }`.
 */

/** Pre-picks the first option of required single-choice groups (usually "Regular", ₦0). */
export function defaultSelection(groups = []) {
  const out = {};
  for (const g of groups)
    out[g.id] = g.required && g.max === 1 && g.options[0] ? [g.options[0].id] : [];
  return out;
}

/** Toggles an option, honouring `max`: single-choice groups swap, others stop at the limit. */
export function toggleOption(selection, group, optionId) {
  const current = selection[group.id] ?? [];
  if (group.max === 1) {
    const next = current[0] === optionId && !group.required ? [] : [optionId];
    return { ...selection, [group.id]: next };
  }
  if (current.includes(optionId))
    return { ...selection, [group.id]: current.filter((id) => id !== optionId) };
  if (group.max && current.length >= group.max) return selection;
  return { ...selection, [group.id]: [...current, optionId] };
}

/** `{ [groupId]: message }` for groups that break their rules; empty when valid. */
export function selectionErrors(groups = [], selection = {}) {
  const errors = {};
  for (const g of groups) {
    const count = (selection[g.id] ?? []).length;
    if (g.required && count === 0) errors[g.id] = `Choose ${g.name.toLowerCase()}`;
    else if (g.max && count > g.max)
      errors[g.id] = `Choose up to ${g.max} for ${g.name.toLowerCase()}`;
  }
  return errors;
}

/** Selection → the option lines stored in the cart and sent with the order. */
export function chosenOptions(groups = [], selection = {}) {
  return groups.flatMap((g) =>
    (selection[g.id] ?? [])
      .map((id) => g.options.find((o) => o.id === id))
      .filter(Boolean)
      .map((o) => ({
        groupId: g.id,
        groupName: g.name,
        optionId: o.id,
        name: o.name,
        price: o.price,
      })),
  );
}

/** Unit price in kobo with options added. */
export const priceWithOptions = (basePrice, options = []) =>
  basePrice + options.reduce((sum, o) => sum + o.price, 0);

/** "Choose 1", "Choose up to 3", plus "Required" when needed. */
export function groupHint(group) {
  const rule = group.max === 1 ? 'Choose 1' : group.max ? `Choose up to ${group.max}` : 'Optional';
  return group.required ? `${rule} · Required` : `${rule} · Optional`;
}
