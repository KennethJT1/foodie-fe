export const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  RIDER: 'rider',
  ADMIN: 'admin',
});

/** Admin sub-roles (BRD section 3). Each maps to a set of permissions. */
export const ADMIN_ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  SUPPORT: 'support',
  FINANCE: 'finance',
  DISPATCH: 'dispatch',
  ONBOARDING: 'onboarding',
});

export const ADMIN_ROLE_LABELS = {
  [ADMIN_ROLES.SUPER_ADMIN]: 'Super admin',
  [ADMIN_ROLES.SUPPORT]: 'Support',
  [ADMIN_ROLES.FINANCE]: 'Finance',
  [ADMIN_ROLES.DISPATCH]: 'Dispatch',
  [ADMIN_ROLES.ONBOARDING]: 'Onboarding',
};

/** Where each role lands after login, and where RequireRole sends the wrong role. */
export const ROLE_HOME = {
  [ROLES.CUSTOMER]: '/',
  [ROLES.VENDOR]: '/vendor',
  [ROLES.RIDER]: '/rider',
  [ROLES.ADMIN]: '/admin',
};

export const getRoleHome = (user) => (user ? (ROLE_HOME[user.role] ?? '/') : '/');
