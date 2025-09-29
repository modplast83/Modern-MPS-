import type { AuthUser } from "@/types";

// Security Note: Removed localStorage storage of user data to prevent XSS attacks
// User authentication is now managed entirely through secure HTTP-only session cookies
// Client-side authentication state is managed through session validation with the server

export function getStoredUser(): AuthUser | null {
  // Security improvement: No longer store sensitive user data in localStorage
  // Authentication state is maintained through secure server-side sessions only
  console.warn(
    "getStoredUser() is deprecated - use useAuth hook for authentication state",
  );
  return null;
}

export function storeUser(user: AuthUser): void {
  // Security improvement: No longer store user data in localStorage to prevent XSS
  console.warn(
    "storeUser() is deprecated - authentication is handled via secure sessions",
  );
}

export function clearStoredUser(): void {
  // Security improvement: No client-side storage to clear
  console.warn(
    "clearStoredUser() is deprecated - use logout through useAuth hook",
  );
}

export function isAuthenticated(): boolean {
  // Security improvement: Authentication state determined by server session only
  console.warn(
    "isAuthenticated() is deprecated - use useAuth hook for authentication state",
  );
  return false;
}
