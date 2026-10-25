import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/features/booking/domain/entities/booking_entity.dart';
import 'package:mobile_app/features/booking/domain/repositories/booking_repository.dart';
import 'package:mobile_app/features/booking/presentation/pages/my_bookings_page.dart';
import 'package:mobile_app/features/booking/providers/booking_provider.dart';
import 'package:mobile_app/features/lease/presentation/pages/create_lease_page.dart';
import 'package:mobile_app/features/property/presentation/pages/property_marketplace_page.dart';
import 'package:mobile_app/features/property_visits/presentation/pages/book_visit_page.dart';

void main() {
  group('critical tenant UI flows', () {
    testWidgets('book visit requires a date before submitting', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: BookVisitPage(
              propertyId: 'property-123',
              propertyTitle: 'Sample apartment',
              propertyImage: '',
              ownerName: 'Property owner',
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Sample apartment'), findsOneWidget);
      expect(find.text('Book Visit'), findsOneWidget);

      final bookVisitButton = find.byKey(const ValueKey('book-visit-submit'));
      expect(bookVisitButton, findsOneWidget);

      // Invoke the actual button callback directly. This avoids flaky hit-testing
      // against animated/scrolling content while still exercising the UI action.
      final button = tester.widget<ElevatedButton>(bookVisitButton);
      expect(button.onPressed, isNotNull);
      button.onPressed!();
      await tester.pump();

      expect(
        find.byKey(const ValueKey('visit-date-validation-error')),
        findsOneWidget,
      );
    });

    testWidgets('bookings show an actionable empty state when none exist', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            bookingRepositoryProvider.overrideWithValue(_EmptyBookingRepository()),
          ],
          child: const MaterialApp(home: MyBookingsPage()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('No Bookings Yet'), findsOneWidget);
      expect(find.text('Book a property visit to see your bookings here.'), findsOneWidget);
    });

    testWidgets('marketplace explains when sales and leases are disabled', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(home: PropertyMarketplacePage()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Property Marketplace'), findsOneWidget);
      expect(
        find.text('Property sales and long-term leases are not enabled yet.'),
        findsOneWidget,
      );
      expect(find.text('Existing rental listings and bookings are unchanged.'), findsOneWidget);
    });

    testWidgets('lease creation form exposes dates and optional notes', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreateLeasePage(bookingId: 'booking-123'),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Create Lease'), findsWidgets);
      expect(find.text('Lease start date'), findsOneWidget);
      expect(find.text('Lease end date'), findsOneWidget);
      expect(find.text('Notes (optional)'), findsOneWidget);
      expect(find.text('No end date'), findsOneWidget);
    });
  });
}

class _EmptyBookingRepository implements BookingRepository {
  @override
  Future<List<BookingEntity>> getTenantBookings() async => [];

  @override
  Future<List<BookingEntity>> getOwnerBookings() async => [];

  @override
  Future<BookingEntity> getBooking(String bookingId) =>
      throw UnimplementedError();

  @override
  Future<BookingEntity> createBooking({required String visitId, String? notes}) =>
      throw UnimplementedError();

  @override
  Future<BookingEntity> markPaymentPending(String bookingId) =>
      throw UnimplementedError();

  @override
  Future<BookingEntity> approveBooking(String bookingId) =>
      throw UnimplementedError();

  @override
  Future<BookingEntity> rejectBooking(String bookingId) =>
      throw UnimplementedError();

  @override
  Future<BookingEntity> cancelBooking(String bookingId) =>
      throw UnimplementedError();
}
