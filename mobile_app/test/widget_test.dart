import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:mobile_app/app.dart';
import 'package:mobile_app/features/authentication/presentation/pages/authentication_page.dart';

void main() {
  group('RentItEase Widget Tests', () {
    testWidgets('RentItEase app renders successfully', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const ProviderScope(child: RentItEaseApp()),
      );

      // Allow the splash page's delayed initialization to progress.
      await tester.pump(const Duration(seconds: 2));

      // Allow any resulting navigation/rebuilds to complete.
      await tester.pump();

      expect(find.byType(MaterialApp), findsOneWidget);
    });

    testWidgets('Authentication page renders successfully', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const ProviderScope(child: MaterialApp(home: AuthenticationPage())),
      );

      await tester.pump();

      expect(find.byType(AuthenticationPage), findsOneWidget);
    });
  });
}
