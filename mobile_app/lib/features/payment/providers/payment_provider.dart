import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/entities/payment_entity.dart';
import '../domain/repositories/payment_repository.dart';
import '../data/repositories/payment_repository_impl.dart';

final _repositoryProvider = Provider<PaymentRepository>(
  (ref) => PaymentRepositoryImpl(),
);

final PaymentProvider = FutureProvider<List<PaymentEntity>>((ref) async {
  final repository = ref.read(_repositoryProvider);
  return repository.load();
});
