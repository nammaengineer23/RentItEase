import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:mobile_app/app.dart';
import 'package:mobile_app/features/admin/presentation/pages/admin_dashboard_page.dart';
import 'package:mobile_app/features/authentication/presentation/pages/authentication_page.dart';
import 'package:mobile_app/features/authentication/presentation/widgets/social_login_button.dart';
import 'package:mobile_app/shared/widgets/custom_text_field.dart';

void main() {
  group('RentItEase Widget Tests', () {
    testWidgets('RentItEase app renders successfully', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const ProviderScope(child: RentItEaseApp()),
      );

      // Advance past the bounded 15-second session-restore timeout. The
      // app should leave the splash state even when the test has no network.
      await tester.pump(const Duration(seconds: 16));

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
    testWidgets('Login shows Google sign-in above email/password form and no OTP login', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const ProviderScope(child: MaterialApp(home: AuthenticationPage())),
      );
      await tester.pump();

      expect(find.byType(SocialLoginButton), findsOneWidget);
      expect(find.byType(CustomTextField), findsNWidgets(2));
      expect(find.text('OTP'), findsNothing);
      expect(find.text('Send OTP'), findsNothing);
      expect(find.text('10-digit mobile number'), findsNothing);
      expect(
        tester.getTopLeft(find.byType(SocialLoginButton)).dy,
        lessThan(tester.getTopLeft(find.byType(CustomTextField).first).dy),
      );
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
