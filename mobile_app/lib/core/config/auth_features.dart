const enableGoogleSignIn = bool.fromEnvironment(
  'ENABLE_GOOGLE_SIGN_IN',
  defaultValue: true,
);

const enablePhoneOtp = bool.fromEnvironment(
  'ENABLE_PHONE_OTP',
  defaultValue: false,
);
