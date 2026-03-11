// User validation utilities

/**
 * Validates email format
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength
 * Requirements: minimum 8 characters, at least 1 uppercase letter, at least 1 number
 * @param password - Password to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validatePasswordStrength(password: string): { isValid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least 1 uppercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least 1 number' };
  }

  return { isValid: true };
}

/**
 * Checks if username is unique
 * @param username - Username to check
 * @param excludeUserId - Optional user ID to exclude from check (for updates)
 * @returns true if username is unique, false otherwise
 */
export async function isUsernameUnique(username: string, excludeUserId?: string): Promise<boolean> {
  const query = new Parse.Query(Parse.User);
  query.equalTo('username', username);

  if (excludeUserId) {
    query.notEqualTo('objectId', excludeUserId);
  }

  const count = await query.count({ useMasterKey: true });
  return count === 0;
}
