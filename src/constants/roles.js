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

export const isSuperAdmin = (user) =>
  user?.role === ROLES.ADMIN && user.adminRole === ADMIN_ROLES.SUPER_ADMIN;

/**
 * Whether the user may see and edit their own account details. Every role can, except admins
 * below super admin: their details are managed by a super admin (Admin users).
 */
export const canManageOwnAccount = (user) =>
  Boolean(user) && (user.role !== ROLES.ADMIN || isSuperAdmin(user));
