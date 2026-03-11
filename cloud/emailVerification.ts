// Email verification cloud functions

const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

/**
 * Generates a random verification token
 * @returns Verification token string
 */
function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36);
}

/**
 * Cloud function to verify email using verification token
 * @param request - Parse Cloud Function request containing token
 * @returns Success message or throws error
 */
Parse.Cloud.define('verifyEmail', async (request) => {
  const { token } = request.params;

  if (!token) {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Verification token is required');
  }

  // Find user with this verification token
  const query = new Parse.Query(Parse.User);
  query.equalTo('emailVerificationToken', token);

  const user = await query.first({ useMasterKey: true });

  if (!user) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Invalid verification token');
  }

  // Check if token is expired
  const tokenCreatedAt = user.get('emailVerificationTokenCreatedAt');
  if (!tokenCreatedAt) {
    throw new Parse.Error(Parse.Error.OTHER_CAUSE, 'Token creation date not found');
  }

  const expiryDate = new Date(tokenCreatedAt);
  expiryDate.setHours(expiryDate.getHours() + VERIFICATION_TOKEN_EXPIRY_HOURS);

  if (new Date() > expiryDate) {
    throw new Parse.Error(Parse.Error.OTHER_CAUSE, 'Verification token has expired');
  }

  // Verify the email
  user.set('emailVerified', true);
  user.unset('emailVerificationToken');
  user.unset('emailVerificationTokenCreatedAt');

  await user.save(null, { useMasterKey: true });

  return {
    success: true,
    message: 'Email verified successfully',
    username: user.get('username')
  };
});

/**
 * Cloud function to resend verification email
 * @param request - Parse Cloud Function request containing email
 * @returns Success message or throws error
 */
Parse.Cloud.define('resendVerificationEmail', async (request) => {
  const { email } = request.params;

  if (!email) {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Email is required');
  }

  // Find user by email
  const query = new Parse.Query(Parse.User);
  query.equalTo('email', email);

  const user = await query.first({ useMasterKey: true });

  if (!user) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'User not found');
  }

  // Check if already verified
  if (user.get('emailVerified')) {
    throw new Parse.Error(Parse.Error.OTHER_CAUSE, 'Email is already verified');
  }

  // Generate new verification token
  const verificationToken = generateVerificationToken();

  user.set('emailVerificationToken', verificationToken);
  user.set('emailVerificationTokenCreatedAt', new Date());

  await user.save(null, { useMasterKey: true });

  // In a real application, you would send an email here
  // For testing purposes, we'll just return the token
  // @ts-expect-error req.log exists
  request.log.info(`Verification token for ${email}: ${verificationToken}`);

  return {
    success: true,
    message: 'Verification email sent successfully',
    // Note: In production, never return the token. This is for testing only.
    token: verificationToken
  };
});

/**
 * Helper function to generate and set verification token
 * Called from beforeSave hook
 * @param user - Parse User object
 */
export function setVerificationToken(user: Parse.User): void {
  const verificationToken = generateVerificationToken();
  user.set('emailVerificationToken', verificationToken);
  user.set('emailVerificationTokenCreatedAt', new Date());
  user.set('emailVerified', false);
}
