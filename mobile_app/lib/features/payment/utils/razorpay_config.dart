/// Validates only the public Razorpay key identifier supplied by the backend.
///
/// The mobile app must never contain the Razorpay secret. Test/live key IDs are
/// safe to pass to the checkout SDK, while the secret remains server-side.
bool isValidRazorpayKeyId(String? keyId) {
  if (keyId == null || keyId.isEmpty) return false;
  return keyId.startsWith('rzp_test_') || keyId.startsWith('rzp_live_');
}
