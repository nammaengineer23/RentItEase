const enableGoogleSignIn = bool.fromEnvironment(
  'ENABLE_GOOGLE_SIGN_IN',
  defaultValue: true,
);

const enablePhoneOtp = bool.fromEnvironment(
  'ENABLE_PHONE_OTP',
  defaultValue: true,
);

// OAuth 2.0 Web application client for the Firebase project. Android Google
// Sign-In uses this as the server client ID so the returned ID token has the
// audience Firebase Authentication expects.
const googleServerClientId = String.fromEnvironment(
  'GOOGLE_SERVER_CLIENT_ID',
  defaultValue:
      '276976121047-k6r7t78tnnf25clvjbnpsqfj5sfca7q7.apps.googleusercontent.com',
);
