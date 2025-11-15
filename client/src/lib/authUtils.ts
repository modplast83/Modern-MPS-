/**
 * Helper utilities for authentication error handling
 * Based on Replit Auth integration blueprint
 */

/**
 * Checks if an error is an unauthorized (401) error
 * Used to detect when user needs to re-authenticate
 * 
 * @param error - The error to check
 * @returns true if the error is a 401 Unauthorized error
 */
export function isUnauthorizedError(error: Error): boolean {
  // Check for 401 status in error message
  if (/^401: .*Unauthorized/.test(error.message)) {
    return true;
  }
  
  // Check for direct "Unauthorized" message
  if (error.message === "Unauthorized") {
    return true;
  }
  
  // Check for status property on error object
  if ((error as any).status === 401) {
    return true;
  }
  
  return false;
}
