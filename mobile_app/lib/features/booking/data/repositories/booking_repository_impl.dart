import '../../../../core/network/api_client.dart';
import '../../domain/entities/booking_entity.dart';
import '../../domain/repositories/booking_repository.dart';
import '../models/booking_model.dart';

class BookingRepositoryImpl implements BookingRepository {
  BookingRepositoryImpl({ApiClient? apiClient})
    : _apiClient = apiClient ?? ApiClient.shared;

  final ApiClient _apiClient;

  @override
  Future<List<BookingEntity>> getTenantBookings() async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      '/bookings/tenant',
    );

    final responseData = response.data;

    if (responseData == null) {
      throw Exception('Empty bookings response.');
    }

    final bookingsData = _extractList(responseData);

    return bookingsData
        .whereType<Map>()
        .map((json) => BookingModel.fromJson(Map<String, dynamic>.from(json)))
        .toList();
  }

  @override
  Future<BookingEntity> getBooking(String bookingId) async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      '/bookings/$bookingId',
    );

    final responseData = response.data;

    if (responseData == null) {
      throw Exception('Empty booking response.');
    }

    final data = _extractMap(responseData);

    if (data is! Map) {
      throw Exception('Invalid booking response.');
    }

    return BookingModel.fromJson(Map<String, dynamic>.from(data));
  }

  @override
  Future<BookingEntity> createBooking({
    required String visitId,
    String? notes,
  }) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/bookings',
      data: {
        'visitId': visitId,
        if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
      },
    );

    final responseData = response.data;

    if (responseData == null) {
      throw Exception('Empty booking creation response.');
    }

    final data = _extractMap(responseData);

    if (data is! Map) {
      throw Exception('Invalid booking creation response.');
    }

    return BookingModel.fromJson(Map<String, dynamic>.from(data));
  }

  @override
  Future<BookingEntity> cancelBooking(String bookingId) async {
    final response = await _apiClient.dio.patch<Map<String, dynamic>>(
      '/bookings/$bookingId/cancel',
    );

    final responseData = response.data;

    if (responseData == null) {
      throw Exception('Empty booking cancellation response.');
    }

    final data = _extractMap(responseData);

    if (data is! Map) {
      throw Exception('Invalid booking cancellation response.');
    }

    return BookingModel.fromJson(Map<String, dynamic>.from(data));
  }

  static List<dynamic> _extractList(dynamic response) {
    dynamic value = response;
    for (var depth = 0; depth < 5; depth++) {
      if (value is List) return value;
      if (value is! Map) break;
      if (value['bookings'] is List) return value['bookings'] as List;
      if (!value.containsKey('data')) break;
      value = value['data'];
    }
    return const [];
  }

  static dynamic _extractMap(dynamic response) {
    dynamic value = response;
    for (var depth = 0; depth < 5; depth++) {
      if (value is! Map) return value;
      if (value['booking'] is Map) return value['booking'];
      if (!value.containsKey('data') || value['data'] is! Map) return value;
      value = value['data'];
    }
    return value;
  }
}
