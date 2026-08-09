import '../entities/booking_entity.dart';

abstract class BookingRepository {
  Future<List<BookingEntity>> getTenantBookings();

  Future<BookingEntity> getBooking(String bookingId);

  Future<BookingEntity> createBooking({required String visitId, String? notes});

  Future<BookingEntity> cancelBooking(String bookingId);
}
