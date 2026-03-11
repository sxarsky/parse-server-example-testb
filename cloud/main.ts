// Import cloud functions
await Promise.all([
  import('./functions.js'),
  import('./emailVerification.js')
]);

// Import validators and helpers
import { isValidEmail, validatePasswordStrength, isUsernameUnique } from './validators.js';
import { setVerificationToken } from './emailVerification.js';

/**
 * beforeSave hook for User class
 * Validates email, password, username and sets verification token for new users
 */
Parse.Cloud.beforeSave(Parse.User, async (request) => {
  const user = request.object;
  const isNewUser = !user.existed();

  // Validate email format
  const email = user.get('email');
  if (email && !isValidEmail(email)) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'Invalid email format');
  }

  // Validate password strength (only on new users or password change)
  if (isNewUser || user.dirtyKeys().includes('password')) {
    const password = user.get('password');
    if (password) {
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new Parse.Error(Parse.Error.VALIDATION_ERROR, passwordValidation.error || 'Invalid password');
      }
    }
  }

  // Check username uniqueness
  const username = user.get('username');
  if (username && (isNewUser || user.dirtyKeys().includes('username'))) {
    const isUnique = await isUsernameUnique(username, user.id);
    if (!isUnique) {
      throw new Parse.Error(Parse.Error.USERNAME_TAKEN, 'Username is already taken');
    }
  }

  // Set verification token for new users
  if (isNewUser) {
    setVerificationToken(user);
    // @ts-expect-error req.log exists
    request.log.info(`New user registered: ${username}, verification required`);
  }
});

/**
 * beforeLogin hook to prevent unverified users from logging in
 */
Parse.Cloud.beforeLogin(async (request) => {
  const user = request.object;
  const emailVerified = user.get('emailVerified');

  if (emailVerified === false) {
    throw new Parse.Error(
      Parse.Error.EMAIL_NOT_FOUND,
      'Please verify your email address before logging in. Check your email for the verification link.'
    );
  }
});
