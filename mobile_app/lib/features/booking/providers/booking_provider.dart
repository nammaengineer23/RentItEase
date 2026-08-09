import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/repositories/booking_repository_impl.dart';
import '../domain/entities/booking_entity.dart';
import '../domain/repositories/booking_repository.dart';

final bookingRepositoryProvider = Provider<BookingRepository>((ref) {
  return BookingRepositoryImpl();
});

final tenantBookingsProvider = FutureProvider.autoDispose<List<BookingEntity>>((
  ref,
) async {
  final repository = ref.read(bookingRepositoryProvider);

  return repository.getTenantBookings();
});

final bookingProvider = tenantBookingsProvider;

final bookingByIdProvider = FutureProvider.autoDispose
    .family<BookingEntity, String>((ref, bookingId) async {
      final repository = ref.read(bookingRepositoryProvider);

      return repository.getBooking(bookingId);
    });

final createBookingProvider = Provider<CreateBookingController>((ref) {
  return CreateBookingController(ref);
});

class CreateBookingController {
  CreateBookingController(this._ref);

  final Ref _ref;

  Future<BookingEntity> create({required String visitId, String? notes}) async {
    final repository = _ref.read(bookingRepositoryProvider);

    final booking = await repository.createBooking(
      visitId: visitId,
      notes: notes,
    );

    _ref.invalidate(tenantBookingsProvider);

    return booking;
  }

  Future<BookingEntity> cancel(String bookingId) async {
    final repository = _ref.read(bookingRepositoryProvider);

    final booking = await repository.cancelBooking(bookingId);

    _ref.invalidate(tenantBookingsProvider);
    _ref.invalidate(bookingByIdProvider(bookingId));

    return booking;
  }
}
