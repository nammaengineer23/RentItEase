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

    final payload = responseData['data'] is Map
        ? Map<String, dynamic>.from(responseData['data'] as Map)
        : responseData;
    final bookingsData = payload['bookings'] ?? payload['data'];

    if (bookingsData is! List) {
      throw Exception('Invalid bookings response.');
    }

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

    final outerData = responseData['data'];
    final data = outerData is Map &&
            outerData['data'] is Map
        ? outerData['data']
        : outerData;

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

    final outerData = responseData['data'];
    final data = outerData is Map &&
            outerData['data'] is Map
        ? outerData['data']
        : outerData;

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

    final outerData = responseData['data'];
    final data = outerData is Map &&
            outerData['data'] is Map
        ? outerData['data']
        : outerData;

    if (data is! Map) {
      throw Exception('Invalid booking cancellation response.');
    }

    return BookingModel.fromJson(Map<String, dynamic>.from(data));
  }
}
