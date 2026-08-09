import '../../../../core/network/api_client.dart';
import '../../domain/entities/payment_entity.dart';
import '../../domain/repositories/payment_repository.dart';
import '../models/payment_model.dart';

class PaymentRepositoryImpl implements PaymentRepository {
  PaymentRepositoryImpl({ApiClient? apiClient})
    : _apiClient = apiClient ?? ApiClient.shared;

  final ApiClient _apiClient;

  @override
  Future<PaymentEntity> createOrder({required String bookingId}) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/payments/order',
      data: {'bookingId': bookingId},
    );

    final responseData = response.data;

    if (responseData == null) {
      throw Exception('Empty payment order response.');
    }

    final data = responseData['data'];

    if (data is! Map<String, dynamic>) {
      throw Exception('Invalid payment order response.');
    }

    return PaymentModel.fromOrderResponse(data);
  }

  @override
  Future<PaymentEntity> verifyPayment({
    required String bookingId,
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
  }) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/payments/verify',
      data: {
        'bookingId': bookingId,
        'razorpayOrderId': razorpayOrderId,
        'razorpayPaymentId': razorpayPaymentId,
        'razorpaySignature': razorpaySignature,
      },
    );

    final responseData = response.data;

    if (responseData == null) {
      throw Exception('Empty payment verification response.');
    }

    final data = responseData['data'];

    if (data is! Map<String, dynamic>) {
      throw Exception('Invalid payment verification response.');
    }

    return PaymentModel.fromPaymentResponse(data);
  }

  @override
  Future<PaymentEntity> getPayment({required String paymentId}) async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      '/payments/$paymentId',
    );

    final responseData = response.data;

    if (responseData == null) {
      throw Exception('Empty payment response.');
    }

    final data = responseData['data'];

    if (data is! Map<String, dynamic>) {
      throw Exception('Invalid payment response.');
    }

    return PaymentModel.fromPaymentResponse(data);
  }
}
