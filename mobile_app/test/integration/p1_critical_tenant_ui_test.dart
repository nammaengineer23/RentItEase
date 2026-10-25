import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/features/lease/presentation/pages/create_lease_page.dart';
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

      await tester.tap(find.text('Book Visit'));
      await tester.pump();

      expect(find.byType(SnackBar), findsOneWidget);
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
