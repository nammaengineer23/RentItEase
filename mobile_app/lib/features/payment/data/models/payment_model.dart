import '../../domain/entities/payment_entity.dart';

class PaymentModel extends PaymentEntity {
  const PaymentModel({
    required super.paymentId,
    required super.bookingId,
    required super.razorpayOrderId,
    required super.amount,
    required super.amountInPaise,
    required super.currency,
    required super.status,
    super.keyId,
    super.customerName,
    super.customerEmail,
    super.customerPhone,
  });

  factory PaymentModel.fromOrderResponse(Map<String, dynamic> json) {
    return PaymentModel(
      paymentId: json['paymentId']?.toString() ?? '',
      bookingId: json['bookingId']?.toString() ?? '',
      razorpayOrderId: json['razorpayOrderId']?.toString() ?? '',
      amount: _toDouble(json['amount']),
      amountInPaise: _toInt(json['amountInPaise']),
      currency: json['currency']?.toString() ?? 'INR',
      status: json['status']?.toString() ?? 'CREATED',
      keyId: json['keyId']?.toString(),
      customerName: _nullableString(json['customer']?['name']),
      customerEmail: _nullableString(json['customer']?['email']),
      customerPhone: _nullableString(json['customer']?['phone']),
    );
  }

  factory PaymentModel.fromPaymentResponse(Map<String, dynamic> json) {
    return PaymentModel(
      paymentId: json['id']?.toString() ?? '',
      bookingId: json['bookingId']?.toString() ?? '',
      razorpayOrderId: json['razorpayOrderId']?.toString() ?? '',
      amount: _toDouble(json['amount']),
      amountInPaise: (_toDouble(json['amount']) * 100).round(),
      currency: json['currency']?.toString() ?? 'INR',
      status: json['status']?.toString() ?? 'CREATED',
    );
  }

  static double _toDouble(dynamic value) {
    if (value is num) {
      return value.toDouble();
    }

    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  static int _toInt(dynamic value) {
    if (value is int) {
      return value;
    }

    if (value is num) {
      return value.toInt();
    }

    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  static String? _nullableString(dynamic value) {
    final string = value?.toString();

    if (string == null || string.isEmpty) {
      return null;
    }

    return string;
  }
}
