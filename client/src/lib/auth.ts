import type { AuthUser } from "@/types";

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('mpbf_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mpbf_user', JSON.stringify(user));
}

export function clearStoredUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('mpbf_user');
}

export function isAuthenticated(): boolean {
  return getStoredUser() !== null;
}
