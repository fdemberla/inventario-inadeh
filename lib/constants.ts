// lib/constants.ts
// Application-wide constants

/**
 * User role identifiers matching the Roles table in the database
 */
export const USER_ROLES = {
  ADMIN: 1,
  GENERAL: 2,
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * Role display names for UI
 */
export const ROLE_NAMES: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: "Administrador",
  [USER_ROLES.GENERAL]: "Usuario General",
};
