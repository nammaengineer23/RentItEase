import '../entities/booking_entity.dart';

abstract class BookingRepository {
  Future<List<BookingEntity>> getTenantBookings();

  Future<BookingEntity> getBooking(String bookingId);

  Future<BookingEntity> createBooking({required String visitId, String? notes});

  /// Moves an owner-approved booking into the tenant payment step.
  Future<BookingEntity> markPaymentPending(String bookingId);

  Future<BookingEntity> cancelBooking(String bookingId);
}
