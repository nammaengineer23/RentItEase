import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/repositories/payment_repository_impl.dart';
import '../domain/entities/payment_entity.dart';
import '../domain/repositories/payment_repository.dart';

final paymentRepositoryProvider = Provider<PaymentRepository>((ref) {
  return PaymentRepositoryImpl();
});

final paymentOrderProvider = FutureProvider.autoDispose
    .family<PaymentEntity, String>((ref, bookingId) async {
      final repository = ref.read(paymentRepositoryProvider);

      return repository.createOrder(bookingId: bookingId);
    });
