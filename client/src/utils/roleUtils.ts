import type { AuthUser } from "@/types";

export function isUserAdmin(user: AuthUser | null): boolean {
  if (!user) return false;
  
  // Check if user has admin role (role_id 1 is typically admin)
  return user.role_id === 1;
}

export function hasEditPermissions(user: AuthUser | null): boolean {
  return isUserAdmin(user);
}

export function hasDeletePermissions(user: AuthUser | null): boolean {
  return isUserAdmin(user);
}