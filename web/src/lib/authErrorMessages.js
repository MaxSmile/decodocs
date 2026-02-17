const AUTH_ERROR_MESSAGES = {
  'auth/account-exists-with-different-credential':
    'This email is already linked to another sign-in method. Use that method first, then link providers in Profile.',
  'auth/credential-already-in-use':
    'This credential is already attached to another account. Sign in to that account, then link providers in Profile.',
  'auth/email-already-in-use':
    'This email is already in use. Sign in instead, then link providers in Profile.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/invalid-credential': 'That sign-in attempt failed. Check your credentials and try again.',
  'auth/missing-password': 'Enter your password to continue.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase Auth yet.',
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Allow popups and try again.',
  'auth/popup-closed-by-user': 'Sign-in popup was closed before completion.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/user-not-found': 'No account exists for this email. Create an account first.',
  'auth/wrong-password': 'Incorrect password. Try again or reset your password.',
};

export const toAuthErrorMessage = (
  error,
  fallback = 'Authentication failed. Please try again.'
) => {
  const code = error?.code;
  if (typeof code === 'string' && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code];
  }

  if (error instanceof Error && typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

