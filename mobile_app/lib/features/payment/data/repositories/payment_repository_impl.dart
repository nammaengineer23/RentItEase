import '../../domain/entities/payment_entity.dart';
import '../../domain/repositories/payment_repository.dart';

class PaymentRepositoryImpl implements PaymentRepository {
  @override
  Future<List<PaymentEntity>> load() async {
    return [
      const PaymentEntity('Track progress', 'Built for RentEase workflows.'),
    ];
  }
}
