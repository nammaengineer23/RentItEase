import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/payment/utils/razorpay_config.dart';

void main() {
  test('accepts server-provided test and live Razorpay public keys', () {
    expect(isValidRazorpayKeyId('rzp_test_example'), isTrue);
    expect(isValidRazorpayKeyId('rzp_live_example'), isTrue);
  });

  test('rejects missing, malformed, or secret-like values', () {
    expect(isValidRazorpayKeyId(null), isFalse);
    expect(isValidRazorpayKeyId(''), isFalse);
    expect(isValidRazorpayKeyId('example'), isFalse);
    expect(isValidRazorpayKeyId('rzp_secret_example'), isFalse);
  });
}
