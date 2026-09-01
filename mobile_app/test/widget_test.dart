import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:mobile_app/app.dart';
import 'package:mobile_app/features/admin/presentation/pages/admin_dashboard_page.dart';
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
    testWidgets('Login supports switching from password to OTP', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const ProviderScope(child: MaterialApp(home: AuthenticationPage())),
      );

      await tester.tap(find.text('OTP'));
      await tester.pump();

      expect(find.text('Send OTP'), findsOneWidget);
      expect(find.text('10-digit mobile number'), findsOneWidget);
    });
    testWidgets('Mobile admin console exposes all navigation sections', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: AdminDashboardPage(loadOnStart: false),
          ),
        ),
      );

      expect(find.byType(NavigationBar), findsOneWidget);
      expect(find.text('Users'), findsWidgets);
      expect(find.text('Properties'), findsWidgets);
      expect(find.text('Activity'), findsOneWidget);
      expect(find.text('Analytics'), findsOneWidget);
    });
  });
}
