import { hasPermission } from '@/constants/permissions';

/** Drops items the user lacks permission for, and sections left empty. */
export function filterNav(sections, user) {
  return sections
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => !i.permission || hasPermission(user, i.permission)),
    }))
    .filter((s) => s.items.length > 0);
}
