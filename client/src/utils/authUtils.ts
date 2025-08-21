// Utility functions for authentication

/**
 * Get the authentication token from localStorage
 * @returns Authentication token or null if not found
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * Save the authentication token to localStorage
 * @param token JWT token to store
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

/**
 * Remove the authentication token from localStorage
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
};

/**
 * Check if the user is authenticated (has a token)
 * @returns boolean indicating if the user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};
