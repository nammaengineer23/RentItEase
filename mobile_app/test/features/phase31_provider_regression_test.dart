import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/features/booking/domain/entities/booking_entity.dart';
import 'package:mobile_app/features/booking/domain/repositories/booking_repository.dart';
import 'package:mobile_app/features/booking/providers/booking_provider.dart';
import 'package:mobile_app/features/payment/domain/entities/payment_entity.dart';
import 'package:mobile_app/features/payment/domain/repositories/payment_repository.dart';
import 'package:mobile_app/features/payment/providers/payment_provider.dart';
import 'package:mobile_app/features/property_visits/domain/entities/property_visit.dart';
import 'package:mobile_app/features/property_visits/domain/repositories/property_visit_repository.dart';
import 'package:mobile_app/features/property_visits/providers/property_visit_provider.dart';
import 'package:mobile_app/features/notifications/models/notification_model.dart';
import 'package:mobile_app/features/notifications/providers/notifications_provider.dart';

class FakeBookingRepository implements BookingRepository {
  final List<BookingEntity> bookings = [];
  int createCalls = 0;
  int cancelCalls = 0;

  BookingEntity get _booking => BookingEntity(
        id: 'booking-1',
        propertyId: 'property-1',
        propertyTitle: 'Test home',
        location: 'Bengaluru',
        imageUrl: '',
        visitId: 'visit-1',
        visitDate: DateTime(2026, 10, 2),
        visitTime: '10:00',
        ownerId: 'owner-1',
        ownerName: 'Owner',
        ownerPhone: '9999999999',
        monthlyRent: 20000,
        securityDeposit: 40000,
        status: 'PENDING',
        bookingDate: DateTime(2026, 10, 1),
      );

  @override
  Future<List<BookingEntity>> getTenantBookings() async => bookings;

  @override
  Future<List<BookingEntity>> getOwnerBookings() async => bookings;

  @override
  Future<BookingEntity> getBooking(String bookingId) async => _booking;

  @override
  Future<BookingEntity> createBooking({required String visitId, String? notes}) async {
    createCalls++;
    final value = _booking;
    bookings.add(value);
    return value;
  }

  @override
  Future<BookingEntity> markPaymentPending(String bookingId) async => _booking;

  @override
  Future<BookingEntity> approveBooking(String bookingId) async => _booking;

  @override
  Future<BookingEntity> rejectBooking(String bookingId) async => _booking;

  @override
  Future<BookingEntity> cancelBooking(String bookingId) async {
    cancelCalls++;
    return _booking;
  }
}

class FakePaymentRepository implements PaymentRepository {
  @override
  Future<PaymentEntity> createOrder({required String bookingId}) async =>
      PaymentEntity(
        paymentId: 'payment-1',
        bookingId: bookingId,
        razorpayOrderId: 'order-1',
        amount: 60000,
        amountInPaise: 6000000,
        currency: 'INR',
        status: 'CREATED',
      );

  @override
  Future<PaymentEntity> verifyPayment({
    required String bookingId,
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
  }) async => PaymentEntity(
        paymentId: razorpayPaymentId,
        bookingId: bookingId,
        razorpayOrderId: razorpayOrderId,
        amount: 60000,
        amountInPaise: 6000000,
        currency: 'INR',
        status: 'PAID',
      );

  @override
  Future<PaymentEntity> getPayment({required String paymentId}) async =>
      PaymentEntity(
        paymentId: paymentId,
        bookingId: 'booking-1',
        razorpayOrderId: 'order-1',
        amount: 60000,
        amountInPaise: 6000000,
        currency: 'INR',
        status: 'PAID',
      );
}

class FakeVisitRepository implements PropertyVisitRepository {
  List<PropertyVisit> visits = [];
  int bookCalls = 0;
  int approveCalls = 0;

  @override
  Future<List<PropertyVisit>> getMyVisits() async => visits;

  @override
  Future<void> bookVisit({
    required String propertyId,
    required DateTime visitDate,
    String? notes,
  }) async {
    bookCalls++;
    visits = [
      PropertyVisit(
        id: 'visit-1',
        propertyId: propertyId,
        propertyTitle: 'Test home',
        propertyImage: '',
        ownerId: 'owner-1',
        ownerName: 'Owner',
        tenantId: 'tenant-1',
        tenantName: 'Tenant',
        visitDate: visitDate,
        status: 'PENDING',
        notes: notes,
      ),
    ];
  }

  @override
  Future<void> cancelVisit(String visitId) async {}

  @override
  Future<List<PropertyVisit>> getOwnerVisits() async => visits;

  @override
  Future<void> approveVisit(String visitId) async {
    approveCalls++;
  }

  @override
  Future<void> rejectVisit(String visitId) async {}

  @override
  Future<void> completeVisit(String visitId) async {}
}

void main() {
  test('booking controller creates and cancels through the repository', () async {
    final repository = FakeBookingRepository();
    final container = ProviderContainer(
      overrides: [
        bookingRepositoryProvider.overrideWithValue(repository),
      ],
    );
    addTearDown(container.dispose);

    final controller = container.read(createBookingProvider);
    final created = await controller.create(visitId: 'visit-1', notes: 'Test');

    expect(created.id, 'booking-1');
    expect(repository.createCalls, 1);

    await controller.cancel('booking-1');
    expect(repository.cancelCalls, 1);
  });

  test('payment order provider uses the authoritative repository response', () async {
    final container = ProviderContainer(
      overrides: [
        paymentRepositoryProvider.overrideWithValue(FakePaymentRepository()),
      ],
    );
    addTearDown(container.dispose);

    final payment = await container.read(paymentOrderProvider('booking-1').future);

    expect(payment.bookingId, 'booking-1');
    expect(payment.currency, 'INR');
    expect(payment.amountInPaise, 6000000);
  });

  test('visit notifier loads, books, and refreshes tenant visits', () async {
    final repository = FakeVisitRepository();
    final notifier = PropertyVisitNotifier(repository);
    addTearDown(notifier.dispose);

    await notifier.bookVisit(
      propertyId: 'property-1',
      visitDate: DateTime(2026, 10, 3),
      notes: 'Morning',
    );

    expect(repository.bookCalls, 1);
    expect(notifier.state.hasValue, isTrue);
    expect(notifier.state.valueOrNull, hasLength(1));
    expect(notifier.state.valueOrNull!.single.status, 'PENDING');
  });

  test('notifications state derives unread count and preserves copied data', () {
    final now = DateTime(2026, 10, 1);
    final state = NotificationsState(
      notifications: [
        NotificationModel(
          id: '1',
          title: 'Unread',
          message: 'Hello',
          type: 'GENERAL',
          isRead: false,
          createdAt: now,
        ),
        NotificationModel(
          id: '2',
          title: 'Read',
          message: 'World',
          type: 'GENERAL',
          isRead: true,
          createdAt: now,
        ),
      ],
    );

    expect(state.unreadCount, 1);
    expect(state.copyWith(isLoading: true).notifications, hasLength(2));
    expect(state.copyWith(error: 'offline').error, 'offline');
  });
}
