class PaymentEntity {
  const PaymentEntity({
    required this.paymentId,
    required this.bookingId,
    required this.razorpayOrderId,
    required this.amount,
    required this.amountInPaise,
    required this.currency,
    required this.status,
    this.keyId,
    this.customerName,
    this.customerEmail,
    this.customerPhone,
  });

  final String paymentId;
  final String bookingId;
  final String razorpayOrderId;
  final double amount;
  final int amountInPaise;
  final String currency;
  final String status;
  final String? keyId;

  final String? customerName;
  final String? customerEmail;
  final String? customerPhone;
}
