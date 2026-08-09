import '../entities/payment_entity.dart';

abstract class PaymentRepository {
  Future<PaymentEntity> createOrder({required String bookingId});

  Future<PaymentEntity> verifyPayment({
    required String bookingId,
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
  });

  Future<PaymentEntity> getPayment({required String paymentId});
}
