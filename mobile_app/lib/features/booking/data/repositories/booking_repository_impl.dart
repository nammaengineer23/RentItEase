import '../../domain/entities/booking_entity.dart';
import '../../domain/repositories/booking_repository.dart';

class BookingRepositoryImpl implements BookingRepository {
  @override
  Future<List<BookingEntity>> load() async {
    return [
      const BookingEntity('Track progress', 'Built for RentEase workflows.'),
    ];
  }
}
